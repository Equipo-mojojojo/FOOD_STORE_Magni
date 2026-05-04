"""Funciones de seguridad: hashing y JWT."""
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
import bcrypt as _bcrypt

from app.core.config import settings


def hash_password(password: str) -> str:
    """Hashea una contraseña con bcrypt."""
    return _bcrypt.hashpw(
        password.encode("utf-8"), _bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verifica una contraseña contra su hash."""
    return _bcrypt.checkpw(
        plain.encode("utf-8"), hashed.encode("utf-8")
    )


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Crea un JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Decodifica un JWT. Retorna None si es inválido."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
