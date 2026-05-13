"""
Food Store — Modelos del dominio Catálogo de Productos.
Entidades: Producto, Ingrediente, ProductoCategoria, ProductoIngrediente.
Relaciones: N:N (Producto-Categoria, Producto-Ingrediente).
"""

from datetime import datetime, timezone
from typing import Optional, List
from decimal import Decimal
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, Numeric
from app.modules.categorias.model import Categoria  # noqa: F401


from app.modules.ingredientes.model import Ingrediente


# ── Producto ─────────────────────────────────────────────────────────────────

class Producto(SQLModel, table=True):
    """Producto del catálogo. Precio DECIMAL, stock INTEGER, soft delete."""
    __tablename__ = "productos"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=200)
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    precio_base: Decimal = Field(
        sa_column=Column(Numeric(10, 2), nullable=False),
    )
    stock_cantidad: int = Field(default=0, ge=0)
    disponible: bool = Field(default=True)

    # Auditoría
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    active_at: Optional[datetime] = Field(default=None)        # Baja: cuando se setea, el producto está "dado de baja" (reversible)
    deleted_at: Optional[datetime] = Field(default=None)       # Eliminación lógica: irreversible, invisible para el usuario

    # Relaciones
    producto_categorias: List["ProductoCategoria"] = Relationship(back_populates="producto")
    producto_ingredientes: List["ProductoIngrediente"] = Relationship(back_populates="producto")

    @property
    def categorias(self) -> List["Categoria"]:
        """Extrae las categorías de la tabla pivot."""
        return [pc.categoria for pc in self.producto_categorias if pc.categoria]

    @property
    def ingredientes(self) -> List["Ingrediente"]:
        """Extrae los ingredientes de la tabla pivot."""
        return [pi.ingrediente for pi in self.producto_ingredientes if pi.ingrediente]



# ── ProductoCategoria (pivot N:M) ────────────────────────────────────────────

class ProductoCategoria(SQLModel, table=True):
    """Tabla pivot entre Producto y Categoria. Relación N:N."""
    __tablename__ = "producto_categorias"

    id: Optional[int] = Field(default=None, primary_key=True)
    producto_id: int = Field(foreign_key="productos.id", index=True)
    categoria_id: int = Field(foreign_key="categorias.id", index=True)
    es_principal: bool = Field(default=False)

    # Relaciones
    producto: Optional["Producto"] = Relationship(back_populates="producto_categorias")
    categoria: Optional["Categoria"] = Relationship()


# ── ProductoIngrediente (pivot N:M) ──────────────────────────────────────────

class ProductoIngrediente(SQLModel, table=True):
    """Tabla pivot entre Producto e Ingrediente. es_removible habilita personalización."""
    __tablename__ = "producto_ingredientes"

    id: Optional[int] = Field(default=None, primary_key=True)
    producto_id: int = Field(foreign_key="productos.id", index=True)
    ingrediente_id: int = Field(foreign_key="ingredientes.id", index=True)
    es_removible: bool = Field(default=True)

    # Relaciones con back_populates
    producto: Optional["Producto"] = Relationship(back_populates="producto_ingredientes")
    ingrediente: Optional["Ingrediente"] = Relationship()
