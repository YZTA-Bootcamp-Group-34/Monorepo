"""CarePulse AI paketi.

LangChain tabanlı, çok aşamalı klinik triyaj pipeline'ı:

    1. Hafıza (memory)     -> SQLite tabanlı kalıcı diyalog geçmişi
    2. Bağlam (tools)      -> Canlı poliklinik kataloğu + hasta tıbbi özgeçmişi
    3. Triyaj (chains)     -> Yapılandırılmış çıktı (Pydantic) üreten LCEL zinciri
    4. SOAP (chains)       -> Sevk kararı sonrası klinik SOAP raporu zinciri
    5. Benzerlik (similarity) -> Kosinüs benzerliği ile tıbbi hafıza uyarıları
    6. Fallback (fallback) -> API anahtarı yokken kural tabanlı çevrimdışı diyalog
"""

from .pipeline import run_carepulse_pipeline
from .similarity import get_cosine_similarity, expand_medical_terms

__all__ = ["run_carepulse_pipeline", "get_cosine_similarity", "expand_medical_terms"]
