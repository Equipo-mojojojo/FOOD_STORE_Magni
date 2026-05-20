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
    username:        str        = Field(index=True, unique=True)
    full_name:       str
    email: str = Field(max_length=254, unique=True)
    password_hash: str = Field(max_length=60)
    role: str = Field(default="user", max_length=20)
    disabled: bool = Field(default=False)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    deleted_at: Optional[datetime] = Field(default=None)
