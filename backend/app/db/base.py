"""Motor de base de datos SQLAlchemy y Base declarativa."""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, echo=False)


class Base(DeclarativeBase):
    """Base declarativa para todos los modelos."""
    pass
