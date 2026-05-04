"""Router de autenticación."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.auth.schemas import LoginRequest, RegisterRequest, TokenResponse
from app.modules.auth import service

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Autenticación de usuario. Retorna JWT."""
    return service.authenticate_user(db, data)


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Registro de nuevo usuario. Retorna JWT."""
    return service.register_user(db, data)
