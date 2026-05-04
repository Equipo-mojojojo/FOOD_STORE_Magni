"""Configuración centralizada con pydantic-settings."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Lee variables de entorno desde .env"""
    DATABASE_URL: str = "sqlite:///./food_store.db"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
