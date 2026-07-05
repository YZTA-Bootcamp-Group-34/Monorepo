# Active Context: PreClinic Phase 5 Setup

## Current Focus
We are starting **FAZ 5: Kimlik Doğrulama (Auth) & Onboarding Süreçleri**.
The objective is to implement a robust, production-ready JWT authentication system on the FastAPI backend, and design visual register, login, and onboarding wizard flows for both Next.js doctor-panel and Expo mobile patient app.

## Recent Decisions
- **Unified Auth Backend:** We will introduce a `User` table to SQLite, representing both patients and doctors with a `role` field ("doctor" or "patient").
- **Tokens:** Authentication will utilize JWT bearer tokens stored securely (in local storage / Expo secure store).
- **Onboarding:**
  - Next.js onboarding allows doctors to set their medical diploma, clinic branch, and description.
  - Expo onboarding introduces welcome slides and prompts patients for biometric details (blood type, weight, height, age) and chronic conditions, storing them in the `patients` table.

## Immediate Tasks
1. Build backend authentication:
   - Install cryptography packages (`pyjwt`, `passlib` with `bcrypt`).
   - Define `User` and `DoctorProfile` models in `backend/models.py`.
   - Update `seed.py` to create default doctor and patient users with hashed passwords.
   - Implement `/api/auth/register`, `/api/auth/login`, and `/api/auth/me` endpoints in `backend/main.py`.
2. Connect doctor web panel with JWT auth screens (`/login`, `/register`, `/onboarding`).
3. Connect Expo mobile client with auth screens, onboarding slides, and biometric registration form.
