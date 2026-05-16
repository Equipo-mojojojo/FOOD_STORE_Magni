"""Food Store — Entry point de la aplicación FastAPI."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import create_all_tables
from app.modules.auth.router import router as auth_router
from app.modules.ingredientes.router import router as ingredientes_router
from app.modules.productos.router import router as productos_router
from app.modules.categorias.router import router as categorias_router

app = FastAPI(
    title="🍔 Food Store API",
    description="API del sistema Food Store — Programación 4 — TUP",
    version="1.0.0",
)

# CORS - Permitir todo para debuggear el error 500 real
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Se ejecuta al levantar el server. Crea las tablas si no existen."""
    create_all_tables()


# Routers
app.include_router(auth_router)
app.include_router(ingredientes_router)
app.include_router(productos_router)
app.include_router(categorias_router)


@app.get("/", tags=["Health"])
def health_check():
    """Health check del servidor."""
    return {"status": "ok", "app": "Food Store API"}
