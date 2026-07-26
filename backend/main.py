import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from dotenv import load_dotenv

from .database import engine, Base, get_db
from .models import User, DoctorProfile, Patient, Department, AppointmentHistory, MedicalHistoryItem, AISymptomFinding, AIProbability, AIAction
from .ai import run_carepulse_pipeline
from .ai.similarity import compute_history_alerts
from .ai.llm import is_llm_active

# Load environment variables
load_dotenv()

if is_llm_active():
    print("Gemini API anahtarı bulundu: LangChain CarePulse pipeline aktif.")
else:
    print("GEMINI_API_KEY tanımlı değil: kural tabanlı fallback diyalog modu aktif.")

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

# --- JWT Configs & Helpers ---
JWT_SECRET = "preclinic_super_secret_key_12345"
JWT_ALGORITHM = "HS256"

security = HTTPBearer()

def get_optional_patient(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[Patient]:
    """Bearer token varsa ve hasta rolündeyse Patient kaydını döndürür; yoksa None (anonim mod)."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    payload = decode_access_token(authorization.split(" ", 1)[1])
    if not payload:
        return None
    user = db.query(User).filter(User.id == payload.get("user_id")).first()
    if not user or user.role != "patient":
        return None
    return db.query(Patient).filter(Patient.user_id == user.id).first()

def resolve_token(token: Optional[str], authorization: Optional[str]) -> Optional[str]:
    """Token'ı query parametresinden veya Authorization: Bearer başlığından çözer."""
    if token:
        return token
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1]
    return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token.")
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı.")
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        return None

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

# --- Authentication Schemas ---
class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str  # "doctor" or "patient"
    name: str

class LoginRequest(BaseModel):
    username: str
    password: str

class OnboardingRequest(BaseModel):
    # For doctors
    diploma_no: Optional[str] = None
    branch: Optional[str] = None
    bio: Optional[str] = None
    # For patients
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    chronic_conditions: Optional[str] = None
    # Ortak opsiyonel profil alanları
    avatar_url: Optional[str] = None
    notifications_enabled: Optional[bool] = None

