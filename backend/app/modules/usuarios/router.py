"""Router de Usuarios — listado para administradores."""

from typing import Annotated, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import select

from app.core.deps import get_current_user, require_role
from app.core.uow import UnitOfWork, get_uow
from app.modules.usuarios.model import Usuario

router = APIRouter(prefix="/api/v1/usuarios", tags=["Usuarios"])


class UsuarioAdminResponse(BaseModel):
    id: int
    nombre: str
    apellido: str
    email: str
    celular: str
    created_at: datetime
    deleted_at: Optional[datetime] = None


@router.get(
    "",
    response_model=List[UsuarioAdminResponse],
    dependencies=[Depends(require_role(["ADMIN"]))],
)
def listar_usuarios(uow: Annotated[UnitOfWork, Depends(get_uow)]):
    """Lista todos los usuarios activos. Solo ADMIN."""
    with uow:
        stmt = (
            select(Usuario)
            .where(Usuario.deleted_at.is_(None))
            .order_by(Usuario.created_at.desc())
        )
        usuarios = uow.session.exec(stmt).all()
        return [
            UsuarioAdminResponse(
                id=u.id,
                nombre=u.nombre,
                apellido=u.apellido,
                email=u.email,
                celular=u.celular,
                created_at=u.created_at,
            )
            for u in usuarios
        ]
