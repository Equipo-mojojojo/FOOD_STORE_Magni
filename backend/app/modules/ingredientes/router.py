"""Router de Ingredientes — endpoints CRUD con 8 filtros y paginación."""
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.usuarios.model import Usuario
from app.modules.ingredientes.service import IngredienteService
from app.modules.ingredientes.schemas import (
    IngredienteCreate,
    IngredienteUpdate,
    IngredienteResponse,
    PaginatedIngredientes,
)

router = APIRouter(prefix="/api/v1/ingredientes", tags=["Ingredientes"])


@router.get("", response_model=PaginatedIngredientes)
def list_ingredientes(
    page: int = Query(1, ge=1, description="Número de página"),
    per_page: int = Query(10, ge=1, le=50, description="Items por página"),
    search: str | None = Query(None, description="Buscar por nombre"),
    es_alergeno: bool | None = Query(None, description="Filtrar por alérgeno"),
    estado: str = Query("activo", description="activo / inactivo / todos"),
    sort_by: str = Query("nombre", description="Ordenar por: nombre / created_at / updated_at"),
    sort_order: str = Query("asc", description="Orden: asc / desc"),
    created_from: date | None = Query(None, description="Fecha creación desde (YYYY-MM-DD)"),
    created_to: date | None = Query(None, description="Fecha creación hasta (YYYY-MM-DD)"),
    updated_from: date | None = Query(None, description="Fecha actualización desde (YYYY-MM-DD)"),
    updated_to: date | None = Query(None, description="Fecha actualización hasta (YYYY-MM-DD)"),
    starts_with: str | None = Query(None, max_length=1, description="Filtrar por letra inicial"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista ingredientes con 8 filtros y paginación."""
    svc = IngredienteService(db)
    return svc.list_paginated(
        page=page,
        per_page=per_page,
        search=search,
        es_alergeno=es_alergeno,
        estado=estado,
        sort_by=sort_by,
        sort_order=sort_order,
        created_from=created_from,
        created_to=created_to,
        updated_from=updated_from,
        updated_to=updated_to,
        starts_with=starts_with,
    )


@router.post("", response_model=IngredienteResponse, status_code=201)
def create_ingrediente(
    data: IngredienteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Crea un nuevo ingrediente."""
    svc = IngredienteService(db)
    return svc.create(data)


@router.get("/{ingrediente_id}", response_model=IngredienteResponse)
def get_ingrediente(
    ingrediente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtiene un ingrediente por ID."""
    svc = IngredienteService(db)
    return svc.get_by_id(ingrediente_id)


@router.put("/{ingrediente_id}", response_model=IngredienteResponse)
def update_ingrediente(
    ingrediente_id: int,
    data: IngredienteUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Actualiza un ingrediente."""
    svc = IngredienteService(db)
    return svc.update(ingrediente_id, data)


@router.delete("/{ingrediente_id}", response_model=IngredienteResponse)
def delete_ingrediente(
    ingrediente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Soft-delete de un ingrediente."""
    svc = IngredienteService(db)
    return svc.soft_delete(ingrediente_id)


@router.patch("/{ingrediente_id}/restore", response_model=IngredienteResponse)
def restore_ingrediente(
    ingrediente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Restaura un ingrediente dado de baja."""
    svc = IngredienteService(db)
    return svc.restore(ingrediente_id)
