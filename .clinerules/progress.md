# Progress: PreClinic Monorepo Roadmap

## Tamamlanan Temel Yapı (Sprint 1 & 2)
- [x] Monorepo klasör yapısının kurulumu (`backend`, `doctor-panel`, `mobile-app`).
- [x] SQLite veritabanı şemalarının SQLAlchemy ile kodlanması (`models.py`, `database.py`).
- [x] Figma tasarım verileriyle eşleşen veri tohumlama betiğinin hazırlanmesi (`seed.py`).
- [x] Hekim Paneli Next.js sayfalarının, Tailwind CSS v4 entegrasyonunun ve sidebar tasarımının tamamlanması.
- [x] Mobil Expo uygulamasının gezinme sekmelerinin (CarePulse Chat, Bölümler, Geçmiş, Profil) Figma'daki nane yeşili kapsül tasarımına birebir uygun olarak kodlanması.
- [x] Hekim onay eylemi için `PUT /api/patients/{id}/action` (sevk onaylama ve test talebi kaydetme) uç noktasının eklenmesi.
- [x] Sohbet sonlandığında dinamik olarak veritabanına yeni semptom analizi ve SOAP kaydı ekleme mekanizması (Nöroloji / Kardiyoloji randevu onayları ile SQLite yazımları).
- [x] FastAPI backend'e Google Gemini API ve session tabanlı diyalog geçmişi entegrasyonu.
- [x] Doğal dilden semptom ayrıştırıp yapılandırılmış JSON SOAP verileri (tetkikler, poliklinikler, olasılık oranları) çıkaran prompt mühendisliği yapıldı.
- [x] Saf Python tabanlı **Cosine Similarity** (Kosinüs Benzerliği) algoritması ve tıbbi eşanlamlı genişletme motoru (`expand_medical_terms`) kodlandı; hastanın geçmiş tanısı ile güncel şikayetleri karşılaştırılarak kritik risk uyarıları hekim paneline entegre edildi.
- [x] Mobil uygulamada poliklinik kartları genişletilebilir yapıldı; müsait hekimler ve randevu saatleri listelendi. Tıklanan saat diliminin SQLite veritabanına (`POST /api/appointments/history`) yazılması sağlandı.
- [x] Hekim paneli sevk onayından sonra mobil uygulamaya 6 saniyede bir tetiklenen polling ile durum güncellenmesi çekildi ve hastaya kırmızı renkli detaylı sevk randevusu bilgilendirme kartı ulaştırıldı.
- [x] Backend tarafında postoperative takip API'si (`POST /api/patients/{id}/followup`) yazıldı, gelen verilerde anomali kontrolü yapıldı (Ateş >= 38.5, Ağrı >= 7 veya negatif durum notları).
- [x] Mobil uygulamada (Profil ekranında) hekimle durum paylaşımı yapacak "Taburcu Sonrası Takip Anketi" (Ağrı Kaydırıcı Butonu, Ateş Alanı ve Not Girişi) geliştirildi, alarm durumunda hekime anlık SQLite alarm kaydı gönderildi.
- [x] Hekim panelinde (Dashboard) alarm durumu algılanan hastalar için kırmızı renkli yanıp sönen `KRİTİK TAKİP` alarm rozeti ve uyarı durum etiketleri entegre edildi.

---

## Yol Haritası ve Gelecek Fazlar

### 🟢 FAZ 5: Kimlik Doğrulama (Auth) & Onboarding Süreçleri (Tamamlandı)
*Hedef: Hekim paneli için doktor kaydı/girişi ve onboarding sihirbazı; Mobil uygulama için hasta kaydı/girişi, onboarding slaytları ve profil kurulum sihirbazının yapılması.*

- [x] **Backend Auth Altyapısı:**
  - [x] `models.py` dosyasına `User` ve `DoctorProfile` tablolarının eklenmesi, şifre hashleme ve JWT üreteci mekanizmasının kodlanması.
  - [x] `POST /api/auth/register`, `POST /api/auth/login` ve `GET /api/auth/me` uç noktalarının geliştirilmesi.
- [x] **Doktor Web Paneli (Next.js):**
  - [x] Giriş Yap (`/login`) ve Kayıt Ol (`/register`) sayfalarının modern shadcn/ui kart tasarımları ile kodlanması.
  - [x] Yeni kayıt olan doktorlar için branş seçimi, diploma/lisans no girişi ve profil resmi yükleme onboarding adımının (`/onboarding`) tasarlanması.
  - [x] Oturum açmamış kullanıcıların dashboard ekranlarını görüntülemesini engelleyen Middleware koruması.
- [x] **Mobil Hasta Uygulaması (Expo):**
  - [x] Giriş Yap ve Kayıt Ol ekranlarının tasarımı ve api entegrasyonu.
  - [x] Figma tarzında 3 aşamalı onboarding tanıtım slaytı (CarePulse Asistanı, Kolay Sevk/Randevu, Taburcu Takip) ve profil kurulum formu (boy, kilo, yaş, kan grubu, kronik hastalıklar).

### 🟡 FAZ 6: Production Cilalama & Uçtan Uca Koruma
*Hedef: Tüm monoreponun prod-ready seviyeye çıkarılması, token güvenliği, arayüz iskelet yüklemeleri (skeleton), toast uyarıları ve veri doğrulama kontrollerinin yapılması.*
- [ ] Next.js ve Expo üzerinde tüm isteklerin authorization header (Bearer JWT) ile gönderilmesinin zorunlu kılınması.
- [ ] Mobil uygulamada ve web panelinde veri çekme anlarında boş ekran yerine iskelet (skeleton) yükleme durumları.
- [ ] Başarı/hata durumlarında kullanıcıya premium toast mesajlarının gösterilmesi (sonner / react-hot-toast).
- [ ] SQLite seed scriptinin (`seed.py`) yeni auth yapılarıyla uyumlu olarak çalışacak şekilde güncellenmesi.
