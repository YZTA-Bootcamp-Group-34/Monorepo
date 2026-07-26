"""Kalıcı diyalog hafızası: SQLite (chat_messages) tabanlı, session bazlı.

Serverless (Vercel) ortamında in-memory sözlükler istekler arasında kaybolur;
bu modül geçmişi veritabanına yazarak LangChain zincirlerine mesaj geçmişi sağlar.
"""

from datetime import datetime
from typing import List

from sqlalchemy.orm import Session

from ..models import ChatMessageLog

MAX_HISTORY_MESSAGES = 20


def get_history(db: Session, session_id: str, limit: int = MAX_HISTORY_MESSAGES) -> List[dict]:
    rows = (
        db.query(ChatMessageLog)
        .filter(ChatMessageLog.session_id == session_id)
        .order_by(ChatMessageLog.id.desc())
        .limit(limit)
        .all()
    )
    return [{"role": r.role, "content": r.content} for r in reversed(rows)]


def append_message(db: Session, session_id: str, role: str, content: str) -> None:
    db.add(
        ChatMessageLog(
            session_id=session_id,
            role=role,
            content=content,
            created_at=datetime.utcnow().isoformat(),
        )
    )
    db.commit()


def reset_history(db: Session, session_id: str) -> None:
    db.query(ChatMessageLog).filter(ChatMessageLog.session_id == session_id).delete()
    db.commit()


def to_langchain_messages(history: List[dict]):
    """Sözlük geçmişini LangChain mesaj nesnelerine dönüştürür."""
    from langchain_core.messages import AIMessage, HumanMessage

    messages = []
    for msg in history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(AIMessage(content=msg["content"]))
    return messages
