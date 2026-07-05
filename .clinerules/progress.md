# Progress: PreClinic Monorepo

## Current Status
We have completed the core setup, database seeding, nextjs doctor dashboard layout, and expo mobile app screens layout. Everything compiles cleanly.

## What Works
- **FastAPI backend (`backend/`):** SQLite model configuration, seeded data successfully with same metrics and patient data, APIs exposed for patients, details, departments, and chat messages.
- **Doctor Web Panel (`doctor-panel/`):** Next.js 16 / React 19 app created, styled with Tailwind CSS v4, initialized components. Home panel renders cards, tables, lists, and AI reports. Patient details page displays logs, clinical history, and recommendation actions.
- **Mobile Client (`mobile-app/`):** Expo Router app initialized, custom tab bar configured (Chatbot, Bölümler, Geçmiş, Profil). CarePulse chat screen with voice toggles, Branch search screen, History logs grouped by year, Profile view with blood droplets, scales, and height indicators.
- **Type Checking:** All typescript codepasses type verification checks cleanly.

## Sprint Verification Summary
- [x] Create monorepo subfolders.
- [x] SQLite Seeding of Dr. Alper, Esra Canpolat, Ulaş Can, and departments.
- [x] Next.js shadcn-based layout.
- [x] Expo custom navigation triggers.
