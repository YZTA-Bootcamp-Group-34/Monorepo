# Tech Context: PreClinic Setup

## Core Stack

### Backend
- **Python 3.11**
- **FastAPI**: Main web framework.
- **SQLAlchemy**: Database ORM.
- **SQLite**: Local relational database (Vercel'de `/tmp`, ephemeral).
- **Uvicorn**: ASGI web server (lokal geliştirme).
- **LangChain** (`langchain-core` + `langchain-google-genai`): CarePulse AI pipeline'ı — LCEL zincirleri, `PydanticOutputParser` yapılandırılmış çıktılar, Gemini sohbet modeli (`gemini-2.5-flash` varsayılan, `GEMINI_MODEL` ile değiştirilebilir).
- **PyJWT + bcrypt**: JWT üretimi/doğrulaması ve şifre hashleme.

### Doctor Web Dashboard
- **React 19 / Next.js 16**: App Router, `(dashboard)` route group, `src/proxy.ts` (middleware) auth guard.
- **Tailwind CSS v4**: Utility-first CSS styling.
- **shadcn/ui**: Accessible UI primitives (customized).
- **lucide-react**: Icon sets.
- **react-hot-toast**: Bildirim toast'ları.

### Patient Mobile App
- **React Native 0.86 (Expo SDK 57)**
- **Expo Router**: File-based tabs + alt sayfalar (`href: null` ile tab bar'dan gizlenen stack ekranları).
- **React Native Paper**: Material-inspired visual component framework.
- **AsyncStorage**: Token/onboarding kalıcılığı; `src/context/auth.tsx` AuthContext.
- **EAS Build**: APK üretimi (`eas.json`, paket: `com.bootcamp34.preclinic`).

## Ortam Değişkenleri
| Değişken | Uygulama | Açıklama |
|---|---|---|
| `GEMINI_API_KEY` | backend | LangChain pipeline'ını aktive eder (yoksa kural tabanlı fallback) |
| `GEMINI_MODEL` | backend | Gemini model adı (varsayılan `gemini-2.5-flash`) |
| `DATABASE_URL` | backend | Opsiyonel harici DB (varsayılan SQLite) |
| `NEXT_PUBLIC_API_URL` | doctor-panel | Backend adresi (varsayılan `http://localhost:8000`) |
| `EXPO_PUBLIC_API_URL` | mobile-app | Backend adresi (varsayılan `http://localhost:8000`) |

## Canlı Ortam
- Backend: https://preclinic-api.vercel.app (Vercel projesi `preclinic-api`, monorepo kökünden deploy)
- Panel: https://preclinic-panel.vercel.app (Vercel projesi `preclinic-panel`, `doctor-panel/` kökünden deploy)
- Demo hesaplar: hekim `dr.alper@preclinic.com`/`123456`, hasta `12345678901`/`123456`

## Figma Color Tokens
We must strictly use the following color variables:
- Slate Dark: `#434653`
- Navy Dark: `#111C2C`
- Royal Blue: `#003C90`
- Light Blue Tint: `#E7EEFF`
- Emerald: `#006C4D`
- Background Light: `#F9F9FF`
- Mint Green (Active Tab Capsule): `#86F8C8`
- Urgency Red: `#BA1A1A`
