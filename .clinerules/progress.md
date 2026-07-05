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

### 🟡 FAZ 3: MHRS Randevu & Sevk Yönetim Akışı
*Hedef: Hastaneler arası veya poliklinikler arası sevk ve randevu onay süreçlerinin uçtan uca simüle edilmesi.*
- [ ] Mobil uygulamada poliklinik bazlı doktor seçimi ve randevu saatlerinin listelenmesi.
- [ ] Hekim paneli onayından sonra hastaya mobil bildirim ile sevk edilen bölüm randevusunun ulaştırılması.

### 🟡 FAZ 4: Proaktif Taburcu Sonrası Takip Sistemi
*Hedef: Muayene sonrası hastayı otonom takibe alan periyodik semptom sorgulama modülü.*
- [ ] Backend tarafında zamanlanmış görev yönetimi (Scheduler) ile hastaya periyodik kontrol soruları tetikleme.
- [ ] Mobil uygulamada taburcu sonrası takip anketi ve anomali tespiti durumunda hekim paneline acil alarm düşürme akışı.
