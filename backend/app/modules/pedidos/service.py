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
            productos_a_decrementar = []

            for item in data.items:
                producto = self.uow.productos.get_by_id_with_relations(item.producto_id)
                if not producto or producto.deleted_at is not None:
                    raise HTTPException(status_code=404, detail=f"Producto id={item.producto_id} no encontrado")
                if not producto.disponible:
                    raise HTTPException(status_code=400, detail=f"El producto '{producto.nombre}' no está disponible")
                
                es_elaborable = len(producto.ingredientes) > 0
                
                if es_elaborable:
                    unidades_posibles = []
                    for pi in producto.ingredientes:
                        if pi.ingrediente:
                            f_ing = float(pi.ingrediente.unidad_medida.factor_conversion) if pi.ingrediente.unidad_medida else 1.0
                            f_receta = float(pi.unidad_medida.factor_conversion) if pi.unidad_medida else 1.0
                            qty_base = pi.cantidad * Decimal(str(f_receta))
                            if qty_base > 0:
                                stock_base = pi.ingrediente.stock_actual * Decimal(str(f_ing))
                                unidades = stock_base / qty_base
                                unidades_posibles.append(float(unidades))
                    
                    stock_disponible = int(min(unidades_posibles)) if unidades_posibles else 0
                    if stock_disponible < item.cantidad:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Stock de ingredientes insuficiente para '{producto.nombre}'. Posible: {stock_disponible}, solicitado: {item.cantidad}"
                        )
                else:
                    if producto.stock_cantidad < item.cantidad:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Stock insuficiente para '{producto.nombre}'. Disponible: {producto.stock_cantidad}, solicitado: {item.cantidad}",
                        )

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
                productos_a_decrementar.append((producto, item.cantidad, es_elaborable))

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

            # Decrementar stock de cada producto incluido en el pedido
            for producto, cantidad, es_elaborable in productos_a_decrementar:
                if es_elaborable:
                    for pi in producto.ingredientes:
                        if pi.ingrediente:
                            f_ing = float(pi.ingrediente.unidad_medida.factor_conversion) if pi.ingrediente.unidad_medida else 1.0
                            f_receta = float(pi.unidad_medida.factor_conversion) if pi.unidad_medida else 1.0
                            qty_base_total = pi.cantidad * Decimal(str(f_receta)) * Decimal(str(cantidad))
                            deduccion = qty_base_total / Decimal(str(f_ing))
                            pi.ingrediente.stock_actual -= deduccion
                            self.uow.ingredientes.update(pi.ingrediente)
                else:
                    producto.stock_cantidad -= cantidad
                    self.uow.productos.update(producto)

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
        pedido_id: Optional[int] = None,
        fecha_desde: Optional[str] = None,
        fecha_hasta: Optional[str] = None,
        forma_pago_codigo: Optional[str] = None,
    ) -> PaginatedPedidos:
        """CLIENT ve solo sus pedidos. ADMIN/PEDIDOS ven todos."""
        with self.uow:
            filtro_usuario = usuario.id if usuario.role == "CLIENT" else None
            result = self.uow.pedidos.get_paginated(
                page=page,
                per_page=per_page,
                usuario_id=filtro_usuario,
                estado_codigo=estado_codigo,
                pedido_id=pedido_id,
                fecha_desde=fecha_desde,
                fecha_hasta=fecha_hasta,
                forma_pago_codigo=forma_pago_codigo,
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

            # Si se cancela, devolver el stock de cada ítem al inventario
            if estado_destino == "CANCELADO":
                for detalle in pedido.detalles:
                    producto = self.uow.productos.get_by_id_with_relations(detalle.producto_id)
                    if producto:
                        es_elaborable = len(producto.ingredientes) > 0
                        if not es_elaborable:
                            # Solo reponemos stock si es un producto finalizado
                            # Por regla de negocio: no se puede "des-cocinar" una pizza elaborada
                            producto.stock_cantidad += detalle.cantidad
                            self.uow.productos.update(producto)

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