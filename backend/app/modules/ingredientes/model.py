"""Modelo SQLAlchemy para Ingrediente."""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime

from app.db.base import Base


class Ingrediente(Base):
    """Entidad Ingrediente con soft-delete (deleted_at)."""
    __tablename__ = "ingredientes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), unique=True, nullable=False)
    es_alergeno = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)
