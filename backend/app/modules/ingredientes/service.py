"""Servicio de Ingrediente — lógica de negocio."""
from fastapi import HTTPException, status

from app.core.uow import UnitOfWork
from app.modules.ingredientes.model import Ingrediente
from app.modules.ingredientes.schemas import (
    IngredienteCreate,
    IngredienteUpdate,
    PaginatedIngredientes,
)


class IngredienteService:
    """Capa de servicio para ingredientes."""

    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def list_paginated(
        self,
        page: int,
        per_page: int,
        search: str | None,
        estado: str,
        es_alergeno: bool | None,
        sort_by: str,
        sort_order: str,
        created_from=None,
        created_to=None,
        updated_from=None,
        updated_to=None,
        starts_with: str | None = None,
    ) -> PaginatedIngredientes:
        """Lista ingredientes activos con filtros y paginación. Eliminados nunca aparecen."""
        with self.uow:
            result = self.uow.ingredientes.get_paginated(
                page=page,
                per_page=per_page,
                search=search,
                estado=estado,
                es_alergeno=es_alergeno,
                sort_by=sort_by,
                sort_order=sort_order,
                created_from=created_from,
                created_to=created_to,
                updated_from=updated_from,
                updated_to=updated_to,
                starts_with=starts_with,
            )
        return PaginatedIngredientes(**result)

    def export_csv(
        self,
        search: str | None,
        estado: str,
        es_alergeno: bool | None,
        sort_by: str,
        sort_order: str,
        created_from=None,
        created_to=None,
        updated_from=None,
        updated_to=None,
        starts_with: str | None = None,
    ) -> str:
        """Exporta ingredientes activos a formato CSV aplicando filtros."""
        import csv
        import io
        
        with self.uow:
            result = self.uow.ingredientes.get_paginated(
                page=1,
                per_page=1000000,
                search=search,
                estado=estado,
                es_alergeno=es_alergeno,
                sort_by=sort_by,
                sort_order=sort_order,
                created_from=created_from,
                created_to=created_to,
                updated_from=updated_from,
                updated_to=updated_to,
                starts_with=starts_with,
            )
        
        output = io.StringIO()
        writer = csv.writer(output, delimiter=",", quoting=csv.QUOTE_MINIMAL)
        writer.writerow(["ID", "Nombre", "Descripcion", "Alergeno", "Fecha Creacion", "Fecha Actualizacion"])
        
        for item in result["items"]:
            alergeno_txt = "Si" if item.es_alergeno else "No"
            created_txt = item.created_at.strftime("%Y-%m-%d %H:%M") if item.created_at else ""
            updated_txt = item.updated_at.strftime("%Y-%m-%d %H:%M") if item.updated_at else ""
            writer.writerow([
                item.id,
                item.nombre,
                item.descripcion or "",
                alergeno_txt,
                created_txt,
                updated_txt
            ])
            
        return output.getvalue()

    def get_by_id(self, ingrediente_id: int):
        """Obtiene un ingrediente por ID o lanza 404."""
        with self.uow:
            ingrediente = self.uow.ingredientes.get_by_id(ingrediente_id)
        if not ingrediente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ingrediente no encontrado",
            )
        return ingrediente

    def create(self, data: IngredienteCreate):
        """Crea un nuevo ingrediente."""
        from sqlalchemy.exc import IntegrityError
        with self.uow:
            create_data = data.model_dump(exclude={"activo"})
            ingrediente = Ingrediente(**create_data)
            
            try:
                self.uow.ingredientes.add(ingrediente)
                # Forzar carga de relación para el schema
                if ingrediente.unidad_medida_id:
                    _ = ingrediente.unidad_medida
            except IntegrityError:
                self.uow.rollback()
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Este ingrediente ya existe"
                )
        return ingrediente

    def update(self, ingrediente_id: int, data: IngredienteUpdate):
        """Actualiza un ingrediente existente."""
        from sqlalchemy.exc import IntegrityError
        with self.uow:
            ingrediente = self.uow.ingredientes.get_by_id(ingrediente_id)
            if not ingrediente:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ingrediente no encontrado",
                )
            update_data = data.model_dump(exclude_unset=True, exclude={"activo"})
            
            # Manejo de estado (activo/inactivo)
            if data.activo is True:
                ingrediente.active_at = None
            elif data.activo is False:
                from datetime import datetime, timezone
                ingrediente.active_at = datetime.now(timezone.utc)

            for key, value in update_data.items():
                setattr(ingrediente, key, value)
            try:
                self.uow.ingredientes.update(ingrediente)
                # Forzar carga de relación para el schema
                if ingrediente.unidad_medida_id:
                    _ = ingrediente.unidad_medida
            except IntegrityError:
                self.uow.rollback()
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Este ingrediente ya existe"
                )
        return ingrediente

    def eliminar(self, ingrediente_id: int):
        """Eliminación lógica de un ingrediente. Irreversible e invisible."""
        with self.uow:
            ingrediente = self.uow.ingredientes.get_by_id(ingrediente_id)
            if not ingrediente:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ingrediente no encontrado",
                )
            if ingrediente.deleted_at is not None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El ingrediente ya fue eliminado",
                )
            self.uow.ingredientes.eliminar(ingrediente)
        return ingrediente

    def dar_de_baja(self, ingrediente_id: int):
        """Da de baja (reversible) a un ingrediente."""
        with self.uow:
            ingrediente = self.uow.ingredientes.get_by_id(ingrediente_id)
            if not ingrediente:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ingrediente no encontrado",
                )
            self.uow.ingredientes.dar_de_baja(ingrediente)
        return ingrediente

    def restaurar(self, ingrediente_id: int):
        """Restaura a activo a un ingrediente dado de baja."""
        with self.uow:
            ingrediente = self.uow.ingredientes.get_by_id(ingrediente_id)
            if not ingrediente:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ingrediente no encontrado",
                )
            self.uow.ingredientes.restaurar(ingrediente)
        return ingrediente
