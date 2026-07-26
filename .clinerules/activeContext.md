# Active Context: PreClinic — Canlıda (FAZ 8 Tamamlandı)

## Current Focus
FAZ 1-8 tamamlandı. Sistem uçtan uca çalışır, tüm alt sayfalar backend'e bağlı ve **Vercel'de canlıda**:

1. **Backend (FastAPI + LangChain):** https://preclinic-api.vercel.app — `backend/ai/` paketi LCEL zincirleriyle
   (hafıza → canlı bağlam → yapılandırılmış triyaj → SOAP + ICD-10 → sevk kaydı) çalışır; `GEMINI_API_KEY`
   yokken kural tabanlı fallback devrededir. Diyalog hafızası SQLite `chat_messages` tablosundadır.
2. **Hekim Paneli (Next.js):** https://preclinic-panel.vercel.app — `(dashboard)` route group, `/patients`,
   `/patients/new`, `/appointments`, `/settings` sayfaları, `proxy.ts` auth guard'ı, canlı `NotificationsBell`.
3. **Mobil (Expo):** 4 sekme + 4 alt sayfa (personal-info, health-file, settings, help); AuthContext ile gerçek
   hasta kimliği; bölüm hekim/saatleri, randevu, geçmiş, avatar ve bildirim tercihi tamamen API'ye bağlı.
   APK için `eas.json` hazır (paket: `com.bootcamp34.preclinic`).

## Recent Changes (26 Temmuz 2026)
- AI sohbeti tek prompt'tan LangChain çok aşamalı pipeline'a dönüştürüldü (`backend/ai/`).
- Yeni uçlar: `/api/departments/{id}/doctors`, `/api/appointments/book`, `/api/notifications`, `POST /api/patients`.
- Hasta profiline `avatar_url` + `notifications_enabled` eklendi (models.py değişti → şema değişikliğinde `seed.py` yeniden çalıştırılmalı).
- Tüm ölü/placeholder UI kontrolleri gerçek uçlara bağlandı; catch bloklarındaki sahte success mesajları düzeltildi.
- README: canlı URL'ler, API tablosu, AI mimari diyagramı, deployment kılavuzu.

## Bekleyen Kullanıcı Aksiyonları
- `npx eas-cli login && npx eas-cli build -p android --profile preview` → APK üretimi (Expo hesabı gerekli).
- Vercel `preclinic-api` projesine `GEMINI_API_KEY` eklenmesi (canlı AI için); şu an prod fallback modda.
- Yerel commit'lerin GitHub'a push'lanması.

## Verification
- Backend: `python3.11 -c "from backend.main import app"` temiz; tüm yeni uçlar curl ile test edildi.
- Panel: `npm run build` sıfır hata; canlı ortamda hekim girişi + tüm sayfalar tarayıcıda doğrulandı.
- Mobil: `npx tsc --noEmit` sıfır hata.
- Demo hesaplar: hekim `dr.alper@preclinic.com`/`123456`, hasta `12345678901`/`123456`.
- Not: Vercel'de SQLite `/tmp`'de ephemeral çalışır; her soğuk başlangıçta seed verisine döner.
