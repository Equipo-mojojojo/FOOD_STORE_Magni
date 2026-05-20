"""Router de autenticación."""
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.core.deps import get_current_user, require_role
from app.core.security import decode_access_token
from app.core.uow import UnitOfWork, get_uow
from app.modules.auth.schemas import LoginRequest, UserCreate, UserPublic, TokenResponse
from app.modules.auth import service
from app.modules.usuarios.model import Usuario

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

# ─── Registro ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(
    data: UserCreate,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
   
    return service.register_user(uow=uow , data=data)



@router.post("/login")
def login_json(
    data: LoginRequest,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    response: Response,
):
    """Login vía JSON (para el frontend React)."""
    token = service.authenticate_user(uow, data)

    # Cookie HttpOnly — el frontend no necesita manipular el token
    response.set_cookie(
        key="access_token",
        value=token.access_token,
        httponly=True,
        max_age=token.expires_in,
        samesite="lax",
        secure=False,
    )

    # Obtener datos del usuario para la respuesta
    payload = decode_access_token(token.access_token)
    with uow:
        user = uow.usuarios.get_by_id(int(payload["sub"]))

    return {
        "access_token": token.access_token,
        "token_type": token.token_type,
        "user_id": user.id if user else None,
        "nombre": user.full_name if user else None,
        "email": user.email if user else None,
        "rol": user.role if user else None,
    }


@router.post("/logout")
def logout(response: Response):
    # Limpiar la cookie HttpOnly al cerrar sesión
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        secure=False,
    )
    return {"mensaje": "Sesión cerrada exitosamente"}

# ─── Rutas protegidas ────────────────────────────────────────────────────────

@router.get("/me", response_model=UserPublic)
def read_me(
    current_user: Annotated[Usuario, Depends(get_current_user)],
):
    return current_user


@router.get("/privado")
def ruta_privada(
    current_user: Annotated[Usuario, Depends(get_current_user)],
):
    return {
        "mensaje": f"¡Hola, {current_user.full_name}! Accediste a una ruta privada.",
        "tu_rol": current_user.role,
    }


# ─── Rutas de administración (RBAC) ──────────────────────────────────────────

@router.get("/admin/usuarios", response_model=list[UserPublic])
def list_users(
    _admin: Annotated[Usuario, Depends(require_role(["admin"]))],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    with uow:
        return uow.usuarios.get_all()


@router.post("/admin/usuarios/{user_id}/desactivar", response_model=UserPublic)
def deactivate_user(
    user_id: int,
    _admin: Annotated[Usuario, Depends(require_role(["admin"]))],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    with uow:
        user = uow.usuarios.get_by_id(user_id)
        if not user:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        user.disabled = True
        uow.usuarios.update(user)
        return user


@router.post("/admin/usuarios/{user_id}/activar", response_model=UserPublic)
def activate_user(
    user_id: int,
    _admin: Annotated[Usuario, Depends(require_role(["admin"]))],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    with uow:
        user = uow.usuarios.get_by_id(user_id)
        if not user:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        user.disabled = False
        uow.usuarios.update(user)
        return user
