"""Servicio de Productos. Lógica de negocio con manejo de relaciones N:N."""
from fastapi import HTTPException, status
from app.core.uow import UnitOfWork
from app.modules.productos.model import Producto, ProductoCategoria, ProductoIngrediente
from app.modules.productos.schemas import (
    ProductoCreate, ProductoUpdate, ProductoDetail,
    CategoriaSimple, IngredienteSimple,
)
from math import ceil


# ── Productos ────────────────────────────────────────────────────────────────

def create_producto(uow: UnitOfWork, data: ProductoCreate) -> Producto:
    """Crea un producto y sincroniza relaciones N:N con categorías e ingredientes."""
    prod = Producto(
        nombre=data.nombre,
        descripcion=data.descripcion,
        imagen_url=data.imagen_url,
        precio_base=data.precio_base,
        stock_cantidad=data.stock_cantidad,
        disponible=data.disponible,
    )
    prod = uow.productos.add(prod)

    # Sincronizar relación N:N con categorías
    for cat_id in data.categoria_ids:
        pc = ProductoCategoria(producto_id=prod.id, categoria_id=cat_id)
        uow.producto_categorias.add(pc)

    # Sincronizar relación N:N con ingredientes
    for ing_id in data.ingrediente_ids:
        pi = ProductoIngrediente(producto_id=prod.id, ingrediente_id=ing_id)
        uow.producto_ingredientes.add(pi)

    return prod


def list_productos(
    uow: UnitOfWork, 
    page: int = 1, 
    per_page: int = 20,
    categoria_id: int | None = None,
    search: str | None = None,
    disponible: bool | None = None,
    estado: str = "activo",
    sort_by: str = "nombre",
    sort_order: str = "asc",
    created_from: str | None = None,
    created_to: str | None = None,
    updated_from: str | None = None,
    updated_to: str | None = None,
    starts_with: str | None = None,
):
    """Listado paginado de productos con filtros avanzados."""
    from datetime import datetime
    
    # Parse dates if provided
    d_created_from = datetime.strptime(created_from, "%Y-%m-%d").date() if created_from else None
    d_created_to = datetime.strptime(created_to, "%Y-%m-%d").date() if created_to else None
    d_updated_from = datetime.strptime(updated_from, "%Y-%m-%d").date() if updated_from else None
    d_updated_to = datetime.strptime(updated_to, "%Y-%m-%d").date() if updated_to else None

    return uow.productos.get_paginated(
        page=page,
        per_page=per_page,
        search=search,
        categoria_id=categoria_id,
        disponible=disponible,
        estado=estado,
        sort_by=sort_by,
        sort_order=sort_order,
        created_from=d_created_from,
        created_to=d_created_to,
        updated_from=d_updated_from,
        updated_to=d_updated_to,
        starts_with=starts_with
    )


def get_producto_detail(uow: UnitOfWork, prod_id: int) -> ProductoDetail:
    """Obtiene detalle de producto con categorías e ingredientes relacionados."""
    prod = uow.productos.get_by_id_with_relations(prod_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Construir respuesta con relaciones
    categorias = [
        CategoriaSimple(id=pc.categoria.id, nombre=pc.categoria.nombre)
        for pc in prod.producto_categorias
        if pc.categoria
    ]
    ingredientes = [
        IngredienteSimple(
            id=pi.ingrediente.id,
            nombre=pi.ingrediente.nombre,
            es_alergeno=pi.ingrediente.es_alergeno,
        )
        for pi in prod.producto_ingredientes
        if pi.ingrediente
    ]

    return ProductoDetail(
        id=prod.id,
        nombre=prod.nombre,
        descripcion=prod.descripcion,
        imagen_url=prod.imagen_url,
        precio_base=prod.precio_base,
        stock_cantidad=prod.stock_cantidad,
        disponible=prod.disponible,
        created_at=prod.created_at,
        updated_at=prod.updated_at,
        categorias=categorias,
        ingredientes=ingredientes,
    )


def update_producto(uow: UnitOfWork, prod_id: int, data: ProductoUpdate) -> Producto:
    """Actualiza producto y sincroniza relaciones N:N si se proporcionan."""
    prod = uow.productos.get_by_id(prod_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    update_data = data.model_dump(exclude_unset=True, exclude={"categoria_ids", "ingrediente_ids"})
    for key, value in update_data.items():
        setattr(prod, key, value)

    # Sync categorías si se enviaron
    if data.categoria_ids is not None:
        uow.producto_categorias.delete_by_producto(prod_id)
        for cat_id in data.categoria_ids:
            pc = ProductoCategoria(producto_id=prod_id, categoria_id=cat_id)
            uow.producto_categorias.add(pc)

    # Sync ingredientes si se enviaron
    if data.ingrediente_ids is not None:
        uow.producto_ingredientes.delete_by_producto(prod_id)
        for ing_id in data.ingrediente_ids:
            pi = ProductoIngrediente(producto_id=prod_id, ingrediente_id=ing_id)
            uow.producto_ingredientes.add(pi)

    return uow.productos.update(prod)


def delete_producto(uow: UnitOfWork, prod_id: int):
    """Soft delete de producto."""
    prod = uow.productos.get_by_id(prod_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    uow.productos.soft_delete(prod)


def restore_producto(uow: UnitOfWork, prod_id: int):
    """Restaura un producto dado de baja."""
    prod = uow.productos.get_by_id(prod_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    uow.productos.restore(prod)
