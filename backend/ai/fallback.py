"""Kural tabanlı çevrimdışı diyalog motoru.

GEMINI_API_KEY tanımlı değilse veya LLM çağrısı başarısız olursa devreye girer;
uygulamanın internet/anahtar olmadan da uçtan uca demo yapabilmesini sağlar.
"""

from sqlalchemy.orm import Session

from ..models import AIAction, AIProbability, AISymptomFinding, MedicalHistoryItem, Patient


def _create_demo_patient(db: Session, kind: str) -> None:
    if kind == "neurology":
        name = "Sanal Asistan (Nöroloji)"
        if db.query(Patient).filter(Patient.name == name).first():
            return
        patient = Patient(
            name=name, tc_no="12345678999", age=34, gender="Erkek",
            blood_type="A Rh(+)", weight=72.0, height=178.0,
            chronic_conditions="Astım", status="RUTİN KONTROL", criticality=0.35,
            son_randevu="Yarın 09:00",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        )
        db.add(patient)
        db.commit()
        db.add(MedicalHistoryItem(
            patient_id=patient.id, category="Klinik Tanı", title="Zonklayıcı Baş Ağrısı",
            details="Aralıklı migren atağı şüphesiyle takip ediliyor.", color_tag="blue",
        ))
        db.add_all([
            AISymptomFinding(patient_id=patient.id, finding="Şiddetli Baş Ağrısı", checked=True),
            AISymptomFinding(patient_id=patient.id, finding="Halsizlik", checked=True),
            AIProbability(patient_id=patient.id, condition="Migren Atak", probability=78),
            AIAction(patient_id=patient.id, recommended_dept="Nöroloji Polikliniği",
                     required_tests="Kranial MR, Hemogram"),
        ])
        db.commit()
    elif kind == "cardiology":
        name = "Sanal Asistan (Kardiyoloji)"
        if db.query(Patient).filter(Patient.name == name).first():
            return
        patient = Patient(
            name=name, tc_no="12345678998", age=58, gender="Erkek",
            blood_type="0 Rh(+)", weight=85.0, height=173.0,
            chronic_conditions="Tip 2 Diyabet", status="ACİL", criticality=0.9,
            son_randevu="Bugün (Acil Sevk)",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        )
        db.add(patient)
        db.commit()
        db.add(MedicalHistoryItem(
            patient_id=patient.id, category="Klinik Tanı", title="Tip 2 Diyabet",
            details="Oral antidiabetik tedavi altında.", color_tag="blue",
        ))
        db.add_all([
            AISymptomFinding(patient_id=patient.id, finding="Göğüste sıkışma ve baskı hissi", checked=True),
            AISymptomFinding(patient_id=patient.id, finding="Sol kola yayılan uyuşma", checked=True),
            AIProbability(patient_id=patient.id, condition="Akut Koroner Sendrom", probability=85),
            AIAction(patient_id=patient.id, recommended_dept="Kardiyoloji Polikliniği",
                     required_tests="Troponin I Testi, Acil EKG, Eko"),
        ])
        db.commit()


def run_fallback_dialogue(db: Session, text: str) -> dict:
    """Basit anahtar kelime akışıyla demo diyalog üretir."""
    text_low = text.lower()

    if not text_low or "merhaba" in text_low or "selam" in text_low:
        reply = ("Merhaba! Ben CarePulse. Bugün size nasıl yardımcı olabilirim? "
                 "Herhangi bir belirtiniz veya sağlık sorununuz var mı?")
        options = ["Başım ağrıyor", "Göğüs sıkışması var", "Randevularım"]
    elif "başım ağrıyor" in text_low or "halsiz" in text_low or "belirti" in text_low:
        reply = "Geçmiş olsun. Bu belirtiler ne zaman başladı? Ayrıca ateşiniz var mı?"
        options = ["Ateşim var", "Bugün başladı", "Randevu al"]
    elif "ateş" in text_low:
        reply = "Anladım. Ateş derecenizi ölçtünüz mü? Baş ağrınızın şiddeti nedir?"
        options = ["Şiddetli Baş Ağrısı", "Hafif, geçici", "Geri Dön"]
    elif "şiddetli baş" in text_low:
        reply = ("Şikayetleriniz şiddetli baş ağrısı ve halsizliği işaret ediyor. "
                 "Sizi öncelikli olarak Nöroloji departmanına yönlendirmemi ister misiniz?")
        options = ["Nöroloji Randevusu Al", "AI Analizini Kaydet", "İptal Et"]
    elif "göğüs" in text_low or "sıkışma" in text_low:
        reply = ("Göğüs sıkışması kritik bir semptomdur. Sol kolda uyuşma, nefes darlığı "
                 "veya soğuk terleme eşlik ediyor mu?")
        options = ["Nefes darlığı var", "Sadece sıkışma", "Kardiyoloji Randevusu Al"]
    elif "randevu" in text_low and "onayla" not in text_low:
        reply = "Hangi bölüm için randevu almak istersiniz?"
        options = ["Kardiyoloji", "Nöroloji", "Dermatoloji", "Göz Hastalıkları", "Dahiliye"]
    elif "kardiyoloji" in text_low and "al" not in text_low:
        reply = ("Kardiyoloji polikliniği için şu an 12 aktif doktorumuz bulunmaktadır. "
                 "Randevunuzu onaylamak ister misiniz?")
        options = ["Randevuyu Onayla", "Geri Dön"]
    elif "nöroloji" in text_low and "al" not in text_low:
        reply = ("Nöroloji polikliniği için en yakın müsaitlik Yarın saat 09:00'dadır. "
                 "Randevu oluşturulsun mu?")
        options = ["Onayla", "Geri Dön"]
    elif "onayla" in text_low or "nöroloji randevusu al" in text_low:
        if "randevuyu onayla" in text_low or "kardiyoloji" in text_low:
            _create_demo_patient(db, "cardiology")
            reply = ("Kardiyoloji (Acil) polikliniği randevunuz ve AI klinik ön raporunuz "
                     "başarıyla oluşturuldu! Hekimin ekranına anlık sevk kaydı düştü.")
        else:
            _create_demo_patient(db, "neurology")
            reply = ("Nöroloji polikliniği için randevu kaydınız ve AI semptom analiz raporunuz "
                     "oluşturuldu! Hekim ön bilgilendirme paneline başarıyla gönderildi.")
        options = ["Ana Menü"]
    elif "kardiyoloji randevusu al" in text_low:
        _create_demo_patient(db, "cardiology")
        reply = ("Kardiyoloji (Acil) polikliniği randevunuz ve AI klinik ön raporunuz "
                 "başarıyla oluşturuldu! Hekimin ekranına anlık sevk kaydı düştü.")
        options = ["Ana Menü"]
    else:
        reply = ("Sizi anladım. Belirtilerinizi daha detaylı açıklayabilir veya doğrudan "
                 "bölümler menüsünden randevu alabilirsiniz.")
        options = ["Ana Menü", "Yardım Al"]

    return {"text": reply, "options": options}
