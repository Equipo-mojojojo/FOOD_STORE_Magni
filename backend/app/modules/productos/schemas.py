"""Schemas de Productos e Ingredientes con validaciones Pydantic."""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Annotated
from decimal import Decimal
from datetime import datetime





# ── Productos ────────────────────────────────────────────────────────────────

class ProductoCreate(BaseModel):
    """Schema de entrada para crear un producto con relaciones N:N."""
    nombre: Annotated[str, Field(min_length=2, max_length=200, description="Nombre del producto")]
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    precio_base: Annotated[Decimal, Field(gt=0, description="Precio base del producto (>0)")]
    stock_cantidad: Annotated[int, Field(ge=0, description="Cantidad en stock (>=0)")] = 0
    disponible: bool = True
    categoria_ids: List[int] = Field(default=[], description="IDs de categorías asociadas (N:N)")
    ingrediente_ids: List[int] = Field(default=[], description="IDs de ingredientes asociados (N:N)")

    @field_validator("precio_base")
    @classmethod
    def precio_positivo(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("El precio debe ser mayor a 0")
        return v

    @field_validator("stock_cantidad")
    @classmethod
    def stock_no_negativo(cls, v: int) -> int:
        if v < 0:
            raise ValueError("El stock no puede ser negativo")
        return v


class ProductoUpdate(BaseModel):
    """Schema de entrada para actualizar un producto."""
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=200)
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    precio_base: Optional[Decimal] = Field(default=None, gt=0)
    stock_cantidad: Optional[int] = Field(default=None, ge=0)
    disponible: Optional[bool] = None
    categoria_ids: Optional[List[int]] = None
    ingrediente_ids: Optional[List[int]] = None


class CategoriaSimple(BaseModel):
    """Categoría simplificada para incluir en detalle de producto."""
    id: int
    nombre: str
    model_config = {"from_attributes": True}


class IngredienteSimple(BaseModel):
    """Ingrediente simplificado para incluir en detalle de producto."""
    id: int
    nombre: str
    es_alergeno: bool
    model_config = {"from_attributes": True}


class ProductoRead(BaseModel):
    """Schema de salida de producto — response_model para listados."""
    id: int
    nombre: str
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    precio_base: Decimal
    stock_cantidad: int
    disponible: bool
    categorias: List[CategoriaSimple] = []
    ingredientes: List[IngredienteSimple] = []
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class ProductoDetail(ProductoRead):
    """Schema de salida para el detalle de producto con relaciones."""
    pass


class PaginatedResponse(BaseModel):
    """Respuesta paginada genérica para listados."""
    items: List[ProductoRead]
    total: int
    page: int
    per_page: int
    pages: int
