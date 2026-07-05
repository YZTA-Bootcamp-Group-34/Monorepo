from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    tc_no = Column(String, unique=True, index=True)
    name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    blood_type = Column(String)
    weight = Column(Float)
    height = Column(Float)
    chronic_conditions = Column(String)
    avatar_url = Column(String, nullable=True)
    status = Column(String)  # ACİL, RUTİN KONTROL, TAKİP, STABİL
    criticality = Column(Float)  # 0.0 to 1.0
    son_randevu = Column(String)  # e.g., "12 Ekim 2023 14:30"
    referral_status = Column(String, default="PENDING")
    referral_date = Column(String, nullable=True)
    referral_doctor = Column(String, nullable=True)
    followup_status = Column(String, nullable=True)

    medical_history = relationship("MedicalHistoryItem", back_populates="patient", cascade="all, delete-orphan")
    symptom_findings = relationship("AISymptomFinding", back_populates="patient", cascade="all, delete-orphan")
    probabilities = relationship("AIProbability", back_populates="patient", cascade="all, delete-orphan")
    action = relationship("AIAction", uselist=False, back_populates="patient", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    doctor_count = Column(Integer)
    description = Column(String)
    status_text = Column(String)  # "Şu an randevu alınabilir", "Yoğun randevu talebi", "Müsait doktorlar var", etc.
    status_type = Column(String)  # "green", "red", "gray"
    icon = Column(String, nullable=True)  # Name of icon for UI (e.g. heartbeat, brain, flask)

class AppointmentHistory(Base):
    __tablename__ = "appointment_history"

    id = Column(Integer, primary_key=True, index=True)
    date_str = Column(String)  # e.g. "OCT 08" or "OCT 07"
    title = Column(String)  # e.g. "Dermatoloji Kontrolü"
    detail = Column(String)  # e.g. "Can - Egzama Takibi"
    rec_code = Column(String)  # e.g. "REC: #5521"
    doctor_name = Column(String)  # e.g. "DR. YUSUF"
    status = Column(String)  # e.g. "Tamamlandı"

class MedicalHistoryItem(Base):
    __tablename__ = "medical_history_items"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    category = Column(String)  # Klinik Tanı, Cerrahi, Alerjiler
    title = Column(String)  # e.g. "Hipertansiyon (Esansiyel)"
    details = Column(String)  # e.g. "Hasta 3 yıldır ACE..."
    color_tag = Column(String)  # blue, red

    patient = relationship("Patient", back_populates="medical_history")

class AISymptomFinding(Base):
    __tablename__ = "ai_symptom_findings"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    finding = Column(String)  # e.g. "Akut retrosternal yanma hissi"
    checked = Column(Boolean, default=True)

    patient = relationship("Patient", back_populates="symptom_findings")

class AIProbability(Base):
    __tablename__ = "ai_probabilities"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    condition = Column(String)  # e.g. "Gastroözofageal Reflü"
    probability = Column(Integer)  # e.g. 78

    patient = relationship("Patient", back_populates="probabilities")

class AIAction(Base):
    __tablename__ = "ai_actions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    recommended_dept = Column(String)  # e.g. "Gastroenteroloji Polikliniği"
    required_tests = Column(String)  # comma separated e.g. "Üst GİS Endoskopisi, H. Pylori Antijen Testi, Karın USG"

    patient = relationship("Patient", back_populates="action")