# --- Authentication Endpoints ---
@app.post("/api/auth/register")
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    exists = db.query(User).filter(User.username == req.username).first()
    if exists:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı veya TC no zaten kayıtlı.")
        
    hashed = hash_password(req.password)
    user = User(username=req.username, hashed_password=hashed, role=req.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    if req.role == "doctor":
        profile = DoctorProfile(user_id=user.id, name=req.name)
        db.add(profile)
    else:
        profile = Patient(
            user_id=user.id,
            tc_no=req.username,
            name=req.name,
            age=0,
            gender="",
            blood_type="",
            weight=0.0,
            height=0.0,
            chronic_conditions="",
            status="RUTİN KONTROL",
            criticality=0.0,
            son_randevu="Kayıtlı Yeni Hasta"
        )
        db.add(profile)
        
    db.commit()
    token = create_access_token({"user_id": user.id, "role": user.role})
    return {"token": token, "role": user.role, "name": req.name}

@app.post("/api/auth/login")
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Hatalı kullanıcı adı/TC No veya şifre.")
        
    name = "Kullanıcı"
    if user.role == "doctor":
        profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
        if profile:
            name = profile.name
    else:
        profile = db.query(Patient).filter(Patient.user_id == user.id).first()
        if profile:
            name = profile.name
            
    token = create_access_token({"user_id": user.id, "role": user.role})
    return {"token": token, "role": user.role, "name": name}

@app.get("/api/auth/me")
def get_current_user_profile(token: Optional[str] = None, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    resolved = resolve_token(token, authorization)
    if not resolved:
        raise HTTPException(status_code=401, detail="Token bulunamadı. Lütfen giriş yapın.")
    payload = decode_access_token(resolved)
    if not payload:
        raise HTTPException(status_code=401, detail="Geçersiz token. Lütfen tekrar giriş yapın.")
        
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
        
    profile_data = {}
    if user.role == "doctor":
        profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
        if profile:
            profile_data = {
                "name": profile.name,
                "diploma_no": profile.diploma_no,
                "branch": profile.branch,
                "bio": profile.bio,
                "avatar_url": profile.avatar_url
            }
    else:
        profile = db.query(Patient).filter(Patient.user_id == user.id).first()
        if profile:
            profile_data = {
                "id": profile.id,
                "name": profile.name,
                "tc_no": profile.tc_no,
                "age": profile.age,
                "gender": profile.gender,
                "blood_type": profile.blood_type,
                "weight": profile.weight,
                "height": profile.height,
                "chronic_conditions": profile.chronic_conditions,
                "avatar_url": profile.avatar_url,
                "notifications_enabled": profile.notifications_enabled if profile.notifications_enabled is not None else True,
                "referral_status": profile.referral_status,
                "referral_date": profile.referral_date,
                "referral_doctor": profile.referral_doctor
            }
            
    return {"id": user.id, "username": user.username, "role": user.role, "profile": profile_data}

@app.post("/api/auth/onboarding")
def complete_onboarding(req: OnboardingRequest, token: Optional[str] = None, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    resolved = resolve_token(token, authorization)
    if not resolved:
        raise HTTPException(status_code=401, detail="Token bulunamadı. Lütfen giriş yapın.")
    payload = decode_access_token(resolved)
    if not payload:
        raise HTTPException(status_code=401, detail="Geçersiz token.")
        
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
        
    if user.role == "doctor":
        profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
        if not profile:
            profile = DoctorProfile(user_id=user.id)
            db.add(profile)
        if req.diploma_no:
            profile.diploma_no = req.diploma_no
        if req.branch:
            profile.branch = req.branch
        if req.bio:
            profile.bio = req.bio
        if req.avatar_url:
            profile.avatar_url = req.avatar_url
        db.commit()
    else:
        profile = db.query(Patient).filter(Patient.user_id == user.id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Hasta profili bulunamadı.")
        if req.age is not None:
            profile.age = req.age
        if req.gender:
            profile.gender = req.gender
        if req.blood_type:
            profile.blood_type = req.blood_type
        if req.weight is not None:
            profile.weight = req.weight
        if req.height is not None:
            profile.height = req.height
        if req.chronic_conditions is not None:
            profile.chronic_conditions = req.chronic_conditions
        if req.avatar_url:
            profile.avatar_url = req.avatar_url
        if req.notifications_enabled is not None:
            profile.notifications_enabled = req.notifications_enabled
        db.commit()
        
    return {"success": True, "message": "Onboarding başarıyla tamamlandı."}

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
    alerts: List[str] = []
    referral_status: str
    referral_date: Optional[str] = None
    referral_doctor: Optional[str] = None
    followup_status: Optional[str] = None

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
    followup_status: Optional[str] = None

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
    department: Optional[str] = None
    urgency: Optional[str] = None
    referral_created: bool = False

# --- Endpoints ---

@app.get("/api/patients", response_model=List[PatientListSchema])
def get_patients(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Patient).all()

@app.get("/api/patients/{patient_id}", response_model=PatientDetailSchema)
def get_patient_detail(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Uzun Süreli Medikal Hafıza: kosinüs benzerliği tabanlı uyarılar (backend/ai/similarity.py)
    patient.alerts = compute_history_alerts(patient)
    return patient

@app.get("/api/departments", response_model=List[DepartmentSchema])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

# --- Poliklinik Hekimleri & Randevu Saatleri ---

# DoctorProfile kaydı bulunmayan poliklinikler için tamamlayıcı demo hekim kadrosu
FALLBACK_DOCTORS = {
    "Kardiyoloji": ["Dr. Hasan Şahin", "Dr. Elif Kaya"],
    "Nöroloji": ["Dr. Alper Duman", "Dr. Zeynep Arslan"],
    "Dermatoloji": ["Dr. Yusuf Kurt", "Dr. Selin Demir"],
    "Göz Hastalıkları": ["Dr. Murat Aydın", "Dr. Aylin Çetin"],
    "Dahiliye": ["Dr. Kerem Yıldız", "Dr. Fatma Koç"],
    "Onkoloji": ["Dr. Ahmet Öztürk", "Dr. Leyla Şen"],
}

SLOT_TEMPLATES = [
    ["09:00", "10:30", "13:00", "15:30"],
    ["09:30", "11:00", "14:00", "16:30"],
    ["10:00", "11:30", "14:30", "16:00"],
]

class DoctorSlotSchema(BaseModel):
    name: str
    title: str
    slots: List[str]

@app.get("/api/departments/{department_id}/doctors", response_model=List[DoctorSlotSchema])
def get_department_doctors(department_id: int, db: Session = Depends(get_db)):
    """Polikliniğin hekim kadrosunu ve müsait randevu saatlerini döndürür.

    Önce gerçek DoctorProfile kayıtları (branş eşleşmesi) kullanılır; kayıt yoksa
    demo kadro ile tamamlanır. Saatler hekim başına deterministik şablonlardan üretilir.
    """
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Poliklinik bulunamadı.")

    names = []
    real_doctors = (
        db.query(DoctorProfile)
        .filter(DoctorProfile.branch.isnot(None))
        .filter(DoctorProfile.branch.like(f"{department.name}%"))
        .all()
    )
    names.extend(d.name for d in real_doctors if d.name)
    for fallback_name in FALLBACK_DOCTORS.get(department.name, ["Dr. Nöbetçi Hekim"]):
        if fallback_name not in names:
            names.append(fallback_name)

    return [
        DoctorSlotSchema(
            name=name,
            title=f"{department.name} Uzmanı",
            slots=SLOT_TEMPLATES[i % len(SLOT_TEMPLATES)],
        )
        for i, name in enumerate(names[:4])
    ]

# --- Randevu Oluşturma (sunucu taraflı tarih/kod üretimiyle) ---

TURKISH_MONTHS = {1: "OCA", 2: "ŞUB", 3: "MAR", 4: "NİS", 5: "MAY", 6: "HAZ",
                  7: "TEM", 8: "AĞU", 9: "EYL", 10: "EKİ", 11: "KAS", 12: "ARA"}

class AppointmentBookSchema(BaseModel):
    department: str
    doctor_name: str
    slot_time: str  # örn. "14:00"

@app.post("/api/appointments/book", response_model=AppointmentHistorySchema)
def book_appointment(
    req: AppointmentBookSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mobil uygulamadan randevu oluşturur.

    Tarih (panel takvim bileşeninin beklediği 'TEM 26' formatında) ve REC kodu
    sunucu tarafında üretilir; böylece panel/mobil veri tutarlılığı korunur.
    """
    now = datetime.now()
    date_str = f"{TURKISH_MONTHS[now.month]} {now.day:02d}"

    patient_name = "Hasta"
    if current_user.role == "patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            patient_name = patient.name

    last_id = db.query(AppointmentHistory).count()
    record = AppointmentHistory(
        date_str=date_str,
        title=f"{req.department} Randevusu",
        detail=f"{patient_name} - Saat {req.slot_time}",
        rec_code=f"REC: #{5600 + last_id + 1}",
        doctor_name=req.doctor_name.upper(),
        status="Onaylandı",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

# --- Hekim Paneli Bildirimleri (canlı veriden türetilir) ---

class NotificationSchema(BaseModel):
    id: int
    patient_id: int
    type: str   # "acil" | "kritik_takip" | "alarm" | "sevk"
    title: str
    detail: str

@app.get("/api/notifications", response_model=List[NotificationSchema])
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Zil menüsü için bildirimleri hasta verisinden türetir (ayrı tablo gerekmez)."""
    notifications = []
    counter = 1
    for p in db.query(Patient).all():
        if p.status == "ACİL":
            notifications.append(NotificationSchema(
                id=counter, patient_id=p.id, type="acil",
                title=f"ACİL: {p.name}",
                detail=f"Kritiklik %{int((p.criticality or 0) * 100)} — öncelikli inceleme gerekli.",
            ))
        elif p.status == "KRİTİK TAKİP" or (p.followup_status or "").startswith("ALARM"):
            notifications.append(NotificationSchema(
                id=counter, patient_id=p.id, type="kritik_takip",
                title=f"KRİTİK TAKİP: {p.name}",
                detail=p.followup_status or "Taburcu sonrası takip alarmı.",
            ))
        elif p.referral_status == "CONFIRMED":
            notifications.append(NotificationSchema(
                id=counter, patient_id=p.id, type="sevk",
                title=f"Sevk Onaylandı: {p.name}",
                detail=f"{p.referral_doctor or 'Hekim'} — {p.referral_date or ''}",
            ))
        else:
            continue
        counter += 1
    return notifications

# --- Hekim Panelinden Yeni Hasta Kaydı ---

class PatientCreateSchema(BaseModel):
    name: str
    tc_no: str
    age: int
    gender: str
    blood_type: Optional[str] = ""
    chronic_conditions: Optional[str] = ""
    status: Optional[str] = "RUTİN KONTROL"

@app.post("/api/patients", response_model=PatientListSchema)
def create_patient(
    req: PatientCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Bu işlem için hekim yetkisi gereklidir.")
    if db.query(Patient).filter(Patient.tc_no == req.tc_no).first():
        raise HTTPException(status_code=400, detail="Bu TC kimlik numarası zaten kayıtlı.")

    patient = Patient(
        name=req.name, tc_no=req.tc_no, age=req.age, gender=req.gender,
        blood_type=req.blood_type or "", weight=0.0, height=0.0,
        chronic_conditions=req.chronic_conditions or "",
        status=req.status or "RUTİN KONTROL", criticality=0.1,
        son_randevu="Yeni Manuel Kayıt",
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

class AppointmentHistoryCreateSchema(BaseModel):
    date_str: str
    title: str
    detail: str
    rec_code: str
    doctor_name: str
    status: str

@app.get("/api/appointments/history", response_model=List[AppointmentHistorySchema])
def get_appointment_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(AppointmentHistory).all()

@app.post("/api/appointments/history", response_model=AppointmentHistorySchema)
def create_appointment_history(appt: AppointmentHistoryCreateSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_item = AppointmentHistory(
        date_str=appt.date_str,
        title=appt.title,
        detail=appt.detail,
        rec_code=appt.rec_code,
        doctor_name=appt.doctor_name,
        status=appt.status
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

class ActionResponse(BaseModel):
    success: bool
    message: str

@app.put("/api/patients/{patient_id}/action", response_model=ActionResponse)
def handle_patient_action(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Mark status as referred, reduce urgency metrics to 0
    patient.status = "SEVK EDİLDİ"
    patient.criticality = 0.0
    
    # Confirm referral and assign doctor/date based on recommended department
    patient.referral_status = "CONFIRMED"
    
    recommended_dept = ""
    if patient.action:
        recommended_dept = patient.action.recommended_dept
        
    if "Nöroloji" in recommended_dept:
        patient.referral_doctor = "Dr. Alper Duman"
        patient.referral_date = "Yarın Saat 09:00"
    elif "Kardiyoloji" in recommended_dept:
        patient.referral_doctor = "Dr. Hasan Şahin"
        patient.referral_date = "Bugün (Acil Sevk)"
    else:
        patient.referral_doctor = "Dr. Yusuf Kurt"
        patient.referral_date = "15 Ekim 2026, 10:30"
        
    db.commit()
    return ActionResponse(
        success=True, 
        message=f"Hasta {patient.name} için {recommended_dept or 'Poliklinik'} randevu/sevk işlemi başarıyla onaylandı. Atanan Hekim: {patient.referral_doctor}, Tarih: {patient.referral_date}."
    )

class FollowUpSubmitSchema(BaseModel):
    pain_level: int
    fever: float
    notes: str

@app.post("/api/patients/{patient_id}/followup")
def submit_patient_followup(patient_id: int, data: FollowUpSubmitSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Check if symptoms suggest worsening
    is_worse = (data.pain_level >= 7 or 
                data.fever >= 38.5 or 
                "kötü" in data.notes.lower() or 
                "ağrı" in data.notes.lower() or 
                "sancı" in data.notes.lower())
                
    if is_worse:
        patient.status = "KRİTİK TAKİP"
        patient.criticality = 0.95
        patient.followup_status = f"ALARM: Şiddetli Ağrı/Ateş ({data.pain_level}/10, {data.fever}°C)"
    else:
        patient.status = "STABİL"
        patient.criticality = 0.15
        patient.followup_status = "NORMAL"
        
    db.commit()
    return {
        "success": True,
        "status": patient.status,
        "followup_status": patient.followup_status
    }

@app.post("/api/chat", response_model=ChatResponse)
def chat_with_bot(
    chat: ChatMessage,
    db: Session = Depends(get_db),
    patient: Optional[Patient] = Depends(get_optional_patient),
):
    """CarePulse sohbet ucu.

    LangChain tabanlı çok aşamalı pipeline'a delege eder (backend/ai/pipeline.py):
    kalıcı DB hafızası -> canlı bağlam -> yapılandırılmış triyaj -> SOAP raporu -> sevk kaydı.
    Kimliği doğrulanmış hasta varsa sevk kaydı doğrudan onun dosyasına işlenir.
    """
    session_id = chat.session_id or "default"
    result = run_carepulse_pipeline(
        db=db,
        message=chat.message,
        session_id=session_id,
        patient=patient,
    )
    return ChatResponse(
        sender="bot",
        text=result["text"],
        options=result.get("options", []),
        department=result.get("department"),
        urgency=result.get("urgency"),
        referral_created=result.get("referral_created", False),
    )
