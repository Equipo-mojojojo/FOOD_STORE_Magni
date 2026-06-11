from datetime import datetime, timedelta, timezone
from sqlalchemy import func, cast, Date, desc

from app.core.uow import UnitOfWork
from app.modules.pedidos.model import Pedido, DetallePedido
from app.modules.estadisticas.schemas import (
    DashboardEstadisticas,
    KPI,
    VentasPorDia,
    ProductoMasVendido,
    PedidosPorEstado
)

class EstadisticasService:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def obtener_dashboard(self) -> DashboardEstadisticas:
        with self.uow:
            session = self.uow.session
            now = datetime.now(timezone.utc)
            inicio_mes = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            hace_30_dias = now - timedelta(days=30)
            
            # 1. KPIs del mes
            kpi_query = session.query(
                func.sum(Pedido.total).label("ventas"),
                func.count(Pedido.id).label("pedidos")
            ).filter(
                Pedido.estado_codigo != "CANCELADO",
                Pedido.created_at >= inicio_mes
            ).first()
            
            ventas_mes = float(kpi_query.ventas or 0)
            pedidos_mes = int(kpi_query.pedidos or 0)
            ticket_promedio = ventas_mes / pedidos_mes if pedidos_mes > 0 else 0
            
            kpis = KPI(
                ventas_mes=ventas_mes,
                pedidos_mes=pedidos_mes,
                ticket_promedio=ticket_promedio
            )
            
            # 2. Pedidos por día y turno (últimos 30 días)
            pedidos_recientes = session.query(Pedido.created_at).filter(
                Pedido.estado_codigo != "CANCELADO",
                Pedido.created_at >= hace_30_dias
            ).order_by(Pedido.created_at).all()
            
            # Agrupar en un diccionario por fecha (string YYYY-MM-DD)
            agrupado_por_fecha = {}
            for (dt,) in pedidos_recientes:
                fecha_str = dt.strftime("%Y-%m-%d")
                if fecha_str not in agrupado_por_fecha:
                    agrupado_por_fecha[fecha_str] = {"manana": 0, "mediodia": 0, "tarde": 0, "noche": 0}
                
                # Calcular turno según la hora del pedido
                hora = dt.hour
                if 6 <= hora < 12:
                    turno = "manana"
                elif 12 <= hora < 16:
                    turno = "mediodia"
                elif 16 <= hora < 20:
                    turno = "tarde"
                else:
                    turno = "noche"
                    
                agrupado_por_fecha[fecha_str][turno] += 1
                
            ventas_por_dia = [
                VentasPorDia(
                    fecha=fecha,
                    manana=counts["manana"],
                    mediodia=counts["mediodia"],
                    tarde=counts["tarde"],
                    noche=counts["noche"]
                )
                for fecha, counts in agrupado_por_fecha.items()
            ]
            
            # 3. Productos más vendidos
            top_productos_query = session.query(
                DetallePedido.producto_id,
                DetallePedido.nombre_snapshot,
                func.sum(DetallePedido.cantidad).label("cantidad")
            ).join(Pedido).filter(
                Pedido.estado_codigo != "CANCELADO"
            ).group_by(
                DetallePedido.producto_id,
                DetallePedido.nombre_snapshot
            ).order_by(
                desc("cantidad")
            ).limit(5).all()
            
            productos_mas_vendidos = [
                ProductoMasVendido(
                    producto_id=row.producto_id,
                    nombre=row.nombre_snapshot,
                    cantidad=int(row.cantidad)
                ) for row in top_productos_query
            ]
            
            # 4. Pedidos por estado
            pedidos_por_estado_query = session.query(
                Pedido.estado_codigo,
                func.count(Pedido.id).label("cantidad")
            ).group_by(
                Pedido.estado_codigo
            ).all()
            
            pedidos_por_estado = [
                PedidosPorEstado(
                    estado=row.estado_codigo,
                    cantidad=int(row.cantidad)
                ) for row in pedidos_por_estado_query
            ]
            
            return DashboardEstadisticas(
                kpis=kpis,
                ventas_por_dia=ventas_por_dia,
                productos_mas_vendidos=productos_mas_vendidos,
                pedidos_por_estado=pedidos_por_estado
            )
