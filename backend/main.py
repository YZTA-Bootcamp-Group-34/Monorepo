import os
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from .database import engine, Base, get_db
from .models import Patient, Department, AppointmentHistory, MedicalHistoryItem, AISymptomFinding, AIProbability, AIAction

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PreClinic API", version="1.0.0")

# CORS middleware config to allow NextJS and Expo apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev simplicity, allow all. Change in prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---

class MedicalHistoryItemSchema(BaseModel):
    category: str
    title: str
    details: str
    color_tag: str

    class Config:
        from_attributes = True

class AISymptomFindingSchema(BaseModel):
    finding: str
    checked: bool

    class Config:
        from_attributes = True

class AIProbabilitySchema(BaseModel):
    condition: str
    probability: int

    class Config:
        from_attributes = True

class AIActionSchema(BaseModel):
    recommended_dept: str
    required_tests: str

    class Config:
        from_attributes = True

class PatientDetailSchema(BaseModel):
    id: int
    tc_no: str
    name: str
    age: int
    gender: str
    blood_type: str
    weight: float
    height: float
    chronic_conditions: str
    avatar_url: Optional[str] = None
    status: str
    criticality: float
    son_randevu: str
    medical_history: List[MedicalHistoryItemSchema] = []
    symptom_findings: List[AISymptomFindingSchema] = []
    probabilities: List[AIProbabilitySchema] = []
    action: Optional[AIActionSchema] = None

    class Config:
        from_attributes = True

class PatientListSchema(BaseModel):
    id: int
    tc_no: str
    name: str
    age: int
    gender: str
    status: str
    criticality: float
    son_randevu: str

    class Config:
        from_attributes = True

class DepartmentSchema(BaseModel):
    id: int
    name: str
    doctor_count: int
    description: str
    status_text: str
    status_type: str
    icon: Optional[str] = None

    class Config:
        from_attributes = True

class AppointmentHistorySchema(BaseModel):
    id: int
    date_str: str
    title: str
    detail: str
    rec_code: str
    doctor_name: str
    status: str

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = "default"

class ChatResponse(BaseModel):
    sender: str  # "bot" or "user"
    text: str
    options: List[str] = []

# --- Endpoints ---

@app.get("/api/patients", response_model=List[PatientListSchema])
def get_patients(db: Session = Depends(get_db)):
    return db.query(Patient).all()

