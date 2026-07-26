"""CarePulse orkestrasyon pipeline'ı.

Akış (her hasta mesajı için):
    1. Hafıza    : DB'den session diyalog geçmişi yüklenir
    2. Bağlam    : Canlı poliklinik kataloğu + hasta profili toplanır
    3. Triyaj    : LCEL zinciri yapılandırılmış TriageDecision üretir
    4. Sevk      : Karar netleştiyse hasta kaydı/semptom/olasılık/aksiyon DB'ye yazılır
    5. SOAP      : İkinci zincir klinik SOAP raporu üretip tıbbi özgeçmişe ekler
    6. Kalıcılık : Tüm mesajlar chat_messages tablosuna işlenir

LLM yoksa/başarısızsa kural tabanlı fallback devreye girer.
"""

import logging
from typing import Optional

from sqlalchemy.orm import Session

from ..models import AIAction, AIProbability, AISymptomFinding, MedicalHistoryItem, Patient
from . import memory
from .fallback import run_fallback_dialogue
from .llm import candidate_models, is_llm_active
from .schemas import SOAPReport, TriageDecision
from .tools import get_department_catalog, get_patient_context

logger = logging.getLogger("carepulse")

RESET_TRIGGERS = {"yeni", "yeniden başlat", "reset", "iptal et", "ana menü"}

WELCOME = (
    "Sohbet sıfırlandı. CarePulse asistanına hoş geldiniz! "
    "Bugün herhangi bir belirtiniz veya şikayetiniz var mı?"
)
WELCOME_OPTIONS = ["Başım ağrıyor", "Göğüs sıkışması var", "Randevularım"]


def _run_triage(db: Session, message: str, history: list, patient: Optional[Patient]) -> Optional[TriageDecision]:
    """Triyaj zincirini model yedekleme listesiyle çalıştırır."""
    from .chains import build_triage_chain

    inputs = {
        "message": message,
        "history": memory.to_langchain_messages(history),
        "department_catalog": get_department_catalog(db),
        "patient_context": get_patient_context(patient),
    }
    for model_name in candidate_models():
        try:
            return build_triage_chain(model_name).invoke(inputs)
        except Exception as exc:  # model kapalı/aşırı yük/parse hatası -> sıradaki model
            logger.warning("Triyaj zinciri '%s' başarısız: %s", model_name, exc)
    return None


def _run_soap(transcript: str, decision: TriageDecision) -> Optional[SOAPReport]:
    from .chains import build_soap_chain

    inputs = {
        "transcript": transcript,
        "department": decision.department,
        "symptoms": ", ".join(decision.symptoms or []),
        "urgency": decision.urgency or "RUTİN KONTROL",
        "tests": decision.tests or "Genel Tetkik",
    }
    for model_name in candidate_models():
        try:
            return build_soap_chain(model_name).invoke(inputs)
        except Exception as exc:
            logger.warning("SOAP zinciri '%s' başarısız: %s", model_name, exc)
    return None


