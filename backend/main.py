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
        # Suggesting Neurology
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
    else:
        return ChatResponse(
            sender="bot",
            text="Sizi anladım. Belirtilerinizi daha detaylı açıklayabilir veya doğrudan bölümler menüsünden randevu alabilirsiniz.",
            options=["Ana Menü", "Yardım Al"]
        )
