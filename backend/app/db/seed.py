"""
Script de seed — carga roles, usuarios e ingredientes iniciales para pruebas.
Idempotente: se puede ejecutar múltiples veces sin duplicar datos.

Uso:
    python -m app.db.seed

Requiere PostgreSQL corriendo con las variables de .env configuradas.

Crea:
  - Catálogo de roles: ADMIN, STOCK, PEDIDOS, CLIENT
  - Administrador (rol=ADMIN)
  - 10 ingredientes básicos
  - 7 unidades de medida
  - 5 estados de pedido
  - 2 formas de pago
"""

from sqlmodel import Session, select
from app.core.database import engine, create_all_tables
from app.core.security import hash_password
from app.modules.usuarios.model import Usuario
from app.modules.usuarios.rol_model import Rol, UsuarioRol
from app.modules.ingredientes.model import Ingrediente
from app.modules.productos.model import UnidadMedida
from app.modules.pedidos.model import EstadoPedido, FormaPago


ROLES_INICIALES = [
    {"codigo": "ADMIN",  "nombre": "Administrador",  "descripcion": "Acceso total sin restricciones"},
    {"codigo": "STOCK",  "nombre": "Stock Manager",   "descripcion": "Actualiza stock y disponibilidad"},
    {"codigo": "PEDIDOS", "nombre": "Pedidos",         "descripcion": "Ver y avanzar estados de pedidos"},
    {"codigo": "CLIENT", "nombre": "Cliente",         "descripcion": "Opera solo sus propios datos"},
]

USUARIOS_INICIALES = [
    {
        "nombre": "Administrador",
        "apellido": "FoodStore",
        "email": "admin@foodstore.com",
        "password": "admin",
        "roles": ["ADMIN"],
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

ESTADOS_PEDIDO_INICIALES = [
    {"codigo": "PENDIENTE",   "descripcion": "Pedido recibido, esperando confirmación", "orden": 1, "es_terminal": False},
    {"codigo": "CONFIRMADO",  "descripcion": "Pago confirmado, listo para preparar",    "orden": 2, "es_terminal": False},
    {"codigo": "EN_PREP",     "descripcion": "En preparación en cocina",                "orden": 3, "es_terminal": False},
    {"codigo": "EN_CAMINO",   "descripcion": "En camino al cliente",                    "orden": 4, "es_terminal": False},
    {"codigo": "ENTREGADO",   "descripcion": "Entregado al cliente",                    "orden": 5, "es_terminal": True},
    {"codigo": "CANCELADO",   "descripcion": "Pedido cancelado",                        "orden": 6, "es_terminal": True},
]

FORMAS_PAGO_INICIALES = [
    {"codigo": "EFECTIVO",      "descripcion": "Efectivo al retirar en local", "habilitado": True},
    {"codigo": "TRANSFERENCIA", "descripcion": "Transferencia bancaria",       "habilitado": True},
]


def run() -> None:
    print("=== Seed — Food Store (PostgreSQL + SQLModel) ===")
    create_all_tables()

    with Session(engine) as session:
        # 1. Seed Roles — catálogo (PK semántica)
        print("Sedeando roles...")
        for r_data in ROLES_INICIALES:
            existing = session.exec(select(Rol).where(Rol.codigo == r_data["codigo"])).first()
            if not existing:
                r = Rol(**r_data)
                session.add(r)
                print(f"  [+] Rol creado: {r.codigo}")
            else:
                print(f"  [=] Rol ya existe: {r_data['codigo']}")

        session.flush()

        # 2. Seed Usuarios
        print("Sedeando usuarios...")
        for u_data in USUARIOS_INICIALES:
            existing = session.exec(select(Usuario).where(Usuario.email == u_data["email"])).first()
            if not existing:
                u = Usuario(
                    nombre=u_data["nombre"],
                    apellido=u_data["apellido"],
                    email=u_data["email"],
                    password_hash=hash_password(u_data["password"]),
                )
                session.add(u)
                session.flush()  # para obtener u.id

                # Asignar roles
                for rol_codigo in u_data["roles"]:
                    ur = UsuarioRol(usuario_id=u.id, rol_codigo=rol_codigo)
                    session.add(ur)

                print(f"  [+] Usuario creado: {u.email} -> roles: {u_data['roles']}")
            else:
                print(f"  [=] Usuario ya existe: {u_data['email']}")

        # 3. Seed Unidades de Medida — ANTES que ingredientes (FK)
        print("Sedeando unidades de medida...")
        for u_data in UNIDADES_MEDIDA_INICIALES:
            existing = session.exec(select(UnidadMedida).where(UnidadMedida.nombre == u_data["nombre"])).first()
            if not existing:
                u = UnidadMedida(**u_data)
                session.add(u)
                print(f"  [+] Unidad de Medida creada: {u.nombre}")
            else:
                print(f"  [=] Unidad de Medida ya existe: {u_data['nombre']}")

        session.flush()

        # 4. Seed Ingredientes
        print("Sedeando ingredientes...")
        for i_data in INGREDIENTES_INICIALES:
            existing = session.exec(select(Ingrediente).where(Ingrediente.nombre == i_data["nombre"])).first()
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
                existing.unidad_medida_id = unidad_id
                existing.stock_actual = i_data["stock"]
                existing.precio_costo = i_data["precio"]
                session.add(existing)
                print(f"  [=] Ingrediente actualizado: {existing.nombre}")

        # 5. Seed Estados de Pedido
        print("Sedeando estados de pedido...")
        for e_data in ESTADOS_PEDIDO_INICIALES:
            existing = session.exec(select(EstadoPedido).where(EstadoPedido.codigo == e_data["codigo"])).first()
            if not existing:
                session.add(EstadoPedido(**e_data))
                print(f"  [+] Estado creado: {e_data['codigo']}")
            else:
                print(f"  [=] Estado ya existe: {e_data['codigo']}")

        # 6. Seed Formas de Pago
        print("Sedeando formas de pago...")
        for f_data in FORMAS_PAGO_INICIALES:
            existing = session.exec(select(FormaPago).where(FormaPago.codigo == f_data["codigo"])).first()
            if not existing:
                session.add(FormaPago(**f_data))
                print(f"  [+] Forma de pago creada: {f_data['codigo']}")
            else:
                print(f"  [=] Forma de pago ya existe: {f_data['codigo']}")

        session.commit()
    print("=== Seed completado exitosamente ===")


if __name__ == "__main__":
    run()
