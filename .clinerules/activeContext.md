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

## Supabase (26 Temmuz 2026 — Aktif)
- Canlı backend artık **Supabase Postgres** kullanıyor: Vercel `preclinic-api` projesinde `DATABASE_URL`
  production env'i tanımlı (Transaction Pooler, `aws-0-ap-northeast-1.pooler.supabase.com:6543`,
  kullanıcı `postgres.sktffqvoprswgeyzlzqd`). Veriler kalıcı; ephemeral SQLite sınırlaması kalktı.
- Dikkat: Supabase *direct connection* (`db.<ref>.supabase.co:5432`) IPv6-only olduğu için çalışmaz;
  her zaman pooler adresi kullanılmalı. Şema değişikliğinde `DATABASE_URL=... python3.11 -m backend.seed`.

## Gemini Canlı AI (26 Temmuz 2026 — Aktif)
- `GEMINI_API_KEY` hem `backend/.env` (gitignored) hem Vercel `preclinic-api` production env'inde tanımlı.
- Varsayılan model `gemini-flash-latest` (llm.py) — sabit sürümler (gemini-2.5-flash/1.5-flash) bu anahtar
  için kapalı/erişilemez olduğundan "latest" alias'ları kullanılıyor; yedekler: gemini-flash-lite-latest.
- Canlıda doğrulandı: gerçek Gemini triyajı ACİL/RUTİN aciliyet, poliklinik sevki ve ICD-10'lu SOAP raporu üretiyor.

## APK (EAS Build)
- Expo hesabı: ulascan54 (vidge) — proje `@ulascan54/preclinic-carepulse` (ID a8ac8ca4-aff0-4c06-b0a5-04943ae225e5).
- Build sayfası: https://expo.dev/accounts/ulascan54/projects/preclinic-carepulse/builds
- Yeni APK üretimi: `cd mobile-app && npx eas-cli build -p android --profile preview`.

## Bekleyen Kullanıcı Aksiyonları
- Yerel commit'lerin GitHub'a push'lanması.

## Verification
- Backend: `python3.11 -c "from backend.main import app"` temiz; tüm yeni uçlar curl ile test edildi.
- Panel: `npm run build` sıfır hata; canlı ortamda hekim girişi + tüm sayfalar tarayıcıda doğrulandı.
- Mobil: `npx tsc --noEmit` sıfır hata.
- Demo hesaplar: hekim `dr.alper@preclinic.com`/`123456`, hasta `12345678901`/`123456`.
- Not: Vercel'de SQLite `/tmp`'de ephemeral çalışır; her soğuk başlangıçta seed verisine döner.
