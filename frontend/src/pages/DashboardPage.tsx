import { Package, ShieldCheck, Tags, ShoppingBag, ClipboardList, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function DashboardPage() {
  const nombre = useAuthStore((s) => s.usuario?.nombre || 'Usuario');

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
      title: "Pedidos",
      description: "Gestión y seguimiento de pedidos con avance de estado",
      icon: ClipboardList,
      to: "/pedidos",
      color: "bg-purple-500",
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
    <div>
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-green-dark to-green-main rounded-2xl p-8 mb-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck size={28} />
          <h1 className="text-2xl font-bold">Bienvenido al Dashboard, {nombre}!</h1>
        </div>
        <p className="text-white/80 text-sm max-w-xl">
          Panel de administración del sistema Food Store. Gestiona ingredientes, productos y pedidos desde aquí.
        </p>
      </div>

      {/* Quick access cards */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Acceso rápido</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-main/30"
          >
            <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <card.icon size={24} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
            <p className="text-sm text-gray-500">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
