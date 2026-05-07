"""
Script de seed — carga usuarios e ingredientes iniciales para pruebas.
Idempotente: se puede ejecutar múltiples veces sin duplicar datos.

Uso:
    python -m app.db.seed

Requiere PostgreSQL corriendo con las variables de .env configuradas.

Crea:
  - admin / admin  (rol=ADMIN)
  - 10 ingredientes básicos
"""

import sys
from pathlib import Path

# Agregar la carpeta backend al path para permitir imports relativos
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlmodel import Session, select
from app.core.database import engine, create_all_tables
from app.core.security import hash_password
from app.modules.usuarios.model import Usuario
from app.modules.ingredientes.model import Ingrediente


USUARIOS_INICIALES = [
    {
        "nombre": "Administrador",
        "email": "admin@foodstore.com",
        "password": "admin",
        "rol": "ADMIN",
    },
]

INGREDIENTES_INICIALES = [
    {"nombre": "Harina 0000", "descripcion": "Harina refinada para pizzas", "es_alergeno": True},
    {"nombre": "Harina 000", "descripcion": "Harina de fuerza para panes", "es_alergeno": True},
    {"nombre": "Levadura Fresca", "descripcion": "Levadura de panadería", "es_alergeno": False},
    {"nombre": "Sal Fina", "descripcion": "Sal de mesa común", "es_alergeno": False},
    {"nombre": "Agua Filtrada", "descripcion": "Agua purificada", "es_alergeno": False},
    {"nombre": "Aceite de Oliva", "descripcion": "Aceite de oliva virgen extra", "es_alergeno": False},
    {"nombre": "Queso Mozzarella", "descripcion": "Queso de vaca para pizza", "es_alergeno": True},
    {"nombre": "Tomate Triturado", "descripcion": "Salsa base de tomate", "es_alergeno": False},
    {"nombre": "Orégano", "descripcion": "Orégano seco", "es_alergeno": False},
    {"nombre": "Albahaca Fresca", "descripcion": "Hojas de albahaca fresca", "es_alergeno": False},
]


def run() -> None:
    print("=== Seed — Food Store (PostgreSQL + SQLModel) ===")
    create_all_tables()

    with Session(engine) as session:
        # Seed Usuarios
        print("Sedeando usuarios...")
        for u_data in USUARIOS_INICIALES:
            existing = session.exec(select(Usuario).where(Usuario.email == u_data["email"])).first()
            if not existing:
                u = Usuario(
                    nombre=u_data["nombre"],
                    email=u_data["email"],
                    password_hash=hash_password(u_data["password"]),
                    rol=u_data["rol"]
                )
                session.add(u)
                print(f"  [+] Usuario creado: {u.email}")
            else:
                print(f"  [=] Usuario ya existe: {u_data['email']}")

        # Seed Ingredientes
        print("Sedeando ingredientes...")
        for i_data in INGREDIENTES_INICIALES:
            existing = session.exec(select(Ingrediente).where(Ingrediente.nombre == i_data["nombre"])).first()
            if not existing:
                i = Ingrediente(**i_data)
                session.add(i)
                print(f"  [+] Ingrediente creado: {i.nombre}")
            else:
                print(f"  [=] Ingrediente ya existe: {i_data['nombre']}")

        session.commit()
    print("=== Seed completado exitosamente ===")


if __name__ == "__main__":
    run()
