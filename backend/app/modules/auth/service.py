"""Servicio de autenticación."""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password, create_access_token
from app.modules.usuarios.model import Usuario
from app.modules.auth.schemas import LoginRequest, RegisterRequest, TokenResponse


def authenticate_user(db: Session, data: LoginRequest) -> TokenResponse:
    """Autentica usuario y retorna JWT."""
    user = db.query(Usuario).filter(
        Usuario.email == data.email,
        Usuario.deleted_at.is_(None),
    ).first()

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


def register_user(db: Session, data: RegisterRequest) -> TokenResponse:
    """Registra un nuevo usuario y retorna JWT."""
    existing = db.query(Usuario).filter(Usuario.email == data.email).first()
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
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        nombre=user.nombre,
        email=user.email,
        rol=user.rol,
    )
