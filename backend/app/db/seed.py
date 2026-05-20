"""
Script de seed — carga usuarios e ingredientes iniciales para pruebas.
Idempotente: se puede ejecutar múltiples veces sin duplicar datos.

Uso:
    python -m app.db.seed

Requiere PostgreSQL corriendo con las variables de .env configuradas.

Crea:
  - Administrador / admin  (rol=admin)
  - 10 ingredientes básicos
  - 7 unidades de medida
"""

from sqlmodel import Session, select
from app.core.database import engine, create_all_tables
from app.core.security import hash_password
from app.modules.usuarios.model import Usuario
from app.modules.ingredientes.model import Ingrediente
from app.modules.productos.model import UnidadMedida


USUARIOS_INICIALES = [
    {
        "username": "admin",
        "full_name": "Administrador",
        "email": "admin@foodstore.com",
        "password": "admin",
        "role": "admin",
    },
]

INGREDIENTES_INICIALES = [
    {"nombre": "Harina 0000", "descripcion": "Harina refinada", "es_alergeno": True, "unidad": "kilogramo", "stock": 10.0, "precio": 800.0},
    {"nombre": "Harina 000", "descripcion": "Harina de fuerza", "es_alergeno": True, "unidad": "kilogramo", "stock": 5.0, "precio": 750.0},
    {"nombre": "Levadura Fresca", "descripcion": "Levadura", "es_alergeno": False, "unidad": "gramo", "stock": 500.0, "precio": 10.0},
    {"nombre": "Sal Fina", "descripcion": "Sal común", "es_alergeno": False, "unidad": "gramo", "stock": 1000.0, "precio": 5.0},
    {"nombre": "Agua Filtrada", "descripcion": "Agua purificada", "es_alergeno": False, "unidad": "litro", "stock": 100.0, "precio": 0.0},
    {"nombre": "Aceite de Oliva", "descripcion": "Aceite virgen extra", "es_alergeno": False, "unidad": "litro", "stock": 5.0, "precio": 4500.0},
    {"nombre": "Queso Mozzarella", "descripcion": "Queso para pizza", "es_alergeno": True, "unidad": "kilogramo", "stock": 10.0, "precio": 6000.0},
    {"nombre": "Tomate Triturado", "descripcion": "Salsa base", "es_alergeno": False, "unidad": "litro", "stock": 10.0, "precio": 1200.0},
    {"nombre": "Orégano", "descripcion": "Orégano seco", "es_alergeno": False, "unidad": "gramo", "stock": 200.0, "precio": 20.0},
    {"nombre": "Albahaca Fresca", "descripcion": "Hojas frescas", "es_alergeno": False, "unidad": "gramo", "stock": 100.0, "precio": 50.0},
]

UNIDADES_MEDIDA_INICIALES = [
    {"nombre": "kilogramo", "simbolo": "kg", "tipo": "masa", "factor_conversion": 1000.0},
    {"nombre": "gramo", "simbolo": "g", "tipo": "masa", "factor_conversion": 1.0},
    {"nombre": "litro", "simbolo": "L", "tipo": "volumen", "factor_conversion": 1000.0},
    {"nombre": "mililitro", "simbolo": "mL", "tipo": "volumen", "factor_conversion": 1.0},
    {"nombre": "pieza", "simbolo": "u", "tipo": "unidad", "factor_conversion": 1.0},
    {"nombre": "docena", "simbolo": "doc", "tipo": "unidad", "factor_conversion": 12.0},
    {"nombre": "metro cuadrado", "simbolo": "m²", "tipo": "area", "factor_conversion": 1.0},
]


def run() -> None:
    print("=== Seed — Food Store (PostgreSQL + SQLModel) ===")
    create_all_tables()

    with Session(engine) as session:
        # 1. Seed Usuarios — primero porque no depende de nada
        print("Sedeando usuarios...")
        for u_data in USUARIOS_INICIALES:
            existing = session.exec(select(Usuario).where(Usuario.email == u_data["email"])).first()
            if not existing:
                u = Usuario(
                    username=u_data["username"],
                    full_name=u_data["full_name"],
                    email=u_data["email"],
                    password_hash=hash_password(u_data["password"]),
                    role=u_data["role"],
                )
                session.add(u)
                print(f"  [+] Usuario creado: {u.email}")
            else:
                print(f"  [=] Usuario ya existe: {u_data['email']}")

        # 2. Seed Unidades de Medida — ANTES que ingredientes (FK)
        print("Sedeando unidades de medida...")
        for u_data in UNIDADES_MEDIDA_INICIALES:
            existing = session.exec(select(UnidadMedida).where(UnidadMedida.nombre == u_data["nombre"])).first()
            if not existing:
                u = UnidadMedida(**u_data)
                session.add(u)
                print(f"  [+] Unidad de Medida creada: {u.nombre}")
            else:
                print(f"  [=] Unidad de Medida ya existe: {u_data['nombre']}")

        # Flush para que las unidades tengan ID antes de usarlas en ingredientes
        session.flush()

        # 3. Seed Ingredientes — depende de UnidadMedida
        print("Sedeando ingredientes...")
        for i_data in INGREDIENTES_INICIALES:
            existing = session.exec(select(Ingrediente).where(Ingrediente.nombre == i_data["nombre"])).first()

            # Buscar ID de unidad por nombre
            unidad_obj = session.exec(select(UnidadMedida).where(UnidadMedida.nombre == i_data["unidad"])).first()
            unidad_id = unidad_obj.id if unidad_obj else None

            if not existing:
                i = Ingrediente(
                    nombre=i_data["nombre"],
                    descripcion=i_data["descripcion"],
                    es_alergeno=i_data["es_alergeno"],
                    unidad_medida_id=unidad_id,
                    stock_actual=i_data["stock"],
                    precio_costo=i_data["precio"]
                )
                session.add(i)
                print(f"  [+] Ingrediente creado: {i.nombre} ({i_data['unidad']})")
            else:
                # Actualizar si no tiene unidad o stock
                existing.unidad_medida_id = unidad_id
                existing.stock_actual = i_data["stock"]
                existing.precio_costo = i_data["precio"]
                session.add(existing)
                print(f"  [=] Ingrediente actualizado: {existing.nombre}")

        session.commit()
    print("=== Seed completado exitosamente ===")


if __name__ == "__main__":
    run()
