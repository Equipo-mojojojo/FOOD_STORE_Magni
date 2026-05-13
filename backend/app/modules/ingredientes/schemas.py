"""Schemas Pydantic para Ingrediente."""
from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, Field

class IngredienteCreate(BaseModel):
    """Schema para crear un ingrediente."""
    nombre: Annotated[str, Field(min_length=2, max_length=100, description="Nombre del ingrediente")]
    descripcion: str | None = Field(default=None, max_length=500, description="Descripción opcional")
    es_alergeno: bool = False


class IngredienteUpdate(BaseModel):
    """Schema para actualizar un ingrediente."""
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=500)
    es_alergeno: bool | None = None
    activo: bool | None = None


class IngredienteResponse(BaseModel):
    """Schema de respuesta de ingrediente."""
    id: int
    nombre: str
    descripcion: str | None = None
    es_alergeno: bool
    created_at: datetime
    updated_at: datetime
    active_at: datetime | None = None
    deleted_at: datetime | None = None

    class Config:
        from_attributes = True


class PaginatedIngredientes(BaseModel):
    """Respuesta paginada de ingredientes."""
    items: list[IngredienteResponse]
    total: int
    page: int
    per_page: int
    pages: int
