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
        es_alergeno: bool | None,
        estado: str,
        sort_by: str,
        sort_order: str,
        created_from=None,
        created_to=None,
        updated_from=None,
        updated_to=None,
        starts_with: str | None = None,
    ) -> PaginatedIngredientes:
        """Lista ingredientes con filtros y paginación."""
        with self.uow:
            result = self.uow.ingredientes.get_paginated(
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
        return PaginatedIngredientes(**result)

    def export_csv(
        self,
        search: str | None,
        es_alergeno: bool | None,
        estado: str,
        sort_by: str,
        sort_order: str,
        created_from=None,
        created_to=None,
        updated_from=None,
        updated_to=None,
        starts_with: str | None = None,
    ) -> str:
        """Exporta ingredientes a formato CSV aplicando filtros."""
        import csv
        import io
        
        with self.uow:
            result = self.uow.ingredientes.get_paginated(
                page=1,
                per_page=1000000, # Un límite grande para traer todos los de la consulta
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
        
        output = io.StringIO()
        # Generar CSV compatible con Excel (separador coma/punto y coma según la región del Excel del usuario, dejamos coma por defecto que es universal en CSVs standard)
        writer = csv.writer(output, delimiter=",", quoting=csv.QUOTE_MINIMAL)
        # Cabeceras
        writer.writerow(["ID", "Nombre", "Descripcion", "Alergeno", "Estado", "Fecha Creacion", "Fecha Actualizacion"])
        
        for item in result["items"]:
            estado_txt = "Dado de baja" if item.deleted_at else "Activo"
            alergeno_txt = "Si" if item.es_alergeno else "No"
            created_txt = item.created_at.strftime("%Y-%m-%d %H:%M") if item.created_at else ""
            updated_txt = item.updated_at.strftime("%Y-%m-%d %H:%M") if item.updated_at else ""
            writer.writerow([
                item.id,
                item.nombre,
                item.descripcion or "",
                alergeno_txt,
                estado_txt,
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
            ingrediente = Ingrediente(nombre=data.nombre, descripcion=data.descripcion, es_alergeno=data.es_alergeno)
            try:
                self.uow.ingredientes.add(ingrediente)
                self.uow.session.flush()  
                self.uow.session.refresh(ingrediente)
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
            update_data = data.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(ingrediente, key, value)
            try:
                self.uow.ingredientes.update(ingrediente)
                self.uow.session.flush()
            except IntegrityError:
                self.uow.rollback()
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Este ingrediente ya existe"
                )
        return ingrediente

    def soft_delete(self, ingrediente_id: int):
        """Soft-delete de un ingrediente."""
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
                    detail="El ingrediente ya está dado de baja",
                )
            self.uow.ingredientes.soft_delete(ingrediente)
        return ingrediente

    def restore(self, ingrediente_id: int):
        """Restaura un ingrediente dado de baja."""
        with self.uow:
            # Note: get_by_id on ingrediente repo allows getting inactive as well.
            # The BaseRepository get_by_id doesn't filter by deleted_at unless overridden.
            ingrediente = self.uow.ingredientes.get_by_id(ingrediente_id)
            if not ingrediente:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ingrediente no encontrado",
                )
            if ingrediente.deleted_at is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El ingrediente ya está activo",
                )
            self.uow.ingredientes.restore(ingrediente)
        return ingrediente
