"""LLM fabrikası: LangChain üzerinden Google Gemini sohbet modeli üretir."""

import os
from functools import lru_cache

# Gemini model adı ortam değişkeniyle değiştirilebilir.
# "latest" alias'ları Google tarafında güncel tutulur; sabit sürüm adları zamanla kapatılabiliyor.
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
FALLBACK_MODELS = ["gemini-flash-lite-latest", "gemini-2.5-flash"]


def is_llm_active() -> bool:
    """API anahtarı tanımlı mı? Yoksa pipeline kural tabanlı fallback'e düşer."""
    return bool(os.getenv("GEMINI_API_KEY"))


@lru_cache(maxsize=8)
def get_chat_model(model_name: str = None, temperature: float = 0.4):
    """LangChain ChatGoogleGenerativeAI örneği döndürür (model başına önbellekli)."""
    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model=model_name or DEFAULT_MODEL,
        temperature=temperature,
        google_api_key=os.getenv("GEMINI_API_KEY"),
        max_retries=1,
    )


def candidate_models():
    """Birincil model + yedek modeller (eski model adları kapatılmışsa dener)."""
    primary = DEFAULT_MODEL
    return [primary] + [m for m in FALLBACK_MODELS if m != primary]
