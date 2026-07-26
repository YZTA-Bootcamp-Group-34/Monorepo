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

### 🟢 FAZ 6: Production Cilalama & Uçtan Uca Koruma (Tamamlandı)
*Hedef: Tüm monoreponun prod-ready seviyeye çıkarılması, token güvenliği, arayüz iskelet yüklemeleri (skeleton), toast uyarıları ve veri doğrulama kontrollerinin yapılması.*
- [x] Next.js ve Expo üzerinde tüm isteklerin authorization header (Bearer JWT) ile gönderilmesinin zorunlu kılınması.
- [x] Mobil uygulamada ve web panelinde veri çekme anlarında boş ekran yerine iskelet (skeleton) yükleme durumları.
- [x] Başarı/hata durumlarında kullanıcıya premium toast mesajlarının gösterilmesi (sonner / react-hot-toast).
- [x] SQLite seed scriptinin (`seed.py`) yeni auth yapılarıyla uyumlu olarak çalışacak şekilde güncellenmesi.

### 🟢 FAZ 7: LangChain AI Mimarisi, Alt Sayfalar & Vercel Yayını (Tamamlandı — 26 Temmuz 2026)
*Hedef: AI sohbetinin LangChain tabanlı çok aşamalı pipeline'a dönüştürülmesi, eksik alt sayfaların yapılması, backend + hekim panelinin Vercel'de yayınlanması ve APK üretim altyapısının kurulması.*

- [x] **Backend — `backend/ai/` LangChain paketi:**
  - [x] LCEL triyaj zinciri (`chains.py`): `prompt | Gemini | PydanticOutputParser` → yapılandırılmış `TriageDecision` (intent, semptomlar, poliklinik, olasılıklar, tetkikler, aciliyet, kritiklik).
  - [x] İkinci LCEL zinciriyle sevk sonrası ICD-10 kodlu **SOAP raporu** üretimi (`SOAPReport`) ve hasta dosyasına yazımı.
  - [x] In-memory session sözlüğü yerine SQLite `chat_messages` tablosuyla **kalıcı diyalog hafızası** (`memory.py`) — serverless uyumlu.
  - [x] Canlı bağlam araçları (`tools.py`): DB'den poliklinik kataloğu + kimliği doğrulanmış hastanın biyometri/özgeçmişi prompt'a enjekte edilir.
  - [x] Gemini model yedekleme listesi (`llm.py`, varsayılan `gemini-2.5-flash`, `GEMINI_MODEL` ile değiştirilebilir) ve anahtar yokken kural tabanlı fallback (`fallback.py`).
  - [x] Kimlikli sohbet: Bearer token'lı hastanın sevki artık "Sanal Hasta" yerine kendi dosyasına işlenir; `/api/chat` yanıtına `department`, `urgency`, `referral_created` alanları eklendi.
  - [x] Kosinüs benzerliği motoru `similarity.py`'ye taşındı; `main.py` 831 satırdan modüler yapıya indirildi.
- [x] **Hekim Paneli — alt sayfalar & auth sertleştirme:**
  - [x] `(dashboard)` route group ile sidebar auth sayfalarından ayrıldı; `/patients` (aramalı gerçek hasta listesi), `/appointments`, `/settings` (profil düzenleme + çıkış) sayfaları eklendi.
  - [x] Sunucu taraflı auth guard: `src/proxy.ts` (Next 16'da middleware'in yeni adı) + login'de cookie yazımı; sidebar 4 nav linki + Çıkış Yap; hekim adı localStorage'dan.
  - [x] Tüm `http://localhost:8000` sabitleri `src/lib/api.ts` (`NEXT_PUBLIC_API_URL`) üzerinden; ölü butonlar (Yeni Kayıt, Hepsini Gör, zil, sıralama, Raporları İncele, Tam Kayıt) bağlandı.
- [x] **Mobil Uygulama — alt sayfalar & canlı veri:**
  - [x] Ölü profil menüsü 4 gerçek ekrana bağlandı: `personal-info` (biyometri düzenleme), `health-file` (VKİ + sevk durumu), `settings` (çıkış), `help` (SSS).
  - [x] `src/context/auth.tsx` AuthContext: gerçek hasta ID'si `/api/auth/me`'den; sabit `patients/1` çağrıları kaldırıldı; logout artık uygulamayı yeniden başlatmadan çalışıyor.
  - [x] `history.tsx` canlı `/api/appointments/history` verisine bağlandı (pull-to-refresh + skeleton + çevrimdışı fallback).
  - [x] `app.json` markalama: "PreClinic CarePulse", `com.bootcamp34.preclinic` paket kimlikleri; `eas.json` APK build profilleri (`EXPO_PUBLIC_API_URL` prod backend'e gömülü).
- [x] **Yayın (Deployment):**
  - [x] Backend Vercel'de: `preclinic-api` projesi → https://preclinic-api.vercel.app (`api/index.py` + `vercel.json`; SQLite soğuk başlangıçta `/tmp`'ye kopyalanır — ephemeral demo).
  - [x] Hekim paneli Vercel'de: `preclinic-panel` projesi → https://preclinic-panel.vercel.app (`NEXT_PUBLIC_API_URL` prod env); canlı ortamda hekim girişi doğrulandı.
  - [x] README'ye canlı demo URL'leri, REST API tablosu, AI mimari diyagramı, deployment kılavuzu ve genişletilmiş ERD eklendi.
  - [ ] APK üretimi: `eas.json` hazır; `npx eas-cli login && npx eas-cli build -p android --profile preview` komutu kullanıcının Expo hesabı girişini bekliyor.
  - [ ] Vercel'de `GEMINI_API_KEY` tanımlanması (şu an prod sohbet fallback modda).

### 🟢 FAZ 8: Alt Sayfa Backend Entegrasyon Tamamlama (Tamamlandı — 26 Temmuz 2026)
*Hedef: Denetimde tespit edilen tüm ölü/placeholder kontrollerin gerçek backend uçlarına bağlanması.*

- [x] **Yeni backend uçları:** `GET /api/departments/{id}/doctors` (canlı hekim kadrosu + saat şablonları), `POST /api/appointments/book` (sunucu taraflı `TEM 26` tarih formatı + REC kodu üretimi), `GET /api/notifications` (hasta verisinden türetilen canlı bildirimler), `POST /api/patients` (hekim panelinden manuel hasta kaydı).
- [x] Hasta profiline `avatar_url` ve `notifications_enabled` alanları (`/api/auth/me` + `/api/auth/onboarding` üzerinden okunur/yazılır).
- [x] **Mobil:** bölüm kartlarındaki hekim/saat listesi canlı API'den; randevu `book` ucuna geçirildi; ölü ataç butonu kaldırıldı; ses modu dürüst "demo dikte" akışına dönüştürüldü (gerçek `/api/chat`'e gönderir); geçmiş kartları akordeon detay açar; avatar seçici modal (onboarding ucuna kaydeder); bildirim anahtarı backend'e persist; hata yakalamalarında sahte "başarılı" mesajları düzeltildi.
- [x] **Panel:** `NotificationsBell` bileşeni `/api/notifications`'a bağlı (nokta yalnızca bildirim varken); `/patients/new` gerçek hasta kayıt formu; tarih rozeti "AY GG" dışı formatlarda kırılmıyor; sidebar avatar + TIBBİ ID `/api/auth/me`'den; catch bloklarındaki yanlış success toast'ları düzeltildi.
