"""
Repositorio de Usuarios — acceso a BD.

Hereda de BaseRepository.
Agrega queries específicas de Usuario.
"""

from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.usuarios.model import Usuario


class UsuarioRepository(BaseRepository[Usuario]):
    """Encapsula todas las queries de Usuario."""

    def __init__(self, session: Session):
        super().__init__(Usuario, session)

    def get_by_email(self, email: str) -> Usuario | None:
        """Busca un usuario activo por email."""
        return self.session.exec(
            select(Usuario).where(
                Usuario.email == email,
                Usuario.deleted_at.is_(None)
            )
        ).first()

    def get_by_id(self, entity_id: int) -> Usuario | None:
        """Sobrescribe get_by_id para asegurar que esté activo."""
        return self.session.exec(
            select(Usuario).where(
                Usuario.id == entity_id,
                Usuario.deleted_at.is_(None)
            )
        ).first()
