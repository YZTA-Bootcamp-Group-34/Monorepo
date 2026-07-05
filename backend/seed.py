import bcrypt
from .database import engine, Base, SessionLocal
from .models import User, DoctorProfile, Patient, Department, AppointmentHistory, MedicalHistoryItem, AISymptomFinding, AIProbability, AIAction

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def seed_db():
    # Recreate database tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Seed Authentication Users
        hashed_pw = hash_password("123456")
        
        u_esra = User(id=1, username="12345678901", hashed_password=hashed_pw, role="patient")
        u_ulas = User(id=2, username="98765432109", hashed_password=hashed_pw, role="patient")
        u_alper = User(id=3, username="45678912300", hashed_password=hashed_pw, role="patient")
        
        u_dr_alper = User(id=4, username="dr.alper@preclinic.com", hashed_password=hashed_pw, role="doctor")
        u_dr_yusuf = User(id=5, username="dr.yusuf@preclinic.com", hashed_password=hashed_pw, role="doctor")
        
        db.add_all([u_esra, u_ulas, u_alper, u_dr_alper, u_dr_yusuf])
        db.commit()

        # Seed Doctor Profiles
        dp_alper = DoctorProfile(
            user_id=4,
            name="Dr. Alper Yılmaz",
            diploma_no="D-9812",
            branch="Kardiyoloji Polikliniği",
            avatar_url="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150",
            bio="Kardiyovasküler tıp uzmanı, 12 yıllık klinik tecrübe."
        )
        dp_yusuf = DoctorProfile(
            user_id=5,
            name="Dr. Yusuf Kurt",
            diploma_no="D-7734",
            branch="Dermatoloji Polikliniği",
            avatar_url="https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150",
            bio="Deri ve zührevi hastalıklar uzmanı, dermatolojik cerrahi alanında uzmanlaşmış."
        )
        db.add_all([dp_alper, dp_yusuf])
        db.commit()

        # 1. Seed Patients
        p1 = Patient(
            id=1,
            user_id=1,
            tc_no="12345678901",
            name="Esra Canpolat",
            age=23,
            gender="Kadın",
            blood_type="0 Rh(+)",
            weight=47.0,
            height=172.0,
            chronic_conditions="Tip 2 Diyabet",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
            status="RUTİN KONTROL",
            criticality=0.25,
            son_randevu="10 Ekim 2023 09:15"
        )
        p2 = Patient(
            id=2,
            user_id=2,
            tc_no="98765432109",
            name="Ulaş Can",
            age=45,
            gender="Erkek",
            blood_type="A Rh(+)",
            weight=82.0,
            height=180.0,
            chronic_conditions="Hipertansiyon",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            status="ACİL",
            criticality=0.85,
            son_randevu="12 Ekim 2023 14:30"
        )
        p3 = Patient(
            id=3,
            user_id=3,
            tc_no="45678912300",
            name="Alper Duman",
            age=68,
            gender="Erkek",
            blood_type="B Rh(-)",
            weight=75.0,
            height=175.0,
            chronic_conditions="Koah",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
            status="TAKİP",
            criticality=0.45,
            son_randevu="09 Ekim 2023 11:00"
        )
        db.add_all([p1, p2, p3])
        db.commit()

        # 2. Seed Medical History for Esra Canpolat (Patient ID: 1)
        m1 = MedicalHistoryItem(
            patient_id=1,
            category="Klinik Tanı",
            title="Hipertansiyon (Esansiyel)",
            details="Hasta 3 yıldır ACE inhibitörü kullanımıyla takip edilmektedir. Sistolik kan basıncı regüledir.",
            color_tag="blue"
        )
        m2 = MedicalHistoryItem(
            patient_id=1,
            category="Cerrahi",
            title="Kolesistektomi (Laparoskopik)",
            details="2019 yılında gerçekleştirilmiştir. Komplikasyon bildirilmemiştir.",
            color_tag="blue"
        )
        m3 = MedicalHistoryItem(
            patient_id=1,
            category="Alerjiler",
            title="Penisilin Grubu",
            details="Anafilaktik reaksiyon öyküsü mevcuttur. Tüm reçetelerde kısıtlanmıştır.",
            color_tag="red"
        )
        db.add_all([m1, m2, m3])

        # 3. Seed AI Symptom Findings for Esra Canpolat
        f1 = AISymptomFinding(patient_id=1, finding="Akut retrosternal yanma hissi", checked=True)
        f2 = AISymptomFinding(patient_id=1, finding="Efor sonrası artan nefes darlığı", checked=True)
        f3 = AISymptomFinding(patient_id=1, finding="Post-prandial bulantı", checked=True)
        db.add_all([f1, f2, f3])

        # 4. Seed AI Probabilities for Esra Canpolat
        pr1 = AIProbability(patient_id=1, condition="Gastroözofageal Reflü", probability=78)
        pr2 = AIProbability(patient_id=1, condition="Anjina Pektoris", probability=14)
        db.add_all([pr1, pr2])

        # 5. Seed AI Action for Esra Canpolat
        act1 = AIAction(
            patient_id=1,
            recommended_dept="Gastroenteroloji Polikliniği",
            required_tests="Üst GİS Endoskopisi, H. Pylori Antijen Testi, Karın USG"
        )
        db.add(act1)

        # Repeat medical details for Ulaş Can (Patient ID: 2)
        m2_1 = MedicalHistoryItem(
            patient_id=2,
            category="Klinik Tanı",
            title="Hipertansiyon",
            details="Aktif ilaç tedavisi altında.",
            color_tag="blue"
        )
        f2_1 = AISymptomFinding(patient_id=2, finding="Sol kolda şiddetli uyuşma ve göğüste daralma", checked=True)
        f2_2 = AISymptomFinding(patient_id=2, finding="Terleme ve baş dönmesi", checked=True)
        pr2_1 = AIProbability(patient_id=2, condition="Akut Koroner Sendrom", probability=85)
        act2 = AIAction(
            patient_id=2,
            recommended_dept="Kardiyoloji Polikliniği",
            required_tests="EKG, Troponin Testi, Koroner Anjiyografi"
        )
        db.add_all([m2_1, f2_1, f2_2, pr2_1, act2])

        # 6. Seed Departments
        d1 = Department(
            name="Kardiyoloji",
            doctor_count=12,
            description="Kalp ve damar hastalıkları tanı ve tedavisi.",
            status_text="Şu an randevu alınabilir",
            status_type="green",
            icon="heartbeat"
        )
        d2 = Department(
            name="Nöroloji",
            doctor_count=8,
            description="Beyin, sinir sistemi ve kas hastalıkları.",
            status_text="Gelecek randevu: Yarın 09:00",
            status_type="gray",
            icon="brain"
        )
        d3 = Department(
            name="Dermatoloji",
            doctor_count=5,
            description="Deri, tırnak ve saç sağlığı ile estetik çözümler.",
            status_text="Şu an randevu alınabilir",
            status_type="green",
            icon="tags"
        )
        d4 = Department(
            name="Göz Hastalıkları",
            doctor_count=6,
            description="Görme bozuklukları, katarakt ve lazer tedavi.",
            status_text="Yoğun randevu talebi",
            status_type="red",
            icon="eye"
        )
        d5 = Department(
            name="Dahiliye",
            doctor_count=15,
            description="İç organ hastalıkları ve genel check-up.",
            status_text="Müsait doktorlar var",
            status_type="green",
            icon="stethoscope"
        )
        d6 = Department(
            name="Onkoloji",
            doctor_count=4,
            description="Kanser tanı, evreleme ve tedavi süreçleri.",
            status_text="Danışma hattı aktif",
            status_type="gray",
            icon="pulse"
        )
        db.add_all([d1, d2, d3, d4, d5, d6])

        # 7. Seed Appointment History
        h1 = AppointmentHistory(
            date_str="OCT 08",
            title="Dermatoloji Kontrolü",
            detail="Can - Egzama Takibi",
            rec_code="REC: #5521",
            doctor_name="DR. YUSUF",
            status="Tamamlandı"
        )
        h2 = AppointmentHistory(
            date_str="OCT 07",
            title="Kardiyovasküler Analiz",
            detail="Ulaş - Hipertansiyon Kontrolü",
            rec_code="REC: #5519",
            doctor_name="DR. ALPER",
            status="Tamamlandı"
        )
        db.add_all([h1, h2])

        db.commit()
        print("Database successfully seeded with Figma design logs!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
