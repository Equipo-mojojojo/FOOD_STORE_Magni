"""Router de autenticación."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.core.deps import get_current_user, require_role
from app.core.security import decode_access_token, hash_token
from app.core.uow import UnitOfWork, get_uow
from app.modules.auth.schemas import LoginRequest, UserCreate, UserPublic, LoginResponse
from app.modules.auth import service
from app.modules.usuarios.model import Usuario

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

# ─── Registro ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(
    data: UserCreate,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    return service.register_user(uow=uow, data=data)


# ─── Login ────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    response: Response,
):
    """Login vía JSON — setea cookies HttpOnly para access y refresh token."""
    token = service.authenticate_user(uow, data)

    # Cookie HttpOnly para access token
    response.set_cookie(
        key="access_token",
        value=token.access_token,
        httponly=True,
        max_age=token.expires_in,
        samesite="lax",
        secure=False,
    )

    # Cookie HttpOnly para refresh token
    response.set_cookie(
        key="refresh_token",
        value=token.refresh_token,
        httponly=True,
        max_age=60 * 60 * 24 * 7,  # 7 días
        samesite="lax",
        secure=False,
        path="/api/v1/auth/refresh",  # solo se envía al endpoint de refresh
    )

    # Obtener datos del usuario para la respuesta
    payload = decode_access_token(token.access_token)
    with uow:
        user = uow.usuarios.get_by_id(int(payload["sub"]))
        roles = uow.usuario_roles.get_roles_activos(user.id)

    return LoginResponse(
        access_token=token.access_token,
        token_type=token.token_type,
        expires_in=token.expires_in,
        user=UserPublic(
            id=user.id,
            nombre=user.nombre,
            apellido=user.apellido,
            email=user.email,
            celular=user.celular,
            roles=roles,
        ),
    )


# ─── Refresh ──────────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=LoginResponse)
def refresh(
    request: Request,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    response: Response,
):
    """Renueva el access token usando el refresh token de la cookie."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token no encontrado",
        )

    token = service.refresh_access_token(uow, refresh_token)

    # Actualizar cookies
    response.set_cookie(
        key="access_token",
        value=token.access_token,
        httponly=True,
        max_age=token.expires_in,
        samesite="lax",
        secure=False,
    )
    response.set_cookie(
        key="refresh_token",
        value=token.refresh_token,
        httponly=True,
        max_age=60 * 60 * 24 * 7,
        samesite="lax",
        secure=False,
        path="/api/v1/auth/refresh",
    )

    # Datos del usuario
    payload = decode_access_token(token.access_token)
    with uow:
        user = uow.usuarios.get_by_id(int(payload["sub"]))
        roles = uow.usuario_roles.get_roles_activos(user.id)

    return LoginResponse(
        access_token=token.access_token,
        token_type=token.token_type,
        expires_in=token.expires_in,
        user=UserPublic(
            id=user.id,
            nombre=user.nombre,
            apellido=user.apellido,
            email=user.email,
            celular=user.celular,
            roles=roles,
        ),
    )


# ─── Logout ──────────────────────────────────────────────────────────────────

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    """Cierra sesión: revoca refresh token y limpia cookies."""
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        with uow:
            uow.refresh_tokens.revocar(hash_token(refresh_token))

    response.delete_cookie(key="access_token", httponly=True, samesite="lax", secure=False)
    response.delete_cookie(key="refresh_token", httponly=True, samesite="lax", secure=False, path="/api/v1/auth/refresh")
    return {"mensaje": "Sesión cerrada exitosamente"}


# ─── Rutas protegidas ────────────────────────────────────────────────────────

@router.get("/me", response_model=UserPublic)
def read_me(
    current_user: Annotated[Usuario, Depends(get_current_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    with uow:
        roles = uow.usuario_roles.get_roles_activos(current_user.id)
    return UserPublic(
        id=current_user.id,
        nombre=current_user.nombre,
        apellido=current_user.apellido,
        email=current_user.email,
        celular=current_user.celular,
        roles=roles,
    )


# ─── Rutas de administración (RBAC) ──────────────────────────────────────────

@router.get("/admin/usuarios", response_model=list[UserPublic])
def list_users(
    _admin: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    with uow:
        users = uow.usuarios.get_all()
        result = []
        for u in users:
            roles = uow.usuario_roles.get_roles_activos(u.id)
            result.append(UserPublic(
                id=u.id,
                nombre=u.nombre,
                apellido=u.apellido,
                email=u.email,
                celular=u.celular,
                roles=roles,
            ))
        return result


@router.post("/admin/usuarios/{user_id}/desactivar")
def deactivate_user(
    user_id: int,
    _admin: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    """Soft-delete: marca deleted_at en el usuario."""
    from datetime import datetime, timezone
    with uow:
        user = uow.usuarios.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        user.deleted_at = datetime.now(timezone.utc)
        uow.usuarios.update(user)
        # Revocar todos sus refresh tokens
        uow.refresh_tokens.revocar_todos(user_id)
        return {"mensaje": f"Usuario {user.email} desactivado"}


@router.post("/admin/usuarios/{user_id}/activar")
def activate_user(
    user_id: int,
    _admin: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    """Restaura un usuario soft-deleted."""
    with uow:
        # Buscar incluso los borrados
        from sqlmodel import select
        user = uow.session.exec(
            select(Usuario).where(Usuario.id == user_id)
        ).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        user.deleted_at = None
        uow.usuarios.update(user)
        return {"mensaje": f"Usuario {user.email} reactivado"}
