/** Grilla de gestión de pedidos — filtros, paginación y botones FSM. */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { usePedidos, useAvanzarEstado, useFormasPago } from "../../hooks/usePedidos";
import { useAuthStore } from "../../store/authStore";
import Pagination from "../../components/Pagination";
import type { PedidoResponse, PedidosFilters } from "../../types";

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  CONFIRMADO: "bg-blue-100 text-blue-800",
  EN_PREP: "bg-orange-100 text-orange-800",
  EN_CAMINO: "bg-purple-100 text-purple-800",
  ENTREGADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

export const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  EN_PREP: "En preparación",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const FSM: Record<string, string[]> = {
  PENDIENTE: ["CONFIRMADO", "CANCELADO"],
  CONFIRMADO: ["EN_PREP", "CANCELADO"],
  EN_PREP: ["EN_CAMINO", "CANCELADO"],
  EN_CAMINO: ["ENTREGADO"],
};

function AccionButtons({ pedido }: { pedido: PedidoResponse }) {
  const avanzar = useAvanzarEstado();
  const siguientes = FSM[pedido.estado_codigo] ?? [];

  if (siguientes.length === 0) return <span className="text-xs text-gray-400">—</span>;

  return (
    <div className="flex gap-2 flex-wrap">
      {siguientes.map((estado) => (
        <button
          key={estado}
          disabled={avanzar.isPending}
          onClick={() =>
            avanzar.mutate({
              id: pedido.id,
              data: {
                estado_hacia: estado,
                motivo: estado === "CANCELADO" ? "Cancelado por operador" : undefined,
              },
            })
          }
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
            estado === "CANCELADO"
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          → {ESTADO_LABEL[estado] ?? estado}
        </button>
      ))}
    </div>
  );
}

export default function PedidosAdminGrid() {
  const [filters, setFilters] = useState<PedidosFilters>({
    page: 1,
    per_page: 10,
  });
  const [idInput, setIdInput] = useState("");

  const isAdmin = useAuthStore((s) => s.hasRole("ADMIN"));
  const { data, isLoading } = usePedidos(filters);
  const { data: formasPago } = useFormasPago();

  const handleFilter = (key: keyof PedidosFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value || undefined, page: 1 }));
  };

  const applyId = () => {
    setFilters((f) => ({ ...f, id: idInput.trim() || undefined, page: 1 }));
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-dark">Gestión de Pedidos</h1>
        <p className="text-sm text-gray-500 mt-1">Administrá y avanzá el estado de los pedidos.</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 items-end">
          {/* ID */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              min={1}
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyId()}
              onBlur={applyId}
              placeholder="Buscar por ID..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none"
            />
          </div>

          {/* Estado */}
          <select
            value={filters.estado || ""}
            onChange={(e) => handleFilter("estado", e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none bg-white"
          >
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* Forma de pago */}
          <select
            value={filters.forma_pago || ""}
            onChange={(e) => handleFilter("forma_pago", e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none bg-white"
          >
            <option value="">Todos los pagos</option>
            {formasPago?.map((fp) => (
              <option key={fp.codigo} value={fp.codigo}>{fp.descripcion}</option>
            ))}
          </select>

          {/* Fecha desde */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Desde</span>
            <input
              type="date"
              value={filters.fecha_desde || ""}
              onChange={(e) => handleFilter("fecha_desde", e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none"
            />
          </div>

          {/* Fecha hasta */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Hasta</span>
            <input
              type="date"
              value={filters.fecha_hasta || ""}
              onChange={(e) => handleFilter("fecha_hasta", e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-main focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-main border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.items.length ? (
          <div className="text-center py-16 text-gray-500">No hay pedidos con esos filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Usuario</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Pago</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.items.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-500">#{pedido.id}</td>
                    <td className="px-4 py-3 text-gray-600">#{pedido.usuario_id}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(pedido.created_at).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{pedido.forma_pago_codigo}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          ESTADO_BADGE[pedido.estado_codigo] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ESTADO_LABEL[pedido.estado_codigo] ?? pedido.estado_codigo}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      ${Number(pedido.total).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isAdmin && <AccionButtons pedido={pedido} />}
                        <Link
                          to={`/pedidos/${pedido.id}`}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          Ver detalle
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {data && (
        <Pagination
          page={data.page}
          pages={data.pages}
          total={data.total}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      )}
    </div>
  );
}
