import os
import shutil

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Monorepo kök dizinindeki preclinic.db dosyası (backend/ klasörünün bir üstü)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DB_PATH = os.path.join(os.path.dirname(BASE_DIR), "preclinic.db")

if os.environ.get("VERCEL"):
    # Vercel serverless ortamında dosya sistemi salt okunurdur; yalnızca /tmp yazılabilir.
    # Tohumlanmış veritabanını soğuk başlangıçta /tmp'ye kopyalarız (ephemeral demo modu).
    TMP_DB_PATH = "/tmp/preclinic.db"
    if not os.path.exists(TMP_DB_PATH) and os.path.exists(ROOT_DB_PATH):
        shutil.copy(ROOT_DB_PATH, TMP_DB_PATH)
    DATABASE_URL = f"sqlite:///{TMP_DB_PATH}"
else:
    DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{ROOT_DB_PATH}")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