@app.get("/api/patients/{patient_id}", response_model=PatientDetailSchema)
def get_patient_detail(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@app.get("/api/departments", response_model=List[DepartmentSchema])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@app.get("/api/appointments/history", response_model=List[AppointmentHistorySchema])
def get_appointment_history(db: Session = Depends(get_db)):
    return db.query(AppointmentHistory).all()

class ActionResponse(BaseModel):
    success: bool
    message: str

@app.put("/api/patients/{patient_id}/action", response_model=ActionResponse)
def handle_patient_action(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Mark status as referred, reduce urgency metrics to 0
    patient.status = "SEVK EDİLDİ"
    patient.criticality = 0.0
    db.commit()
    return ActionResponse(
        success=True, 
        message=f"Hasta {patient.name} için randevu/sevk işlemi başarıyla onaylandı ve sistem durum kaydı güncellendi."
    )

@app.post("/api/chat", response_model=ChatResponse)
def chat_with_bot(chat: ChatMessage, db: Session = Depends(get_db)):
    text = chat.message.strip().lower()

    # Simple interactive dialog flow simulation matching the screenshots
    if not text or "merhaba" in text or "selam" in text:
        return ChatResponse(
            sender="bot",
            text="Merhaba! Ben CarePulse. Bugün size nasıl yardımcı olabilirim? Herhangi bir belirtiniz veya sağlık sorununuz var mı?",
            options=["Başım ağrıyor", "Göğüs sıkışması var", "Randevularım"]
        )
    elif "başım ağrıyor" in text or "halsiz" in text or "belirti" in text:
        return ChatResponse(
            sender="bot",
            text="Geçmiş olsun. Bu belirtiler ne zaman başladı? Ayrıca ateşiniz var mı?",
            options=["Ateşim var", "Bugün başladı", "Randevu al"]
        )
    elif "ateş" in text or "ateşim var" in text:
        return ChatResponse(
            sender="bot",
            text="Anladım. Ateş derecenizi ölçtünüz mü? Baş ağrınızın şiddeti nedir?",
            options=["Şiddetli Baş Ağrısı", "Hafif, geçici", "Geri Dön"]
        )
    elif "şiddetli baş" in text:
        return ChatResponse(
            sender="bot",
            text="Şikayetleriniz şiddetli baş ağrısı ve halsizliği işaret ediyor. Sizi öncelikli olarak Nöroloji departmanına yönlendirmemi ister misiniz?",
            options=["Nöroloji Randevusu Al", "AI Analizini Kaydet", "İptal Et"]
        )
    elif "göğüs" in text or "sıkışma" in text:
        return ChatResponse(
            sender="bot",
            text="Göğüs sıkışması kritik bir semptomdur. Sol kolda uyuşma, nefes darlığı veya soğuk terleme eşlik ediyor mu?",
            options=["Nefes darlığı var", "Sadece sıkışma", "Kardiyoloji Randevusu Al"]
        )
    elif "randevu" in text:
        return ChatResponse(
            sender="bot",
            text="Hangi bölüm için randevu almak istersiniz?",
            options=["Kardiyoloji", "Nöroloji", "Dermatoloji", "Göz Hastalıkları", "Dahiliye"]
        )
    elif "kardiyoloji" in text:
        return ChatResponse(
            sender="bot",
            text="Kardiyoloji polikliniği için şu an 12 aktif doktorumuz bulunmaktadır. Randevunuzu onaylamak ister misiniz?",
            options=["Randevuyu Onayla", "Geri Dön"]
        )
    elif "nöroloji" in text:
        return ChatResponse(
            sender="bot",
            text="Nöroloji polikliniği için en yakın müsaitlik Yarın saat 09:00'dadır. Randevu oluşturulsun mu?",
            options=["Onayla", "Geri Dön"]
        )
    elif "onayla" in text or "nöroloji randevusu al" in text:
        # Dynamic patient creation: Sanal Asistan (Nöroloji)
        exists = db.query(Patient).filter(Patient.name == "Sanal Asistan (Nöroloji)").first()
        if not exists:
            new_patient = Patient(
                name="Sanal Asistan (Nöroloji)",
                tc_no="12345678999",
                age=34,
                gender="Erkek",
                blood_type="A Rh(+)",
                weight=72.0,
                height=178.0,
                chronic_conditions="Astım",
                status="RUTİN KONTROL",
                criticality=0.35,
                son_randevu="Yarın 09:00",
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
            )
            db.add(new_patient)
            db.commit()
            
            # History
            m1 = MedicalHistoryItem(
                patient_id=new_patient.id,
                category="Klinik Tanı",
                title="Zonklayıcı Baş Ağrısı",
                details="Aralıklı migren atağı şüphesiyle takip ediliyor.",
                color_tag="blue"
            )
            db.add(m1)

            # Symptoms
            f1 = AISymptomFinding(patient_id=new_patient.id, finding="Şiddetli Baş Ağrısı", checked=True)
            f2 = AISymptomFinding(patient_id=new_patient.id, finding="Halsizlik", checked=True)
            db.add_all([f1, f2])

            # Probabilities
            pr1 = AIProbability(patient_id=new_patient.id, condition="Migren Atak", probability=78)
            db.add(pr1)

            # Action
            act = AIAction(
                patient_id=new_patient.id,
                recommended_dept="Nöroloji Polikliniği",
                required_tests="Kranial MR, Hemogram"
            )
            db.add(act)
            db.commit()

        return ChatResponse(
            sender="bot",
            text="Nöroloji polikliniği için randevu kaydınız ve AI semptom analiz raporunuz oluşturuldu! Hekim ön bilgilendirme paneline başarıyla gönderildi.",
            options=["Ana Menü"]
        )
    elif "randevuyu onayla" in text or "kardiyoloji randevusu al" in text:
        # Dynamic patient creation: Sanal Asistan (Kardiyoloji)
        exists = db.query(Patient).filter(Patient.name == "Sanal Asistan (Kardiyoloji)").first()
        if not exists:
            new_patient = Patient(
                name="Sanal Asistan (Kardiyoloji)",
                tc_no="12345678998",
                age=58,
                gender="Erkek",
                blood_type="0 Rh(+)",
                weight=85.0,
                height=173.0,
                chronic_conditions="Tip 2 Diyabet",
                status="ACİL",
                criticality=0.9,
                son_randevu="Bugün (Acil Sevk)",
                avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
            )
            db.add(new_patient)
            db.commit()
            
            # History
            m1 = MedicalHistoryItem(
                patient_id=new_patient.id,
                category="Klinik Tanı",
                title="Tip 2 Diyabet",
                details="Oral antidiabetik tedavi altında.",
                color_tag="blue"
            )
            db.add(m1)

            # Symptoms
            f1 = AISymptomFinding(patient_id=new_patient.id, finding="Göğüste sıkışma ve baskı hissi", checked=True)
            f2 = AISymptomFinding(patient_id=new_patient.id, finding="Sol kola yayılan uyuşma", checked=True)
            db.add_all([f1, f2])

            # Probabilities
            pr1 = AIProbability(patient_id=new_patient.id, condition="Akut Koroner Sendrom", probability=85)
            db.add(pr1)

            # Action
            act = AIAction(
                patient_id=new_patient.id,
                recommended_dept="Kardiyoloji Polikliniği",
                required_tests="Troponin I Testi, Acil EKG, Eko"
            )
            db.add(act)
            db.commit()

        return ChatResponse(
            sender="bot",
            text="Kardiyoloji (Acil) polikliniği randevunuz ve AI klinik ön raporunuz başarıyla oluşturuldu! Hekimin ekranına anlık sevk kaydı düştü.",
            options=["Ana Menü"]
        )
    else:
        return ChatResponse(
            sender="bot",
            text="Sizi anladım. Belirtilerinizi daha detaylı açıklayabilir veya doğrudan bölümler menüsünden randevu alabilirsiniz.",
            options=["Ana Menü", "Yardım Al"]
        )

