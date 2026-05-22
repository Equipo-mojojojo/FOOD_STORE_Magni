"""Schemas Pydantic para autenticación."""
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Request body para login."""
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    """Datos requeridos para registrar un usuario."""
    nombre: str = Field(min_length=1, max_length=60)
    apellido: str = Field(default="", max_length=60)
    email: EmailStr
    celular: str = Field(default="", max_length=20)
    password: str = Field(min_length=8)


class UserPublic(BaseModel):
    """Vista pública del usuario — excluye password_hash."""
    id: int
    nombre: str
    apellido: str
    email: str
    celular: str
    roles: list[str] = []

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    """Respuesta del endpoint /login."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos hasta expiración del access token
    user: UserPublic


class TokenResponse(BaseModel):
    """Respuesta interna del service (access + refresh)."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
