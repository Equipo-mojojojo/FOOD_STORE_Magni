"""Food Store — Entry point de la aplicación FastAPI."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.database import create_all_tables
from app.modules.auth.router import router as auth_router
from app.modules.ingredientes.router import router as ingredientes_router
from app.modules.productos.router import router as productos_router
from app.modules.categorias.router import router as categorias_router
from app.modules.pedidos.router import router as pedidos_router
from app.modules.usuarios.router import router as usuarios_router
from app.modules.direcciones.router import router as direcciones_router
from app.modules.upload.router import router as upload_router
from app.modules.estadisticas.router import router as estadisticas_router

app = FastAPI(
    title="🍔 Food Store API",
    description="API del sistema Food Store — Programación 4 — TUP",
    version="1.0.0",
)

# CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir archivos estáticos (uploads)
import os
os.makedirs("uploads", exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory="uploads"), name="static_uploads")


@app.on_event("startup")
def on_startup():
    """Se ejecuta al levantar el server. Crea las tablas si no existen."""
    create_all_tables()


# Routers
app.include_router(auth_router)
app.include_router(ingredientes_router)
app.include_router(productos_router)
app.include_router(categorias_router)
app.include_router(pedidos_router)
app.include_router(usuarios_router)
app.include_router(direcciones_router)
app.include_router(upload_router)
app.include_router(estadisticas_router)

@app.get("/", tags=["Health"])
def health_check():
    """Health check del servidor."""
    return {"status": "ok", "app": "Food Store API"}
