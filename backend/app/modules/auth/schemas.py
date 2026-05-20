"""Schemas Pydantic para autenticación."""
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Request body para login."""
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    """Datos requeridos para registrar un usuario."""
    username:  str
    full_name: str
    email:     EmailStr
    password:  str = Field(min_length=8)


class UserPublic(BaseModel):
    """Vista pública del usuario — excluye hashed_password."""
    id:        int
    username:  str
    full_name: str
    email:     str
    role:      str
    disabled:  bool

#queda este el nuestro
class TokenResponse(BaseModel):
    """Respuesta del endpoint /token.."""
    access_token: str
    token_type: str = "bearer"
    expires_in:   int  # segundos hasta expiración
   
