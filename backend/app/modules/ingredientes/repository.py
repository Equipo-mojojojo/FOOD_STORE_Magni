"""Repositorio de Ingrediente — acceso a BD."""
import math
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc

from app.modules.ingredientes.model import Ingrediente


class IngredienteRepository:
    """Encapsula todas las queries de Ingrediente."""

    def __init__(self, db: Session):
        self.db = db

    def get_paginated(
        self,
        page: int = 1,
        per_page: int = 10,
        search: str | None = None,
        es_alergeno: bool | None = None,
        estado: str = "activo",
        sort_by: str = "nombre",
        sort_order: str = "asc",
    ) -> dict:
        """
        Lista ingredientes con 6 filtros + paginación.

        Filtros:
        1. search — buscar por nombre (ILIKE)
        2. es_alergeno — True/False/None(todos)
        3. estado — 'activo' / 'inactivo' / 'todos'
        4. sort_by — 'nombre' / 'created_at'
        5. sort_order — 'asc' / 'desc'
        6. per_page — 10 / 20 / 50
        """
        query = self.db.query(Ingrediente)

        # Filtro 3: estado (activo = sin deleted_at, inactivo = con deleted_at)
        if estado == "activo":
            query = query.filter(Ingrediente.deleted_at.is_(None))
        elif estado == "inactivo":
            query = query.filter(Ingrediente.deleted_at.isnot(None))
        # 'todos' no filtra

        # Filtro 1: búsqueda por nombre
        if search:
            query = query.filter(Ingrediente.nombre.ilike(f"%{search}%"))

        # Filtro 2: alérgeno
        if es_alergeno is not None:
            query = query.filter(Ingrediente.es_alergeno == es_alergeno)

        # Total para paginación
        total = query.count()

        # Filtro 4 + 5: ordenamiento
        sort_column = getattr(Ingrediente, sort_by, Ingrediente.nombre)
        order_func = asc if sort_order == "asc" else desc
        query = query.order_by(order_func(sort_column))

        # Filtro 6: paginación
        pages = math.ceil(total / per_page) if total > 0 else 1
        offset = (page - 1) * per_page
        items = query.offset(offset).limit(per_page).all()

        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": pages,
        }

    def get_by_id(self, ingrediente_id: int) -> Ingrediente | None:
        """Busca ingrediente por ID."""
        return self.db.query(Ingrediente).filter(
            Ingrediente.id == ingrediente_id
        ).first()

    def create(self, nombre: str, es_alergeno: bool = False) -> Ingrediente:
        """Crea un nuevo ingrediente."""
        ingrediente = Ingrediente(nombre=nombre, es_alergeno=es_alergeno)
        self.db.add(ingrediente)
        self.db.commit()
        self.db.refresh(ingrediente)
        return ingrediente

    def update(self, ingrediente: Ingrediente, **kwargs) -> Ingrediente:
        """Actualiza campos de un ingrediente."""
        for key, value in kwargs.items():
            if value is not None:
                setattr(ingrediente, key, value)
        self.db.commit()
        self.db.refresh(ingrediente)
        return ingrediente

    def soft_delete(self, ingrediente: Ingrediente) -> Ingrediente:
        """Soft-delete: setea deleted_at."""
        ingrediente.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(ingrediente)
        return ingrediente

    def restore(self, ingrediente: Ingrediente) -> Ingrediente:
        """Restaura un ingrediente dado de baja."""
        ingrediente.deleted_at = None
        self.db.commit()
        self.db.refresh(ingrediente)
        return ingrediente
