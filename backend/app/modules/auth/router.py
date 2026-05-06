"""Router de autenticación."""
from fastapi import APIRouter, Depends

from app.core.uow import UnitOfWork, get_uow
from app.modules.auth.schemas import LoginRequest, RegisterRequest, TokenResponse
from app.modules.auth import service

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, uow: UnitOfWork = Depends(get_uow)):
    """Autenticación de usuario. Retorna JWT."""
    return service.authenticate_user(uow, data)


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, uow: UnitOfWork = Depends(get_uow)):
    """Registro de nuevo usuario. Retorna JWT."""
    return service.register_user(uow, data)
