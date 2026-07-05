# Active Context: PreClinic Setup

## Current Focus
We are starting **FAZ 2: AI Semptom Ayrıştırma (NLP/LLM) Entegrasyonu**.
The objective is to replace the hardcoded simulated dialogue in the chatbot backend with a real LLM/NLP symptom parser (e.g. Google Gemini API) to dynamically extract patient complaints, structure them into a SOAP anamnesis file format, suggest ICD-10 codes, and run similarity checks with patient history records.

## Recent Changes
- Completed **FAZ 1 (Dinamik API ve Veri Entegrasyonu)**.
- Added `PUT /api/patients/{id}/action` endpoint to confirm referral sevk routing on the backend, updating SQLite fields dynamically.
- Next.js patient detail panel is now connected to this endpoint, updates patient record status, and redirects back to dashboard.
- Chatbot `POST /api/chat` now dynamically inserts new patients ("Sanal Asistan (Nöroloji)" and "Sanal Asistan (Kardiyoloji)") with all related symptom schemas and diagnostic probabilities into the database when they confirm appointments.

## Next Steps (Phase 2)
1. Configure backend requirements for NLP/LLM execution (Gemini API dependencies).
2. Write a prompt processor in `backend/main.py` that handles incoming user messages, identifies medical urgency, recommends clinic departments, and outputs structured SOAP logs.
3. Implement similarity calculations (e.g. Cosine Similarity) between current complaints and historical items in the SQLite database to raise alert warnings for the doctor panel.
