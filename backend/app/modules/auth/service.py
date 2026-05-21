"""Servicio de autenticación."""
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.core.uow import UnitOfWork
from app.modules.usuarios.model import Usuario
from app.modules.auth.schemas import LoginRequest, UserCreate, UserPublic, TokenResponse


def authenticate_user(uow: UnitOfWork, data: LoginRequest) -> TokenResponse:
    """Autentica usuario y retorna JWT."""
    with uow:
        user = uow.usuarios.get_by_email(data.email)

        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos",
                headers={"WWW-Authenticate": "Bearer"},
            )

        
        if user.disabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cuenta de usuario desactivada",
            )

        token = create_access_token(data={"sub": str(user.id)})
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
       
        )


def register_user(uow: UnitOfWork, data: UserCreate) -> UserPublic:
    """Registra un nuevo usuario y retorna la vista pública."""
    with uow:
        
        if uow.usuarios.get_by_username(data.username):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El nombre de usuario ya está en uso",
            )
            
        if uow.usuarios.get_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El email ya está registrado",
            )
        user = Usuario(
            username=data.username,
            full_name=data.full_name,
            email=data.email,
            password_hash=hash_password(data.password),
            role="CLIENT",
        )
        uow.usuarios.add(user)
         
        return UserPublic.model_validate(user)