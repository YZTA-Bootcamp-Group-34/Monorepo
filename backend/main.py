import os
import json
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

from .database import engine, Base, get_db
from .models import User, DoctorProfile, Patient, Department, AppointmentHistory, MedicalHistoryItem, AISymptomFinding, AIProbability, AIAction

# Load environment variables
load_dotenv()

# Configure Google GenAI if API key exists
api_key = os.getenv("GEMINI_API_KEY")
gemini_active = False
if api_key:
    try:
        genai.configure(api_key=api_key)
        gemini_active = True
        print("Gemini API successfully configured!")
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")

# Stateful chat session memories
# session_id -> list of message history dicts
chat_sessions = {}

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
def get_current_user_profile(token: str, db: Session = Depends(get_db)):
    payload = decode_access_token(token)
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
                "referral_status": profile.referral_status,
                "referral_date": profile.referral_date,
                "referral_doctor": profile.referral_doctor
            }
            
    return {"id": user.id, "username": user.username, "role": user.role, "profile": profile_data}

@app.post("/api/auth/onboarding")
def complete_onboarding(token: str, req: OnboardingRequest, db: Session = Depends(get_db)):
    payload = decode_access_token(token)
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

# --- Endpoints ---

@app.get("/api/patients", response_model=List[PatientListSchema])
def get_patients(db: Session = Depends(get_db)):
    return db.query(Patient).all()

import math
import re

def get_cosine_similarity(text1: str, text2: str) -> float:
    words = re.compile(r'\w+')
    
    def get_word_freq(text: str):
        freq = {}
        for word in words.findall(text.lower()):
            freq[word] = freq.get(word, 0) + 1
        return freq

    vec1 = get_word_freq(text1)
    vec2 = get_word_freq(text2)

    intersection = set(vec1.keys()) & set(vec2.keys())
    dot_product = sum([vec1[x] * vec2[x] for x in intersection])

    sum1 = sum([vec1[x]**2 for x in vec1.keys()])
    sum2 = sum([vec2[x]**2 for x in vec2.keys()])
    denominator = math.sqrt(sum1) * math.sqrt(sum2)

    if not denominator:
        return 0.0
    return float(dot_product) / denominator

def expand_medical_terms(text: str) -> str:
    expansions = {
        "hipertansiyon": "kalp tansiyon damar kan",
        "egzama": "cilt deri kasinti dokuntu",
        "diyabet": "seker insulin endokrin",
        "nefes darligi": "akciger solunum oksijen kalp",
        "gogus sikismasi": "kalp damar kriz agri",
        "bas agrisi": "beyin migren sinir",
        "reflu": "mide sindirim girtlak yanma"
    }
    lowered = text.lower()
    expanded = lowered
    for term, exp in expansions.items():
        if term in lowered:
            expanded += " " + exp
    return expanded

