"""
Repositorio de Ingredientes — acceso a BD.

Hereda de BaseRepository.
Agrega queries de paginación y filtros.
"""
import math
from datetime import datetime, date, timezone
from sqlalchemy import asc, desc, func
from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.ingredientes.model import Ingrediente


class IngredienteRepository(BaseRepository[Ingrediente]):
    """Encapsula todas las queries de Ingrediente."""

    def __init__(self, session: Session):
        super().__init__(Ingrediente, session)

    def get_paginated(
        self,
        page: int = 1,
        per_page: int = 10,
        search: str | None = None,
        es_alergeno: bool | None = None,
        estado: str = "activo",
        sort_by: str = "nombre",
        sort_order: str = "asc",
        created_from: date | None = None,
        created_to: date | None = None,
        updated_from: date | None = None,
        updated_to: date | None = None,
        starts_with: str | None = None,
    ) -> dict:
        """Lista ingredientes con 8 filtros + paginación."""
        query = select(Ingrediente)

        if estado == "activo":
            query = query.where(Ingrediente.deleted_at.is_(None))
        elif estado == "inactivo":
            query = query.where(Ingrediente.deleted_at.isnot(None))

        if search:
            from sqlalchemy import or_
            query = query.where(
                or_(
                    Ingrediente.nombre.ilike(f"%{search}%"),
                    Ingrediente.descripcion.ilike(f"%{search}%")
                )
            )

        if es_alergeno is not None:
            query = query.where(Ingrediente.es_alergeno == es_alergeno)

        if created_from:
            query = query.where(func.date(Ingrediente.created_at) >= created_from)
        if created_to:
            query = query.where(func.date(Ingrediente.created_at) <= created_to)

        if updated_from:
            query = query.where(func.date(Ingrediente.updated_at) >= updated_from)
        if updated_to:
            query = query.where(func.date(Ingrediente.updated_at) <= updated_to)

        if starts_with:
            query = query.where(Ingrediente.nombre.ilike(f"{starts_with}%"))

        # Total count
        total = len(self.session.exec(query).all())

        # Sort
        sort_column = getattr(Ingrediente, sort_by, Ingrediente.nombre)
        order_func = asc if sort_order == "asc" else desc
        query = query.order_by(order_func(sort_column))

        # Pagination
        pages = math.ceil(total / per_page) if total > 0 else 1
        offset = (page - 1) * per_page
        items = self.session.exec(query.offset(offset).limit(per_page)).all()

        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": pages,
        }

    def get_by_id(self, entity_id: int) -> Ingrediente | None:
        """Busca ingrediente por ID (activo o inactivo)."""
        return super().get_by_id(entity_id)

    def soft_delete(self, ingrediente: Ingrediente) -> Ingrediente:
        """Soft-delete: setea deleted_at."""
        ingrediente.deleted_at = datetime.now(timezone.utc)
        return self.update(ingrediente)

    def restore(self, ingrediente: Ingrediente) -> Ingrediente:
        """Restaura un ingrediente dado de baja."""
        ingrediente.deleted_at = None
        return self.update(ingrediente)
