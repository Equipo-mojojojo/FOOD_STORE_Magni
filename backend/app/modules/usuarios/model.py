"""Modelo SQLAlchemy para Usuario."""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime

from app.db.base import Base


class Usuario(Base):
    """Entidad Usuario con soft-delete."""
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(254), unique=True, nullable=False)
    password_hash = Column(String(60), nullable=False)
    rol = Column(String(20), nullable=False, default="CLIENT")
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
