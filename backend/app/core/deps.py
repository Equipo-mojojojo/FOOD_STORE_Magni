"""
Dependencias de autenticación y autorización para inyectar vía Depends().

Flujo de resolución:
    Request
      → oauth2_scheme extrae el Bearer token del header Authorization
      → get_current_user abre un UoW, decodifica el JWT, carga el usuario
      → require_role([...]) verifica que el rol del usuario esté permitido

Separación semántica de errores HTTP:
    401 = no autenticado (sin token / token inválido / expirado)
    403 = autenticado pero sin permisos (rol insuficiente)

Capa: Core (dependencias transversales)
Conoce a: UoW, Security, Model
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.core.uow import UnitOfWork, get_uow
from app.modules.usuarios.model import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> Usuario:
    """Decodifica el JWT y retorna el Usuario correspondiente."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    with uow:
        user = uow.usuarios.get_by_id(int(user_id))

    if user is None:
        raise credentials_exception

    return user


def require_role(allowed_roles: list[str]):
    """
    Factory de dependencias para control de acceso basado en roles (RBAC).

    Uso:
        @router.get("/admin/...", dependencies=[Depends(require_role(["ADMIN"]))])
    """
    async def role_checker(
        current_user: Annotated[Usuario, Depends(get_current_user)],
    ) -> Usuario:
        if current_user.rol not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Permisos insuficientes. Tu rol es '{current_user.rol}'. "
                    f"Se requiere uno de: {allowed_roles}"
                ),
            )
        return current_user

    return role_checker
