from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("helixvault")


def get_sqlite_engine():
    DB_DIR = os.path.dirname(os.path.abspath(__file__))
    sqlite_url = f"sqlite:///{os.path.join(DB_DIR, 'helixvault.db')}"
    sq_engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False, "timeout": 30},
    )

    @event.listens_for(sq_engine, "connect")
    def _set_sqlite_wal(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.close()

    return sq_engine


DATABASE_URL = os.getenv("DATABASE_URL")
engine = None

if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    if "?pgbouncer=true" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("?pgbouncer=true", "")
    try:
        candidate_engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 5}
        )
        with candidate_engine.connect() as conn:
            pass
        engine = candidate_engine
        logger.info("Connected to remote PostgreSQL database successfully.")
    except Exception as e:
        logger.warning(f"Could not connect to remote PostgreSQL ({e}). Falling back to local SQLite.")
        engine = get_sqlite_engine()
else:
    engine = get_sqlite_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