@app.get("/api/patients/{patient_id}", response_model=PatientDetailSchema)
def get_patient_detail(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Calculate similarity alert flags (Uzun Süreli Medikal Hafıza)
    alerts = []
    
    # Extract current symptom texts
    symptom_texts = [f.finding for f in patient.symptom_findings]
    current_symptoms_str = " ".join(symptom_texts)
    
    if current_symptoms_str:
        # Compare with each medical history item
        for item in patient.medical_history:
            history_str = f"{item.category} {item.title} {item.details}"
            
            # Run cosine similarity on expanded text roots
            current_expanded = expand_medical_terms(current_symptoms_str)
            history_expanded = expand_medical_terms(history_str)
            similarity = get_cosine_similarity(current_expanded, history_expanded)
            
            # If similarity is significant, generate warning alert
            if similarity > 0.12:
                alert_msg = (
                    f"KRİTİK UYARI: Hastanın geçmişindeki '{item.title}' öyküsü ile "
                    f"güncel şikayetleri ({', '.join(symptom_texts[:2])}) arasında "
                    f"bağlamsal benzerlik (%{int(similarity * 100)}) tespit edilmiştir."
                )
                alerts.append(alert_msg)
                
    patient.alerts = alerts
    return patient

@app.get("/api/departments", response_model=List[DepartmentSchema])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

class AppointmentHistoryCreateSchema(BaseModel):
    date_str: str
    title: str
    detail: str
    rec_code: str
    doctor_name: str
    status: str

@app.get("/api/appointments/history", response_model=List[AppointmentHistorySchema])
def get_appointment_history(db: Session = Depends(get_db)):
    return db.query(AppointmentHistory).all()

@app.post("/api/appointments/history", response_model=AppointmentHistorySchema)
def create_appointment_history(item: AppointmentHistoryCreateSchema, db: Session = Depends(get_db)):
    db_item = AppointmentHistory(
        date_str=item.date_str,
        title=item.title,
        detail=item.detail,
        rec_code=item.rec_code,
        doctor_name=item.doctor_name,
        status=item.status
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

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
def submit_patient_followup(patient_id: int, data: FollowUpSubmitSchema, db: Session = Depends(get_db)):
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
def chat_with_bot(chat: ChatMessage, db: Session = Depends(get_db)):
    session_id = chat.session_id or "default"
    text = chat.message.strip()

    # Initialize chat session history
    if session_id not in chat_sessions:
        chat_sessions[session_id] = []
    
    history = chat_sessions[session_id]
    
    # Restart triggers
    if text.lower() in ["yeni", "yeniden başlat", "reset", "iptal et", "ana menü"]:
        chat_sessions[session_id] = []
        return ChatResponse(
            sender="bot",
            text="Sohbet sıfırlandı. CarePulse asistanına hoş geldiniz! Bugün herhangi bir belirtiniz veya şikayetiniz var mı?",
            options=["Başım ağrıyor", "Göğüs sıkışması var", "Randevularım"]
        )

    # Append user message
    history.append({"role": "user", "content": text})

    if gemini_active:
        try:
            # Build conversation context for Gemini
            history_context = ""
            for msg in history[:-1]:
                role_label = "Hasta" if msg["role"] == "user" else "CarePulse Asistanı"
                history_context += f"{role_label}: {msg['content']}\n"

            prompt = f"""
Sen PreClinic sisteminin otonom klinik asistanı "CarePulse" adlı yapay zekasın. 
Görevin, hastanın Türkçe olarak girdiği doğal dildeki semptomları analiz etmek, hastaya geçmiş olsun dileklerini sunmak, şikayetlerini netleştirmek için kısa sorular sormak ve en doğru polikliniğe yönlendirme yapmaktır.

Aşağıdaki kurallara kesinlikle uy:
1. Hastaya her zaman dostça, tıp terminolojisinden uzak ancak profesyonel bir Türkçe ile yanıt ver.
2. Hastanın şikayetlerini çözümlerken aşağıdaki polikliniklerden birini seçmelisin:
   - "Kardiyoloji Polikliniği" (Göğüs ağrısı, sıkışma, sol kolda uyuşma vb.)
   - "Nöroloji Polikliniği" (Şiddetli baş ağrıları, uyuşmalar, kas/sinir problemleri)
   - "Dermatoloji Polikliniği" (Cilt lekeleri, egzama, döküntüler)
   - "Göz Hastalıkları Polikliniği" (Bulanık görme, ağrı, kuruluk)
   - "Dahiliye Polikliniği" (Mide şikayetleri, genel ateş, halsizlik vb.)
   - "Onkoloji Polikliniği" (Kanser tarama ve takip)
3. Eğer hasta belirtilerini tam olarak anlatmadıysa veya konuşma başlangıç aşamasındaysa, "department" alanını null bırak, "text" alanında ek sorular sor ve "options" alanına 2-3 adet kısa seçenek sun.
4. Eğer hasta belirtilerini netleştirdiyse ve sevk kararı verildiyse (örneğin randevu almak istediğini belirttiyse veya kritik şikayetler tamamsa):
   - "department" alanına önerdiğin polikliniğin adını yaz (Örn: "Gastroenteroloji Polikliniği" veya yukarıdaki listelenenler).
   - "symptoms" dizisine hastanın şikayetlerini klinik terimlerle yaz (Örn: ["Akut retrosternal yanma hissi", "Bulantı"]).
   - "probabilities" dizisine olasılık oranlarını ve hastalık tahminlerini ekle (Örn: [{{"condition": "Reflü", "probability": 75}}]).
   - "tests" alanına yapılması gereken öncelikli tahlil/tetkikleri yaz (Örn: "Endoskopi, Karın USG").
   - "urgency" alanını "ACİL", "RUTİN KONTROL" veya "TAKİP" olarak belirle.
   - "criticality" alanını 0.0 ile 1.0 arasında bir değer olarak belirle (Örn: Acil durumlar için 0.85, rutin için 0.25).
5. Konuşma akışını sürdürmek için "options" alanında her zaman hastanın seçebileceği buton isimleri öner.

Konuşma Geçmişi:
{history_context}

Hastanın Son Mesajı:
"{text}"

Yanıtını YALNIZCA ham JSON nesnesi olarak döndür. Markdown etiketleri (```json vb.) kullanma. JSON şeması tam olarak şu şekilde olmalıdır:
{{
  "text": "hastaya verilecek diyalog cevabı",
  "options": ["seçenek1", "seçenek2", "seçenek3"],
  "symptoms": ["semptom1", "semptom2"] veya null,
  "department": "Poliklinik Adı" veya null,
  "probabilities": [{{ "condition": "Hastalık Adı", "probability": 80 }}] veya null,
  "tests": "tetkik1, tetkik2" veya null,
  "urgency": "ACİL" veya "RUTİN KONTROL" veya "TAKİP" veya null,
  "criticality": 0.5 veya null
}}
"""
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            resp_text = response.text.strip()
            if resp_text.startswith("```"):
                lines = resp_text.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                resp_text = "\n".join(lines).strip()
            
            ai_data = json.loads(resp_text)
            
            bot_reply = ai_data.get("text", "Anlaşıldı. Belirtilerinizi kaydettim.")
            options = ai_data.get("options", ["Geri Dön"])
            
            # Append model message to history
            history.append({"role": "model", "content": bot_reply})
            
            # Write to database if diagnostic routing completed
            dept = ai_data.get("department")
            symptoms = ai_data.get("symptoms")
            
            if dept and symptoms and len(symptoms) > 0:
                p_name = f"Sanal Hasta ({dept.split()[0]})"
                tc_suffix = str(abs(hash(p_name)))[-4:]
                tc_no = f"12345678{tc_suffix}"
                
                exists = db.query(Patient).filter(Patient.name == p_name).first()
                if not exists:
                    urgency = ai_data.get("urgency", "RUTİN KONTROL")
                    criticality = ai_data.get("criticality", 0.3)
                    
                    new_patient = Patient(
                        name=p_name,
                        tc_no=tc_no,
                        age=30,
                        gender="Erkek",
                        blood_type="A Rh(+)",
                        weight=70.0,
                        height=175.0,
                        chronic_conditions="Yok",
                        status=urgency,
                        criticality=criticality,
                        son_randevu="Bugün (AI Sevk)",
                        avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                    )
                    db.add(new_patient)
                    db.commit()
                    
                    m1 = MedicalHistoryItem(
                        patient_id=new_patient.id,
                        category="Klinik Tanı",
                        title="AI Ön Anamnez Raporu",
                        details="Sanal Asistan üzerinden otonom sevk kaydı oluşturuldu.",
                        color_tag="blue"
                    )
                    db.add(m1)

                    for sym in symptoms:
                        f = AISymptomFinding(patient_id=new_patient.id, finding=sym, checked=True)
                        db.add(f)

                    probs = ai_data.get("probabilities", [])
                    for p in probs:
                        cond = p.get("condition", "Tanımlanamayan Bulgular")
                        pr = p.get("probability", 50)
                        pr_item = AIProbability(patient_id=new_patient.id, condition=cond, probability=pr)
                        db.add(pr_item)

                    tests = ai_data.get("tests", "Genel Tetkik")
                    act = AIAction(
                        patient_id=new_patient.id,
                        recommended_dept=dept,
                        required_tests=tests
                    )
                    db.add(act)
                    db.commit()
                    
                    bot_reply = f"{bot_reply}\n\n[Sistem Notu: Randevunuz başarıyla oluşturuldu ve {dept} hekim paneline sevk kaydı yapıldı.]"

            return ChatResponse(
                sender="bot",
                text=bot_reply,
                options=options
            )
            
        except Exception as e:
            print(f"Error processing Gemini response: {e}")
            # Fall back to simulated flow if error parsing or calling

    # Fallback simulated dialogues
    text_low = text.lower()
    if not text_low or "merhaba" in text_low or "selam" in text_low:
        bot_reply = "Merhaba! Ben CarePulse. Bugün size nasıl yardımcı olabilirim? Herhangi bir belirtiniz veya sağlık sorununuz var mı?"
        options = ["Başım ağrıyor", "Göğüs sıkışması var", "Randevularım"]
    elif "başım ağrıyor" in text_low or "halsiz" in text_low or "belirti" in text_low:
        bot_reply = "Geçmiş olsun. Bu belirtiler ne zaman başladı? Ayrıca ateşiniz var mı?"
        options = ["Ateşim var", "Bugün başladı", "Randevu al"]
    elif "ateş" in text_low or "ateşim var" in text_low:
        bot_reply = "Anladım. Ateş derecenizi ölçtünüz mü? Baş ağrınızın şiddeti nedir?"
        options = ["Şiddetli Baş Ağrısı", "Hafif, geçici", "Geri Dön"]
    elif "şiddetli baş" in text_low:
        bot_reply = "Şikayetleriniz şiddetli baş ağrısı ve halsizliği işaret ediyor. Sizi öncelikli olarak Nöroloji departmanına yönlendirmemi ister misiniz?"
        options = ["Nöroloji Randevusu Al", "AI Analizini Kaydet", "İptal Et"]
    elif "göğüs" in text_low or "sıkışma" in text_low:
        bot_reply = "Göğüs sıkışması kritik bir semptomdur. Sol kolda uyuşma, nefes darlığı veya soğuk terleme eşlik ediyor mu?"
        options = ["Nefes darlığı var", "Sadece sıkışma", "Kardiyoloji Randevusu Al"]
    elif "randevu" in text_low:
        bot_reply = "Hangi bölüm için randevu almak istersiniz?"
        options = ["Kardiyoloji", "Nöroloji", "Dermatoloji", "Göz Hastalıkları", "Dahiliye"]
    elif "kardiyoloji" in text_low:
        bot_reply = "Kardiyoloji polikliniği için şu an 12 aktif doktorumuz bulunmaktadır. Randevunuzu onaylamak ister misiniz?"
        options = ["Randevuyu Onayla", "Geri Dön"]
    elif "nöroloji" in text_low:
        bot_reply = "Nöroloji polikliniği için en yakın müsaitlik Yarın saat 09:00'dadır. Randevu oluşturulsun mu?"
        options = ["Onayla", "Geri Dön"]
    elif "onayla" in text_low or "nöroloji randevusu al" in text_low:
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
            m1 = MedicalHistoryItem(
                patient_id=new_patient.id,
                category="Klinik Tanı",
                title="Zonklayıcı Baş Ağrısı",
                details="Aralıklı migren atağı şüphesiyle takip ediliyor.",
                color_tag="blue"
            )
            db.add(m1)
            f1 = AISymptomFinding(patient_id=new_patient.id, finding="Şiddetli Baş Ağrısı", checked=True)
            f2 = AISymptomFinding(patient_id=new_patient.id, finding="Halsizlik", checked=True)
            db.add_all([f1, f2])
            pr1 = AIProbability(patient_id=new_patient.id, condition="Migren Atak", probability=78)
            db.add(pr1)
            act = AIAction(
                patient_id=new_patient.id,
                recommended_dept="Nöroloji Polikliniği",
                required_tests="Kranial MR, Hemogram"
            )
            db.add(act)
            db.commit()
        bot_reply = "Nöroloji polikliniği için randevu kaydınız ve AI semptom analiz raporunuz oluşturuldu! Hekim ön bilgilendirme paneline başarıyla gönderildi."
        options = ["Ana Menü"]
    elif "randevuyu onayla" in text_low or "kardiyoloji randevusu al" in text_low:
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
            m1 = MedicalHistoryItem(
                patient_id=new_patient.id,
                category="Klinik Tanı",
                title="Tip 2 Diyabet",
                details="Oral antidiabetik tedavi altında.",
                color_tag="blue"
            )
            db.add(m1)
            f1 = AISymptomFinding(patient_id=new_patient.id, finding="Göğüste sıkışma ve baskı hissi", checked=True)
            f2 = AISymptomFinding(patient_id=new_patient.id, finding="Sol kola yayılan uyuşma", checked=True)
            db.add_all([f1, f2])
            pr1 = AIProbability(patient_id=new_patient.id, condition="Akut Koroner Sendrom", probability=85)
            db.add(pr1)
            act = AIAction(
                patient_id=new_patient.id,
                recommended_dept="Kardiyoloji Polikliniği",
                required_tests="Troponin I Testi, Acil EKG, Eko"
            )
            db.add(act)
            db.commit()
        bot_reply = "Kardiyoloji (Acil) polikliniği randevunuz ve AI klinik ön raporunuz başarıyla oluşturuldu! Hekimin ekranına anlık sevk kaydı düştü."
        options = ["Ana Menü"]
    else:
        bot_reply = "Sizi anladım. Belirtilerinizi daha detaylı açıklayabilir veya doğrudan bölümler menüsünden randevu alabilirsiniz."
        options = ["Ana Menü", "Yardım Al"]

    history.append({"role": "model", "content": bot_reply})
    return ChatResponse(
        sender="bot",
        text=bot_reply,
        options=options
    )

