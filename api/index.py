"""Vercel serverless giriş noktası.

Vercel'in Python runtime'ı bu dosyadaki `app` (ASGI) nesnesini otomatik algılar.
Tüm istekler vercel.json'daki rewrite kuralıyla buraya yönlendirilir.
"""

from backend.main import app  # noqa: F401
