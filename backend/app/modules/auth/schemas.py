"""Schemas Pydantic para autenticación."""
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Request body para login."""
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Request body para registro."""
    nombre: str
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Response con JWT token."""
    access_token: str
    token_type: str = "bearer"
    user_id: int
    nombre: str
    email: str
    rol: str
