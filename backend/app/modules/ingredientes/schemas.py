"""Schemas Pydantic para Ingrediente."""
from datetime import datetime
from pydantic import BaseModel


class IngredienteCreate(BaseModel):
    """Schema para crear un ingrediente."""
    nombre: str
    es_alergeno: bool = False


class IngredienteUpdate(BaseModel):
    """Schema para actualizar un ingrediente."""
    nombre: str | None = None
    es_alergeno: bool | None = None


class IngredienteResponse(BaseModel):
    """Schema de respuesta de ingrediente."""
    id: int
    nombre: str
    es_alergeno: bool
    created_at: datetime
    updated_at: datetime
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
