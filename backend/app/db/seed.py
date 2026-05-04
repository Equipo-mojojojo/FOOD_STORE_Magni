"""Script de seed — datos iniciales para desarrollo."""
from app.db.base import engine, Base
from app.db.session import SessionLocal
from app.core.security import hash_password
from app.modules.usuarios.model import Usuario
from app.modules.ingredientes.model import Ingrediente


def seed():
    """Crea tablas e inserta datos iniciales."""
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Crear admin si no existe
        admin = db.query(Usuario).filter(Usuario.email == "admin@foodstore.com").first()
        if not admin:
            admin = Usuario(
                nombre="Administrador",
                email="admin@foodstore.com",
                password_hash=hash_password("admin123"),
                rol="ADMIN",
            )
            db.add(admin)
            print("[OK] Usuario admin creado (admin@foodstore.com / admin123)")

        # Crear ingredientes de ejemplo si no existen
        ingredientes_data = [
            {"nombre": "Harina de trigo", "es_alergeno": True},
            {"nombre": "Leche entera", "es_alergeno": True},
            {"nombre": "Huevo", "es_alergeno": True},
            {"nombre": "Manteca", "es_alergeno": True},
            {"nombre": "Azucar", "es_alergeno": False},
            {"nombre": "Sal fina", "es_alergeno": False},
            {"nombre": "Aceite de girasol", "es_alergeno": False},
            {"nombre": "Tomate triturado", "es_alergeno": False},
            {"nombre": "Mozzarella", "es_alergeno": True},
            {"nombre": "Cebolla", "es_alergeno": False},
            {"nombre": "Ajo", "es_alergeno": False},
            {"nombre": "Pimiento rojo", "es_alergeno": False},
            {"nombre": "Oregano", "es_alergeno": False},
            {"nombre": "Albahaca", "es_alergeno": False},
            {"nombre": "Pimienta negra", "es_alergeno": False},
            {"nombre": "Queso crema", "es_alergeno": True},
            {"nombre": "Jamon cocido", "es_alergeno": False},
            {"nombre": "Panceta ahumada", "es_alergeno": False},
            {"nombre": "Carne picada", "es_alergeno": False},
            {"nombre": "Pollo deshuesado", "es_alergeno": False},
            {"nombre": "Lechuga", "es_alergeno": False},
            {"nombre": "Tomate fresco", "es_alergeno": False},
            {"nombre": "Pepino", "es_alergeno": False},
            {"nombre": "Mani", "es_alergeno": True},
            {"nombre": "Soja", "es_alergeno": True},
        ]

        existing_count = db.query(Ingrediente).count()
        if existing_count == 0:
            for data in ingredientes_data:
                db.add(Ingrediente(**data))
            print(f"[OK] {len(ingredientes_data)} ingredientes de ejemplo creados")

        db.commit()
        print("[OK] Seed completado exitosamente")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
