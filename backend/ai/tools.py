"""Zincirlere bağlam sağlayan veri erişim araçları (LangChain 'tool' katmanı).

LLM'e statik prompt yerine canlı veritabanı durumu enjekte edilir:
- Poliklinik kataloğu ve doluluk durumu
- Kimliği doğrulanmış hastanın biyometrik profili ve tıbbi özgeçmişi
"""

from typing import Optional

from sqlalchemy.orm import Session

from ..models import Department, Patient


def get_department_catalog(db: Session) -> str:
    """Veritabanındaki poliklinikleri LLM'in seçim yapabileceği formatta döndürür."""
    departments = db.query(Department).all()
    if not departments:
        return (
            "- Kardiyoloji Polikliniği\n- Nöroloji Polikliniği\n- Dermatoloji Polikliniği\n"
            "- Göz Hastalıkları Polikliniği\n- Dahiliye Polikliniği\n- Onkoloji Polikliniği"
        )
    lines = []
    for d in departments:
        name = d.name if "Poliklini" in (d.name or "") else f"{d.name} Polikliniği"
        lines.append(f"- {name} ({d.doctor_count} hekim, durum: {d.status_text})")
    return "\n".join(lines)


def get_patient_context(patient: Optional[Patient]) -> str:
    """Hastanın profil ve özgeçmiş özetini triyaj zincirine bağlam olarak verir."""
    if patient is None:
        return "Hasta oturum açmamış (anonim mod). Kişisel geçmiş bilgisi yok."

    parts = [
        f"Ad: {patient.name}",
        f"Yaş: {patient.age or 'bilinmiyor'}",
        f"Cinsiyet: {patient.gender or 'bilinmiyor'}",
        f"Kan Grubu: {patient.blood_type or 'bilinmiyor'}",
        f"Kronik Hastalıklar: {patient.chronic_conditions or 'Yok'}",
    ]
    if patient.medical_history:
        items = "; ".join(
            f"{h.category}: {h.title} ({h.details})" for h in patient.medical_history[:6]
        )
        parts.append(f"Tıbbi Özgeçmiş: {items}")
    return "\n".join(parts)
