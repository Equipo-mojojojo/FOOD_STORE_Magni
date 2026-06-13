
import React, { useState } from "react";

import { ChefHat, Package, ShieldCheck, Tags, ShoppingBag, ClipboardList, Users, X, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";

import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useDashboardEstadisticas } from "../hooks/useEstadisticas";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  'PENDIENTE': '#f59e0b', // Naranja/Ambar
  'EN_PREPARACION': '#3b82f6', // Azul
  'EN_CAMINO': '#8b5cf6', // Violeta
  'ENTREGADO': '#10b981', // Verde
  'CANCELADO': '#ef4444', // Rojo
};

export default function DashboardPage() {
  const [showBanner, setShowBanner] = useState(true);
  const [diasFiltro, setDiasFiltro] = useState<1 | 7 | 30>(30);
  const nombre = useAuthStore((s) => s.usuario?.nombre || 'Usuario');
  const { data: stats, isLoading } = useDashboardEstadisticas();

  // Pre-procesar datos del gráfico para rellenar con ceros si no hay datos
  const chartData = React.useMemo(() => {
    if (!stats) return [];
    
    const limite = new Date();
    limite.setHours(0,0,0,0);
    if (diasFiltro === 1) {
      limite.setDate(limite.getDate()); 
    } else {
      limite.setDate(limite.getDate() - diasFiltro + 1);
    }

    const filtrados = stats.ventas_por_dia.filter(v => {
      const vDate = new Date(v.fecha);
      vDate.setHours(0,0,0,0);
      vDate.setMinutes(vDate.getMinutes() + vDate.getTimezoneOffset());
      return vDate.getTime() >= limite.getTime();
    });

    // Si es "Hoy" y no hubo ventas, agregar un registro vacío para que el gráfico no desaparezca
    if (diasFiltro === 1 && filtrados.length === 0) {
      const hoy = new Date();
      // Formato YYYY-MM-DD
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, '0');
      const day = String(hoy.getDate()).padStart(2, '0');
      filtrados.push({
        fecha: `${year}-${month}-${day}`,
        manana: 0,
        mediodia: 0,
        tarde: 0,
        noche: 0
      });
    }

    return filtrados;
  }, [stats, diasFiltro]);

  const cards = [
    {
      title: "Productos",
      description: "Gestión de catálogo, precios y stock de productos finales",
      icon: ShoppingBag,
      to: "/productos",
      color: "bg-orange-500",
    },
    {
      title: "Categorías",
      description: "Organización jerárquica del menú y agrupación de productos",
      icon: Tags,
      to: "/categorias",
      color: "bg-blue-500",
    },
    {
      title: "Ingrediente",
      description: "Administración de ingredientes y materias primas del sistema",
      icon: Package,
      to: "/ingredientes",
      color: "bg-green-main",
    },
    {
      title: "Cajero",
      description: "Confirmacion y cierre operativo de pedidos",
      icon: ClipboardList,
      to: "/pedidos",
      color: "bg-purple-500",
    },
    {
      title: "Cocina",
      description: "Preparacion de pedidos confirmados y control de cocina",
      icon: ChefHat,
      to: "/cocina",
      color: "bg-emerald-500",
    },
    {
      title: "Usuarios",
      description: "Administración de usuarios, roles y detalles de cuentas",
      icon: Users,
      to: "/usuarios",
      color: "bg-teal-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      {showBanner && (
        <div className="bg-gradient-to-r from-green-dark to-green-main rounded-xl p-6 text-white shadow-md relative">
          <button 
            onClick={() => setShowBanner(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={24} />
            <h1 className="text-xl font-bold">Bienvenido al Dashboard, {nombre}!</h1>
          </div>
          <p className="text-white/90 text-sm max-w-xl">
            Panel de administración del sistema Food Store. Gestiona ingredientes, productos y pedidos desde aquí.
          </p>
        </div>
      )}

      {/* Quick access cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-main/30 flex flex-col items-center text-center"
          >
            <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
              <card.icon size={20} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">{card.title}</h3>
          </Link>
        ))}
      </div>

      {isLoading || !stats ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-main"></div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-green-50 rounded-full text-green-main">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Ventas del Mes</p>
                <p className="text-2xl font-bold text-gray-900">${stats.kpis.ventas_mes.toLocaleString('es-AR')}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-blue-50 rounded-full text-blue-500">
                <ShoppingCart size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Pedidos del Mes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.kpis.pedidos_mes}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-orange-50 rounded-full text-orange-500">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Ticket Promedio</p>
                <p className="text-2xl font-bold text-gray-900">${stats.kpis.ticket_promedio.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ventas Area Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-lg font-bold text-gray-800">Evolución de Pedidos por Turno</h2>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setDiasFiltro(1)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${diasFiltro === 1 ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => setDiasFiltro(7)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${diasFiltro === 7 ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    7 Días
                  </button>
                  <button
                    onClick={() => setDiasFiltro(30)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${diasFiltro === 30 ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    30 Días
                  </button>
                </div>
              </div>
              <div className="h-72 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData} 
                    margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="fecha" 
                      tickFormatter={(val) => {
                        const date = new Date(val);
                        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
                      }}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      labelFormatter={(label) => new Date(label).toLocaleDateString('es-AR')}
                      contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f3f4f6' }}
                    />
                    <Bar dataKey="manana" name="Mañana" fill="#fcd34d" stackId="turnos" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="mediodia" name="Mediodía" fill="#fb923c" stackId="turnos" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="tarde" name="Tarde" fill="#f43f5e" stackId="turnos" radius={[0, 0, 0, 0]} />
                    {/* El último del stack (noche) lleva el borde redondeado arriba */}
                    <Bar dataKey="noche" name="Noche" fill="#6366f1" stackId="turnos" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pedidos por Estado */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Pedidos por Estado</h2>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pedidos_por_estado}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="cantidad"
                      nameKey="estado"
                    >
                      {stats.pedidos_por_estado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.estado] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, 'Pedidos']}
                      contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {stats.pedidos_por_estado.map((entry) => (
                  <div key={entry.estado} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.estado] || '#6b7280' }}></span>
                    {entry.estado} ({entry.cantidad})
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Productos */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Productos Más Vendidos (Top 5)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.productos_mas_vendidos} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis 
                    dataKey="nombre" 
                    type="category" 
                    tick={{ fontSize: 12, fill: '#374151' }} 
                    axisLine={false} 
                    tickLine={false} 
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Unidades vendidas']}
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="cantidad" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
