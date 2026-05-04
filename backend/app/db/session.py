"""Generador de sesión para inyección de dependencias."""
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.db.base import engine

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Yield una sesión de BD y la cierra al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
