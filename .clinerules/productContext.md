# Product Context: PreClinic

## Why This Project Exists
In modern healthcare systems, both doctors and patients face significant communication and administrative friction:
1. **Inefficient Appointment Routing:** Patients struggle to select the correct department for their symptoms. For example, a patient with chest pain may book an appointment with a pulmonologist when they need a cardiologist.
2. **High Administrative Burden on Doctors:** Doctors spend a massive portion of their consultation time typing patient information into EHR (Electronic Health Record) systems instead of talking to the patient.
3. **Lack of Historical Context Correlation:** Doctors are often unaware of a patient's historical or chronic symptoms that correlate with their current complaints due to fragmented records and lack of quick summaries.
4. **Discharge Follow-Up Gap:** Once a patient is discharged, there is no automatic system to verify their recovery or trigger alert flags if their symptoms worsen.

## How it Works
1. **Natural Language Anamnesis (Patient Mobile App):** The patient describes their symptoms naturally (via chat or voice input) to the AI assistant `CarePulse`.
2. **AI Categorization & Routing:** The backend routes this to the correct department (using NLP classification) and schedules/suggests an appointment.
3. **SOAP Clinical Report Generation:** The natural language symptoms are translated into structured SOAP (Subjective, Objective, Assessment, Plan) formatted summaries.
4. **Doctor Review Dashboard:** The doctor logs into their Next.js dashboard, reviews incoming patients, sees the AI-generated anamnesis, confirms the diagnosis, and sets recommendations.
5. **Continuous Context & Similarity Checks:** The AI compares the new symptom reports against historical records using semantic text similarity, raising flags if critical anomalies exist.
