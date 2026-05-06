"""
Modelo SQLModel para Ingrediente.

Migrado de SQLAlchemy Column() a SQLModel Field().
Mismos campos, misma tabla, sintaxis más limpia.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field


class Ingrediente(SQLModel, table=True):
    """Entidad Ingrediente con soft-delete (deleted_at)."""
    __tablename__ = "ingredientes"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100, unique=True)
    descripcion: Optional[str] = Field(default=None)
    es_alergeno: bool = Field(default=False)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    deleted_at: Optional[datetime] = Field(default=None)
