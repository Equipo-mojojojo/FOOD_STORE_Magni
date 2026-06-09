/** Grilla de pedidos del cliente con badge de estado. */
import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { usePedidos } from "../../hooks/usePedidos";
import { usePedidosWebSocket, type PedidoWsMessage } from "../../hooks/usePedidosWebSocket";
import { useAuthStore } from "../../store/authStore";
import PedidoTimeline from "../../components/PedidoTimeline";
import type { PedidosFilters } from "../../types";

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  CONFIRMADO: "bg-blue-100 text-blue-800",
  EN_PREP: "bg-orange-100 text-orange-800",
  LISTO: "bg-emerald-100 text-emerald-800",
  EN_CAMINO: "bg-purple-100 text-purple-800",
  ENTREGADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

export const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  EN_PREP: "En preparación",
  LISTO: "Listo",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

interface Props {
  filters: PedidosFilters;
}

export default function MisPedidosGrid({ filters }: Props) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading } = usePedidos(filters);
  const { subscribeToOrder } = usePedidosWebSocket({
    enabled: isAuthenticated,
    onMessage: useCallback(
      (msg: PedidoWsMessage) => {
        if (msg.event !== "ERROR" && msg.event !== "SUBSCRIBED") {
          queryClient.invalidateQueries({ queryKey: ["pedidos"] });
        }
      },
      [queryClient],
    ),
  });

  useEffect(() => {
    data?.items
      .filter((pedido) => !["ENTREGADO", "CANCELADO"].includes(pedido.estado_codigo))
      .forEach((pedido) => subscribeToOrder(pedido.id));
  }, [data?.items, subscribeToOrder]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data?.items.length) {
    return <div className="text-center py-16 text-gray-500">No tenés pedidos todavía.</div>;
  }

  return (
    <div className="space-y-3">
      {data.items.map((pedido) => (
        <Link
          key={pedido.id}
          to={`/pedidos/${pedido.id}`}
          className="bg-white rounded-2xl p-5 shadow-sm block hover:shadow-md transition-shadow"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-bold text-gray-900">Pedido #{pedido.id}</span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  ESTADO_BADGE[pedido.estado_codigo] || "bg-gray-100 text-gray-800"
                }`}
              >
                {ESTADO_LABEL[pedido.estado_codigo] || pedido.estado_codigo}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {new Date(pedido.created_at).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}{" "}
              · {pedido.forma_pago_codigo}
            </p>
          </div>
          <p className="font-bold text-gray-900 text-lg">
            ${Number(pedido.total).toLocaleString("es-AR")}
          </p>
          <PedidoTimeline estado={pedido.estado_codigo} compact isRetiro={pedido.direccion_id === null} />
        </Link>
      ))}
    </div>
  );
}
