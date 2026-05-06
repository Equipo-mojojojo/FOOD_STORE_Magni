"""Servicio de autenticación."""
from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password, create_access_token
from app.core.uow import UnitOfWork
from app.modules.usuarios.model import Usuario
from app.modules.auth.schemas import LoginRequest, RegisterRequest, TokenResponse


def authenticate_user(uow: UnitOfWork, data: LoginRequest) -> TokenResponse:
    """Autentica usuario y retorna JWT."""
    with uow:
        user = uow.usuarios.get_by_email(data.email)

        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos",
            )

        token = create_access_token(data={"sub": str(user.id)})
        return TokenResponse(
            access_token=token,
            user_id=user.id,
            nombre=user.nombre,
            email=user.email,
            rol=user.rol,
        )


def register_user(uow: UnitOfWork, data: RegisterRequest) -> TokenResponse:
    """Registra un nuevo usuario y retorna JWT."""
    with uow:
        existing = uow.usuarios.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El email ya está registrado",
            )

        user = Usuario(
            nombre=data.nombre,
            email=data.email,
            password_hash=hash_password(data.password),
            rol="CLIENT",
        )
        uow.usuarios.add(user)
        # El context manager __exit__ hace el commit automático aquí.
        # Necesitamos el ID generado, así que refrescamos o forzamos commit manual si hace falta.
        uow.commit() # Forzamos commit para tener el ID del usuario
        uow.session.refresh(user)

        token = create_access_token(data={"sub": str(user.id)})
        return TokenResponse(
            access_token=token,
            user_id=user.id,
            nombre=user.nombre,
            email=user.email,
            rol=user.rol,
        )
