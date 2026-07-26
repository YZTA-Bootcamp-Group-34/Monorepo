"""LangChain zincirlerinin yapılandırılmış (Pydantic) çıktı şemaları."""

from typing import List, Optional
from pydantic import BaseModel, Field


class ProbabilityItem(BaseModel):
    condition: str = Field(description="Olası hastalık/tanı adı (Türkçe klinik terim)")
    probability: int = Field(description="0-100 arası olasılık yüzdesi")


class TriageDecision(BaseModel):
    """Triyaj zincirinin tek mesajlık kararı."""

    intent: str = Field(
        description=(
            "Hastanın niyeti: greeting | symptom_report | clarification | "
            "appointment_request | followup | smalltalk | other"
        )
    )
    text: str = Field(description="Hastaya gösterilecek dostça Türkçe yanıt metni")
    options: List[str] = Field(
        default_factory=list,
        description="Hastanın tek dokunuşla seçebileceği 2-4 kısa buton önerisi",
    )
    symptoms: Optional[List[str]] = Field(
        default=None,
        description="Klinik terminolojiyle yazılmış semptom listesi (sevk kararı netleşince)",
    )
    department: Optional[str] = Field(
        default=None,
        description="Sevk kararı netleştiyse önerilen poliklinik adı; aksi halde null",
    )
    probabilities: Optional[List[ProbabilityItem]] = Field(
        default=None, description="Olası tanılar ve yüzdeleri"
    )
    tests: Optional[str] = Field(
        default=None, description="Önerilen tetkikler (virgülle ayrılmış)"
    )
    urgency: Optional[str] = Field(
        default=None, description="ACİL | RUTİN KONTROL | TAKİP"
    )
    criticality: Optional[float] = Field(
        default=None, description="0.0-1.0 arası kritiklik skoru"
    )


class SOAPReport(BaseModel):
    """Sevk sonrası üretilen uluslararası standart SOAP anamnez raporu."""

    subjective: str = Field(description="S - Hastanın kendi ifadesiyle şikayetleri")
    objective: str = Field(description="O - Gözlemlenebilir/ölçülebilir bulgular")
    assessment: str = Field(description="A - Klinik değerlendirme ve ön tanılar")
    plan: str = Field(description="P - Tetkik, sevk ve takip planı")
    icd10_codes: List[str] = Field(
        default_factory=list, description="İlgili ICD-10 kodları (örn. ['R51', 'G43.9'])"
    )
