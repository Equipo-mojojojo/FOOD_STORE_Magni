"""Servicio de Pedidos — lógica de negocio y máquina de estados (FSM)."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException, status

from app.core.uow import UnitOfWork
from app.modules.pedidos.model import DetallePedido, HistorialEstadoPedido, Pedido
from app.modules.pedidos.schemas import (
    AvanzarEstadoRequest,
    PedidoCreate,
    PedidoDetail,
    PedidoResponse,
    PaginatedPedidos,
)
from app.modules.usuarios.model import Usuario


# Mapa de transiciones válidas. Si el estado no está → es terminal (RN-01)
FSM_TRANSITIONS: dict[str, list[str]] = {
    "PENDIENTE":  ["CONFIRMADO", "CANCELADO"],
    "CONFIRMADO": ["EN_PREP",    "CANCELADO"],
    "EN_PREP":    ["EN_CAMINO",  "CANCELADO"],
    "EN_CAMINO":  ["ENTREGADO"],
}

COSTO_ENVIO_DEFAULT = Decimal("50.00")


class PedidoService:

    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def crear_pedido(self, data: PedidoCreate, usuario: Usuario) -> PedidoResponse:
        """Crea un pedido desde el carrito con transacción atómica (Unit of Work)."""
        with self.uow:
            forma_pago = self.uow.formas_pago.get_by_codigo(data.forma_pago_codigo)
            if not forma_pago or not forma_pago.habilitado:
                raise HTTPException(status_code=400, detail=f"Forma de pago '{data.forma_pago_codigo}' no disponible")

            subtotal = Decimal("0.00")
            detalles_data = []

            for item in data.items:
                producto = self.uow.productos.get_by_id(item.producto_id)
                if not producto or producto.deleted_at is not None:
                    raise HTTPException(status_code=404, detail=f"Producto id={item.producto_id} no encontrado")
                if not producto.disponible:
                    raise HTTPException(status_code=400, detail=f"El producto '{producto.nombre}' no está disponible")

                precio_snap = producto.precio_base
                subtotal_item = precio_snap * Decimal(str(item.cantidad))
                subtotal += subtotal_item

                detalles_data.append({
                    "producto_id": item.producto_id,
                    "cantidad": item.cantidad,
                    "nombre_snapshot": producto.nombre,
                    "precio_snapshot": precio_snap,
                    "subtotal_snap": subtotal_item,
                    "personalizacion": item.personalizacion,
                })

            total = subtotal - Decimal("0.00") + COSTO_ENVIO_DEFAULT

            pedido = Pedido(
                usuario_id=usuario.id,
                estado_codigo="PENDIENTE",
                forma_pago_codigo=data.forma_pago_codigo,
                subtotal=subtotal,
                descuento=Decimal("0.00"),
                costo_envio=COSTO_ENVIO_DEFAULT,
                total=total,
                notas=data.notas,
            )
            pedido = self.uow.pedidos.add(pedido)

            for d in detalles_data:
                self.uow.detalles_pedido.add(DetallePedido(pedido_id=pedido.id, **d))

            # Primer registro del historial: estado_desde=NULL (RN-02)
            self.uow.historial_estados.add(HistorialEstadoPedido(
                pedido_id=pedido.id,
                estado_desde=None,
                estado_hacia="PENDIENTE",
                usuario_id=usuario.id,
                motivo="Pedido creado",
            ))

            return PedidoResponse.model_validate(pedido)

    def listar_pedidos(
        self,
        page: int,
        per_page: int,
        estado_codigo: Optional[str],
        usuario: Usuario,
    ) -> PaginatedPedidos:
        """CLIENT ve solo sus pedidos. ADMIN/PEDIDOS ven todos."""
        with self.uow:
            filtro_usuario = usuario.id if usuario.role == "CLIENT" else None
            result = self.uow.pedidos.get_paginated(
                page=page,
                per_page=per_page,
                usuario_id=filtro_usuario,
                estado_codigo=estado_codigo,
            )
        return PaginatedPedidos(**result)

    def obtener_detalle(self, pedido_id: int, usuario: Usuario) -> PedidoDetail:
        """CLIENT solo puede ver sus propios pedidos."""
        with self.uow:
            pedido = self.uow.pedidos.get_by_id_with_relations(pedido_id)
            if not pedido:
                raise HTTPException(status_code=404, detail=f"Pedido id={pedido_id} no encontrado")
            if usuario.role == "CLIENT" and pedido.usuario_id != usuario.id:
                raise HTTPException(status_code=403, detail="No tenés permiso para ver este pedido")
            return PedidoDetail.model_validate(pedido)

    def avanzar_estado(self, pedido_id: int, data: AvanzarEstadoRequest, usuario: Usuario) -> PedidoResponse:
        """Avanza el estado validando la FSM. La validación ocurre en el Service, nunca en el Router."""
        with self.uow:
            pedido = self.uow.pedidos.get_by_id_with_relations(pedido_id)
            if not pedido:
                raise HTTPException(status_code=404, detail=f"Pedido id={pedido_id} no encontrado")

            estado_actual = pedido.estado_codigo
            estado_destino = data.estado_hacia

            if usuario.role == "CLIENT":
                if pedido.usuario_id != usuario.id:
                    raise HTTPException(status_code=403, detail="No tenés permiso para modificar este pedido")
                if estado_destino != "CANCELADO":
                    raise HTTPException(status_code=403, detail="Solo podés cancelar tus pedidos")
                if estado_actual not in ("PENDIENTE", "CONFIRMADO"):
                    raise HTTPException(status_code=409, detail=f"No podés cancelar un pedido en estado '{estado_actual}'")

            # Validar transición en el mapa FSM (RN-01)
            transiciones_validas = FSM_TRANSITIONS.get(estado_actual, [])
            if estado_destino not in transiciones_validas:
                raise HTTPException(
                    status_code=409,
                    detail=f"Transición inválida: '{estado_actual}' → '{estado_destino}'. Válidas: {transiciones_validas}",
                )

            if not self.uow.estados_pedido.get_by_codigo(estado_destino):
                raise HTTPException(status_code=400, detail=f"Estado '{estado_destino}' no existe")

            pedido.estado_codigo = estado_destino
            pedido.updated_at = datetime.now(timezone.utc)
            self.uow.pedidos.update(pedido)

            # INSERT append-only en historial (RN-03)
            self.uow.historial_estados.add(HistorialEstadoPedido(
                pedido_id=pedido.id,
                estado_desde=estado_actual,
                estado_hacia=estado_destino,
                usuario_id=usuario.id,
                motivo=data.motivo,
            ))

            return PedidoResponse.model_validate(pedido)

    def cancelar_pedido(self, pedido_id: int, motivo: str, usuario: Usuario) -> PedidoResponse:
        """Atajo de cancelación para el cliente. Delega a avanzar_estado()."""
        return self.avanzar_estado(
            pedido_id,
            AvanzarEstadoRequest(estado_hacia="CANCELADO", motivo=motivo),
            usuario,
        )

    def listar_estados(self):
        with self.uow:
            return self.uow.estados_pedido.get_all_ordenados()

    def listar_formas_pago(self):
        with self.uow:
            return self.uow.formas_pago.get_habilitadas()