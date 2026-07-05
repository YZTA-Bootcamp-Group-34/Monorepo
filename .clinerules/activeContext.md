# Active Context: PreClinic Setup

## Current Focus
We are starting **FAZ 3: MHRS Randevu & Sevk Yönetim Akışı**.
The objective is to connect patient branch bookings on the mobile app directly to dynamic database states, and enable the doctor to confirm and issue referrals, updating notification counters in real-time.

## Recent Changes
- Completed **FAZ 2 (AI Semptom Ayrıştırma & Kosinüs Benzerliği Entegrasyonu)**.
- Installed `google-generativeai` and `python-dotenv`.
- Wrote Google Gemini API dialogue system inside `/api/chat` with structured JSON parsing, system instructions, and stateful session histories.
- Implemented pure-Python **Cosine Similarity** with medical term expansions inside `GET /api/patients/{id}`.
- Configured Doctor Panel details page to receive and display similarity risk alerts dynamically under the header with warning icons.

## Next Steps (Phase 3)
1. Add backend API routes for scheduling available appointment hours per department.
2. Hook the mobile client's "Randevu Al" trigger to complete dynamic appointment allocations in the database.
3. Update the notification badge triggers to increment/decrement based on active patients status.
