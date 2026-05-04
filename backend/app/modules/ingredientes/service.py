"""Servicio de Ingrediente — lógica de negocio."""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.modules.ingredientes.repository import IngredienteRepository
from app.modules.ingredientes.schemas import (
    IngredienteCreate,
    IngredienteUpdate,
    PaginatedIngredientes,
)


class IngredienteService:
    """Capa de servicio para ingredientes."""

    def __init__(self, db: Session):
        self.repo = IngredienteRepository(db)

    def list_paginated(
        self,
        page: int,
        per_page: int,
        search: str | None,
        es_alergeno: bool | None,
        estado: str,
        sort_by: str,
        sort_order: str,
    ) -> PaginatedIngredientes:
        """Lista ingredientes con filtros y paginación."""
        result = self.repo.get_paginated(
            page=page,
            per_page=per_page,
            search=search,
            es_alergeno=es_alergeno,
            estado=estado,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        return PaginatedIngredientes(**result)

    def get_by_id(self, ingrediente_id: int):
        """Obtiene un ingrediente por ID o lanza 404."""
        ingrediente = self.repo.get_by_id(ingrediente_id)
        if not ingrediente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ingrediente no encontrado",
            )
        return ingrediente

    def create(self, data: IngredienteCreate):
        """Crea un nuevo ingrediente."""
        return self.repo.create(nombre=data.nombre, es_alergeno=data.es_alergeno)

    def update(self, ingrediente_id: int, data: IngredienteUpdate):
        """Actualiza un ingrediente existente."""
        ingrediente = self.get_by_id(ingrediente_id)
        update_data = data.model_dump(exclude_unset=True)
        return self.repo.update(ingrediente, **update_data)

    def soft_delete(self, ingrediente_id: int):
        """Soft-delete de un ingrediente."""
        ingrediente = self.get_by_id(ingrediente_id)
        if ingrediente.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El ingrediente ya está dado de baja",
            )
        return self.repo.soft_delete(ingrediente)

    def restore(self, ingrediente_id: int):
        """Restaura un ingrediente dado de baja."""
        ingrediente = self.get_by_id(ingrediente_id)
        if ingrediente.deleted_at is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El ingrediente ya está activo",
            )
        return self.repo.restore(ingrediente)
