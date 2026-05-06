"""
Modelo SQLModel para Usuario.

Antes usaba SQLAlchemy Column() — ahora usa SQLModel Field().
Mismos campos, misma tabla, sintaxis más limpia.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field


class Usuario(SQLModel, table=True):
    """Entidad Usuario con soft-delete."""
    __tablename__ = "usuarios"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100)
    email: str = Field(max_length=254, unique=True)
    password_hash: str = Field(max_length=60)
    rol: str = Field(default="CLIENT", max_length=20)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    deleted_at: Optional[datetime] = Field(default=None)
