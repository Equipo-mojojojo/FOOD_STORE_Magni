/** Página Home / Dashboard. */
import { Package, PackageX, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function HomePage() {
  const nombre = useAuthStore((s) => s.nombre);

  const cards = [
    {
      title: "Insumos Activos",
      description: "Gestion y busqueda de ingredientes activos del sistema",
      icon: Package,
      to: "/ingredientes",
      color: "bg-green-main",
    },
    {
      title: "Insumos Dados de Baja",
      description: "Ingredientes eliminados. Posibilidad de reactivarlos.",
      icon: PackageX,
      to: "/ingredientes/dados-de-baja",
      color: "bg-danger",
    },
  ];

  return (
    <div>
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-green-dark to-green-main rounded-2xl p-8 mb-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck size={28} />
          <h1 className="text-2xl font-bold">Bienvenido, {nombre}!</h1>
        </div>
        <p className="text-white/80 text-sm max-w-xl">
          Panel de administracion del sistema Food Store. Gestiona ingredientes, productos y pedidos desde aqui.
        </p>
      </div>

      {/* Quick access cards */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Acceso rapido</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
