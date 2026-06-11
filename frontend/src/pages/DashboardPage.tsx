import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag, Package, ClipboardList, ChefHat,
  Users, Layers, TrendingUp, Clock, XCircle, CheckCircle2,
  AlertTriangle, ArrowRight, Trophy,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { usePedidos } from "../hooks/usePedidos";
import { useProductos } from "../hooks/useProductos";
import { useIngredientes } from "../hooks/useIngredientes";
import { useUsuarios } from "../hooks/useUsuarios";

const HOY     = new Date().toISOString().split("T")[0];
const HACE_30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
const BASE    = {
  search: "", estado: "", sort_by: "", sort_order: "",
  created_from: "", created_to: "", updated_from: "", updated_to: "", starts_with: "",
};

const GREEN  = "#2d6a4f";
const GREEN2 = "#52b788";
const RED    = "#ef4444";
const AMBER  = "#f59e0b";
const BLUE   = "#3b82f6";
const COLORS = [GREEN, GREEN2, BLUE, AMBER, "#8b5cf6", "#ec4899"];

// ─── Donut SVG ────────────────────────────────────────────────────────────────
function DonutSVG({ data, total }: { data: { name: string; value: number; color: string }[]; total: number }) {
  if (!total) return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <CheckCircle2 size={40} className="mb-3 text-gray-300" />
      <p className="text-sm">Sin pedidos hoy</p>
    </div>
  );

  const R = 80, r = 52, cx = 110, cy = 110;
  let angle = -Math.PI / 2;

  const slices = data.map((d) => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle);
    const x2 = cx + R * Math.cos(angle + sweep), y2 = cy + R * Math.sin(angle + sweep);
    const ix1 = cx + r * Math.cos(angle), iy1 = cy + r * Math.sin(angle);
    const ix2 = cx + r * Math.cos(angle + sweep), iy2 = cy + r * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} L${ix2.toFixed(1)},${iy2.toFixed(1)} A${r},${r} 0 ${large} 0 ${ix1.toFixed(1)},${iy1.toFixed(1)} Z`;
    angle += sweep;
    return { ...d, path };
  });

  return (
    <div className="flex flex-col items-center gap-6">
      <svg viewBox="0 0 220 220" style={{ width: 220, height: 220 }}>
        {slices.map((s) => <path key={s.name} d={s.path} fill={s.color} />)}
        <text x={cx} y={cy - 10} textAnchor="middle" fontSize="28" fontWeight="700" fill="#111827">{total}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="12" fill="#9ca3af">pedidos hoy</text>
      </svg>
      <div className="w-full space-y-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-sm text-gray-600">{d.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(d.value / total) * 100}%`, background: d.color }} />
              </div>
              <span className="text-sm font-bold text-gray-900 w-6 text-right">{d.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Barras por estado SVG ────────────────────────────────────────────────────
function BarChartSVG({ data }: { data: { estado: string; cantidad: number; color: string }[] }) {
  const W = 600, H = 220, PAD = { top: 20, right: 20, bottom: 36, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map((d) => d.cantidad), 1);
  const barW   = (innerW / data.length) * 0.5;
  const gap    = innerW / data.length;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {yTicks.map((t) => {
        const y = PAD.top + innerH - t * innerH;
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="11" fill="#9ca3af">
              {Math.round(maxVal * t)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const barH = Math.max((d.cantidad / maxVal) * innerH, d.cantidad > 0 ? 4 : 0);
        const x    = PAD.left + i * gap + (gap - barW) / 2;
        const y    = PAD.top + innerH - barH;
        return (
          <g key={d.estado}>
            <rect x={x} y={y} width={barW} height={barH} fill={d.color} rx="6" opacity={d.cantidad === 0 ? 0.25 : 1} />
            {d.cantidad > 0 && (
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill={d.color}>
                {d.cantidad}
              </text>
            )}
            <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#6b7280">
              {d.estado}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Productos más vendidos SVG ───────────────────────────────────────────────
function ProductosVendidosSVG({ data }: { data: { nombre: string; vendidos: number; color: string }[] }) {
  if (!data.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <ShoppingBag size={40} className="mb-3 text-gray-300" />
      <p className="text-sm">Sin ventas este mes</p>
    </div>
  );

  const maxVal = Math.max(...data.map((d) => d.vendidos), 1);

  return (
    <div className="space-y-4">
      {data.map((d, i) => (
        <div key={d.nombre} className="flex items-center gap-3">
          <span className="w-6 text-xs font-bold text-gray-400 text-right flex-shrink-0">#{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-800 truncate">{d.nombre}</p>
              <span className="text-sm font-bold ml-2 flex-shrink-0" style={{ color: d.color }}>
                {d.vendidos} ud.
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(d.vendidos / maxVal) * 100}%`, background: d.color }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const nombre = useAuthStore((s) => s.usuario?.nombre ?? "Administrador");

  const { data: pedidosHoy }        = usePedidos({ page: 1, per_page: 100, fecha_desde: HOY, fecha_hasta: HOY });
  const { data: pedidosMes }        = usePedidos({ page: 1, per_page: 100, fecha_desde: HACE_30, fecha_hasta: HOY });
  const { data: pendientes }        = usePedidos({ page: 1, per_page: 100, estado: "PENDIENTE" });
  const { data: enPrep }            = usePedidos({ page: 1, per_page: 100, estado: "EN_PREP" });
  const { data: listos }            = usePedidos({ page: 1, per_page: 100, estado: "LISTO" });
  const { data: entregadosHoyData } = usePedidos({ page: 1, per_page: 100, estado: "ENTREGADO", fecha_desde: HOY, fecha_hasta: HOY });
  const { data: canceladosHoyData } = usePedidos({ page: 1, per_page: 100, estado: "CANCELADO", fecha_desde: HOY, fecha_hasta: HOY });

  const { data: productos }    = useProductos({ ...BASE, page: 1, per_page: 100, disponible: "true" });
  const { data: ingredientes } = useIngredientes({ ...BASE, page: 1, per_page: 100, es_alergeno: "" });
  const { data: usuarios }     = useUsuarios({ page: 1, per_page: 1, search: "", rol: "", estado: "activo" });

  const totalHoy      = pedidosHoy?.total ?? 0;
  const canceladosHoy = canceladosHoyData?.total ?? 0;
  const entregadosHoy = entregadosHoyData?.total ?? 0;
  const activosAhora  = (pendientes?.total ?? 0) + (enPrep?.total ?? 0) + (listos?.total ?? 0);

  const ingresoHoy = useMemo(() =>
    pedidosHoy?.items.filter((p) => p.estado_codigo !== "CANCELADO")
      .reduce((a, p) => a + Number(p.total), 0) ?? 0,
  [pedidosHoy]);

  const ingresoMes = useMemo(() =>
    pedidosMes?.items.filter((p) => p.estado_codigo !== "CANCELADO")
      .reduce((a, p) => a + Number(p.total), 0) ?? 0,
  [pedidosMes]);

  const stockBajo = useMemo(() =>
    ingredientes?.items.filter((i) => Number(i.stock_actual) < 5) ?? [],
  [ingredientes]);

  // Productos más vendidos este mes
  const productosDestacados = useMemo(() => {
  return (productos?.items ?? [])
    .slice(0, 6)
    .map((p, i) => ({
      nombre: p.nombre,
      vendidos: p.stock_disponible ?? p.stock_cantidad ?? 0,
      color: COLORS[i % COLORS.length],
    }));
}, [productos]);

  const pieData = [
    { name: "Entregados", value: entregadosHoy, color: GREEN  },
    { name: "Activos",    value: activosAhora,  color: AMBER  },
    { name: "Cancelados", value: canceladosHoy, color: RED    },
  ].filter((d) => d.value > 0);

  const pedidosPorEstado = [
    { estado: "Pendiente",  cantidad: pendientes?.total  ?? 0, color: AMBER  },
    { estado: "En prep",    cantidad: enPrep?.total      ?? 0, color: BLUE   },
    { estado: "Listos",     cantidad: listos?.total      ?? 0, color: GREEN2 },
    { estado: "Entregados", cantidad: entregadosHoy,           color: GREEN  },
    { estado: "Cancelados", cantidad: canceladosHoy,           color: RED    },
  ];

  const stats = [
    { label: "Pedidos hoy",     value: totalHoy,   icon: ClipboardList, color: "bg-blue-500",   light: "bg-blue-50 text-blue-700",    sub: `${canceladosHoy} cancelado${canceladosHoy !== 1 ? "s" : ""}` },
    { label: "Ingresos hoy",    value: `$${ingresoHoy.toLocaleString("es-AR")}`, icon: TrendingUp, color: "bg-green-main", light: "bg-green-50 text-green-dark", sub: `$${ingresoMes.toLocaleString("es-AR")} este mes` },
    { label: "Pedidos activos", value: activosAhora, icon: Clock,        color: "bg-orange-500", light: "bg-orange-50 text-orange-700", sub: `${listos?.total ?? 0} listo${(listos?.total ?? 0) !== 1 ? "s" : ""} para entregar` },
    { label: "Stock bajo",      value: stockBajo.length, icon: AlertTriangle, color: stockBajo.length > 0 ? "bg-red-500" : "bg-gray-400", light: stockBajo.length > 0 ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-500", sub: stockBajo.length > 0 ? "Ingredientes críticos" : "Todo en orden" },
  ];

  const accesos = [
    { to: "/productos",    label: "Productos",    icon: ShoppingBag,   color: "bg-orange-500",  desc: "Catálogo y precios" },
    { to: "/categorias",   label: "Categorías",   icon: Layers,        color: "bg-blue-500",    desc: "Estructura del menú" },
    { to: "/ingredientes", label: "Ingredientes", icon: Package,       color: "bg-green-main",  desc: "Materias primas" },
    { to: "/pedidos",      label: "Cajero",       icon: ClipboardList, color: "bg-purple-500",  desc: "Gestión de pedidos" },
    { to: "/cocina",       label: "Cocina",       icon: ChefHat,       color: "bg-emerald-500", desc: "KDS y preparación" },
    { to: "/usuarios",     label: "Usuarios",     icon: Users,         color: "bg-teal-500",    desc: "Roles y cuentas" },
  ];
  const navigate = useNavigate(); 

  return (
    <div className="space-y-6">

      {/* Banner */}
      <div className="bg-gradient-to-r from-green-dark to-green-main rounded-2xl p-7 text-white shadow-lg">
        <p className="text-white/70 text-sm font-medium mb-1">
          {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-2xl font-bold mb-1">Bienvenido, {nombre} 👋</h1>
        <p className="text-white/80 text-sm">
          {activosAhora > 0
            ? `Hay ${activosAhora} pedido${activosAhora !== 1 ? "s" : ""} activo${activosAhora !== 1 ? "s" : ""} ahora mismo.`
            : "No hay pedidos activos en este momento."}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
            <div className={`${s.color} p-3 rounded-xl flex-shrink-0`}>
              <s.icon size={22} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.value}</p>
              <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${s.light}`}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Donut + Productos más vendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-1">Pedidos hoy</h2>
          <p className="text-xs text-gray-400 mb-5">Distribución por estado</p>
          <DonutSVG data={pieData} total={totalHoy} />
        </div>

        {/* Productos más vendidos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" /> Productos activos
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Stock disponible actual</p>
            </div>
            <Link to="/productos" className="text-xs text-green-main font-semibold hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <ProductosVendidosSVG data={productosDestacados} />
        </div>
      </div>

      {/* Barras por estado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900">Estado de pedidos</h2>
              <p className="text-xs text-gray-400 mt-0.5">Cantidad actual por estado</p>
            </div>
            <Link to="/pedidos" className="text-xs text-green-main font-semibold hover:underline flex items-center gap-1">
              Gestionar <ArrowRight size={12} />
            </Link>
          </div>
          <BarChartSVG data={pedidosPorEstado} />
        </div>

        {/* Panel derecho */}
        <div className="space-y-4">
          {/* Stock bajo */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-400" /> Stock bajo
              </h2>
              <Link to="/ingredientes" className="text-xs text-green-main font-semibold hover:underline">Ver todo</Link>
            </div>
            {stockBajo.length === 0 ? (
              <div className="px-5 py-6 text-center text-gray-400">
                <CheckCircle2 size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs">Todo el stock en orden</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {stockBajo.slice(0, 5).map((i) => (
                  <div key={i.id} className="px-5 py-3 flex items-center justify-between">
                    <p className="text-sm text-gray-700 truncate">{i.nombre}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                      Number(i.stock_actual) === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {Number(i.stock_actual) === 0 ? "Sin stock" : `${i.stock_actual} u.`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="font-bold text-gray-900 text-sm">Resumen general</h2>
            {[
              { label: "Productos activos", value: productos?.total  ?? "—", icon: ShoppingBag,  color: "text-orange-500" },
              { label: "Usuarios activos",  value: usuarios?.total   ?? "—", icon: Users,        color: "text-teal-500"   },
              { label: "Pedidos este mes",  value: pedidosMes?.total ?? "—", icon: TrendingUp,   color: "text-green-main" },
              { label: "Cancelados hoy",    value: canceladosHoy,            icon: XCircle,      color: "text-red-400"    },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <r.icon size={14} className={r.color} /> {r.label}
                </div>
                <span className="font-bold text-gray-900">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Acceso rápido */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Acceso rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {accesos.map((a) => (
            <button
              key={a.to}
              onClick={() => navigate(a.to)}
              className="group bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-green-main/30 transition-all text-center w-full"
            >
              <div className={`${a.color} w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                <a.icon size={20} className="text-white" />
              </div>
              <p className="text-xs font-semibold text-gray-800">{a.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{a.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}