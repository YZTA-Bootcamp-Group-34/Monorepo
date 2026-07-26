import os
import shutil

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Monorepo kök dizinindeki preclinic.db dosyası (backend/ klasörünün bir üstü)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DB_PATH = os.path.join(os.path.dirname(BASE_DIR), "preclinic.db")

def _resolve_database_url() -> str:
    """Veritabanı önceliği:
    1. DATABASE_URL env (Supabase/Postgres vb. kalıcı harici veritabanı)
    2. Vercel serverless -> /tmp'ye kopyalanan ephemeral SQLite (demo modu)
    3. Lokal geliştirme -> monorepo kökündeki preclinic.db
    """
    env_url = os.environ.get("DATABASE_URL", "").strip()
    if env_url:
        # Supabase "postgres://" verir; SQLAlchemy 2.x "postgresql://" bekler.
        if env_url.startswith("postgres://"):
            env_url = env_url.replace("postgres://", "postgresql://", 1)
        return env_url

    if os.environ.get("VERCEL"):
        tmp_db_path = "/tmp/preclinic.db"
        if not os.path.exists(tmp_db_path) and os.path.exists(ROOT_DB_PATH):
            shutil.copy(ROOT_DB_PATH, tmp_db_path)
        return f"sqlite:///{tmp_db_path}"

    return f"sqlite:///{ROOT_DB_PATH}"

DATABASE_URL = _resolve_database_url()

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Postgres/Supabase: serverless'ta bağlantı sağlığı için pre_ping;
    # Supabase'te Vercel gibi ortamlar için pooler (6543 portlu) URL önerilir.
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=2)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
