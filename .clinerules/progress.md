# Progress: PreClinic Monorepo Roadmap

## Tamamlanan Temel Yapı (Sprint 1)
- [x] Monorepo klasör yapısının kurulumu (`backend`, `doctor-panel`, `mobile-app`).
- [x] SQLite veritabanı şemalarının SQLAlchemy ile kodlanması (`models.py`, `database.py`).
- [x] Figma tasarım verileriyle eşleşen veri tohumlama betiğinin hazırlanması (`seed.py`).
- [x] Hekim Paneli Next.js sayfalarının, Tailwind CSS v4 entegrasyonunun ve sidebar tasarımının tamamlanması.
- [x] Mobil Expo uygulamasının gezinme sekmelerinin (CarePulse Chat, Bölümler, Geçmiş, Profil) Figma'daki nane yeşili kapsül tasarımına birebir uygun olarak kodlanması.

---

## Yol Haritası ve Gelecek Fazlar

### 🟢 FAZ 1: Dinamik API Bağlantıları ve Gerçek Zamanlı Veri Akışı (Tamamlandı)
*Hedef: Hasta uygulaması ile Hekim paneli arasındaki veri bağını kurmak, statik mock verileri gerçek zamanlı API çağrılarıyla değiştirmek.*
- [x] **Backend Geliştirmeleri:**
  - [x] Hekim onay eylemi için `PUT /api/patients/{id}/action` (sevk onaylama ve test talebi kaydetme) uç noktasının eklenmesi.
  - [x] Sohbet sonlandığında dinamik olarak veritabanına yeni semptom analizi ve SOAP kaydı ekleme mekanizması (Nöroloji / Kardiyoloji randevu onayları ile SQLite yazımları).
- [x] **Hekim Paneli (Next.js) Entegrasyonu:**
  - [x] Dashboard sayfasında (`/`) verilerin doğrudan backend'den çekilmesi ve periyodik güncellenmesi.
  - [x] "Randevuyu Onayla ve Sevk Et" butonunun backend'e durum güncellemesi göndermesi ve hastayı "SEVK EDİLDİ" konumuna getirmesi.
- [x] **Mobil Uygulama (Expo) Entegrasyonu:**
  - [x] Chatbot sayfasındaki mesajlaşma ve butonların doğrudan backend `/api/chat` ile senkronize çalıştırılması.
  - [x] Sohbet tamamlanıp "Randevu Al" dendiğinde yeni bir hasta anamnez dosyasının veritabanına yazılması ve hekim paneline anında yansıması.

### 🟢 FAZ 2: AI Semptom Ayrıştırma (NLP/LLM) Entegrasyonu (Tamamlandı)
*Hedef: CarePulse asistanına girilen semptomların gerçek bir NLP/LLM motoruyla SOAP analizine dönüştürülmesi.*
- [x] FastAPI backend'e Google Gemini API ve session tabanlı diyalog geçmişi entegrasyonu.
- [x] Doğal dilden semptom ayrıştırıp yapılandırılmış JSON SOAP verileri (tetkikler, poliklinikler, olasılık oranları) çıkaran prompt mühendisliği yapıldı.
- [x] Saf Python tabanlı **Cosine Similarity** (Kosinüs Benzerliği) algoritması ve tıbbi eşanlamlı genişletme motoru (`expand_medical_terms`) kodlandı; hastanın geçmiş tanısı ile güncel şikayetleri karşılaştırılarak kritik risk uyarıları hekim paneline entegre edildi.

### 🟢 FAZ 3: MHRS Randevu & Sevk Yönetim Akışı (Tamamlandı)
*Hedef: Hastaneler arası veya poliklinikler arası sevk ve randevu onay süreçlerinin uçtan uca simüle edilmesi.*
- [x] Mobil uygulamada poliklinik kartları genişletilebilir yapıldı; müsait hekimler ve randevu saatleri listelendi. Tıklanan saat diliminin SQLite veritabanına (`POST /api/appointments/history`) yazılması sağlandı.
- [x] Hekim paneli sevk onayından sonra mobil uygulamaya 6 saniyede bir tetiklenen polling ile durum güncellenmesi çekildi ve hastaya kırmızı renkli detaylı sevk randevusu bilgilendirme kartı ulaştırıldı.

### 🟢 FAZ 4: Proaktif Taburcu Sonrası Takip Sistemi (Tamamlandı)
*Hedef: Muayene sonrası hastayı otonom takibe alan periyodik semptom sorgulama modülü.*
- [x] Backend tarafında postoperative takip API'si (`POST /api/patients/{id}/followup`) yazıldı, gelen verilerde anomali kontrolü yapıldı (Ateş >= 38.5, Ağrı >= 7 veya negatif durum notları).
- [x] Mobil uygulamada (Profil ekranında) hekimle durum paylaşımı yapacak "Taburcu Sonrası Takip Anketi" (Ağrı Kaydırıcı Butonu, Ateş Alanı ve Not Girişi) geliştirildi, alarm durumunda hekime anlık SQLite alarm kaydı gönderildi.
- [x] Hekim panelinde (Dashboard) alarm durumu algılanan hastalar için kırmızı renkli yanıp sönen `KRİTİK TAKİP` alarm rozeti ve uyarı durum etiketleri entegre edildi.