def _persist_referral(
    db: Session,
    decision: TriageDecision,
    soap: Optional[SOAPReport],
    patient: Optional[Patient],
) -> Patient:
    """Triyaj kararını hekim panelinin okuduğu tablolara yazar.

    Kimliği doğrulanmış hasta varsa ONUN kaydı güncellenir; yoksa demo amaçlı
    sanal hasta oluşturulur (eski davranışla geriye dönük uyumlu).
    """
    urgency = decision.urgency or "RUTİN KONTROL"
    criticality = decision.criticality if decision.criticality is not None else 0.3

    if patient is None:
        dept_word = (decision.department or "Genel").split()[0]
        p_name = f"Sanal Hasta ({dept_word})"
        tc_no = f"12345678{str(abs(hash(p_name)))[-4:]}"
        patient = db.query(Patient).filter(Patient.name == p_name).first()
        if patient is None:
            patient = Patient(
                name=p_name, tc_no=tc_no, age=30, gender="Erkek",
                blood_type="A Rh(+)", weight=70.0, height=175.0,
                chronic_conditions="Yok", status=urgency, criticality=criticality,
                son_randevu="Bugün (AI Sevk)",
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            )
            db.add(patient)
            db.commit()
    else:
        patient.status = urgency
        patient.criticality = criticality
        patient.son_randevu = "Bugün (AI Sevk)"
        # Yeni triyaj: önceki AI bulgularını güncel kararla değiştir
        db.query(AISymptomFinding).filter(AISymptomFinding.patient_id == patient.id).delete()
        db.query(AIProbability).filter(AIProbability.patient_id == patient.id).delete()
        db.query(AIAction).filter(AIAction.patient_id == patient.id).delete()
        db.commit()

    for sym in decision.symptoms or []:
        db.add(AISymptomFinding(patient_id=patient.id, finding=sym, checked=True))

    for prob in decision.probabilities or []:
        db.add(AIProbability(
            patient_id=patient.id,
            condition=prob.condition or "Tanımlanamayan Bulgular",
            probability=prob.probability,
        ))

    db.add(AIAction(
        patient_id=patient.id,
        recommended_dept=decision.department,
        required_tests=decision.tests or "Genel Tetkik",
    ))

    if soap is not None:
        icd = ", ".join(soap.icd10_codes) if soap.icd10_codes else "-"
        db.add(MedicalHistoryItem(
            patient_id=patient.id,
            category="AI SOAP Raporu",
            title=f"AI Ön Anamnez ({decision.department})",
            details=(
                f"S: {soap.subjective} | O: {soap.objective} | "
                f"A: {soap.assessment} | P: {soap.plan} | ICD-10: {icd}"
            ),
            color_tag="red" if urgency == "ACİL" else "blue",
        ))
    else:
        db.add(MedicalHistoryItem(
            patient_id=patient.id,
            category="Klinik Tanı",
            title="AI Ön Anamnez Raporu",
            details="CarePulse asistanı üzerinden otonom sevk kaydı oluşturuldu.",
            color_tag="blue",
        ))

    db.commit()
    return patient


def run_carepulse_pipeline(
    db: Session,
    message: str,
    session_id: str = "default",
    patient: Optional[Patient] = None,
) -> dict:
    text = (message or "").strip()

    # Sıfırlama tetikleyicileri
    if text.lower() in RESET_TRIGGERS:
        memory.reset_history(db, session_id)
        return {"text": WELCOME, "options": WELCOME_OPTIONS,
                "department": None, "urgency": None, "referral_created": False}

    history = memory.get_history(db, session_id)
    memory.append_message(db, session_id, "user", text)

    decision: Optional[TriageDecision] = None
    if is_llm_active():
        decision = _run_triage(db, text, history, patient)

    if decision is None:
        # LLM yok veya tüm modeller başarısız -> kural tabanlı demo akışı
        result = run_fallback_dialogue(db, text)
        memory.append_message(db, session_id, "assistant", result["text"])
        return {**result, "department": None, "urgency": None, "referral_created": False}

    reply = decision.text or "Anlaşıldı. Belirtilerinizi kaydettim."
    options = decision.options or ["Geri Dön"]
    referral_created = False

    if decision.department and decision.symptoms:
        transcript_lines = [
            f"{'Hasta' if m['role'] == 'user' else 'CarePulse'}: {m['content']}"
            for m in history
        ] + [f"Hasta: {text}", f"CarePulse: {reply}"]
        soap = _run_soap("\n".join(transcript_lines), decision)
        _persist_referral(db, decision, soap, patient)
        referral_created = True
        reply = (
            f"{reply}\n\n[Sistem Notu: Randevunuz başarıyla oluşturuldu ve "
            f"{decision.department} hekim paneline SOAP ön anamnez raporuyla birlikte "
            f"sevk kaydı yapıldı.]"
        )

    memory.append_message(db, session_id, "assistant", reply)
    return {
        "text": reply,
        "options": options,
        "department": decision.department,
        "urgency": decision.urgency,
        "referral_created": referral_created,
    }
