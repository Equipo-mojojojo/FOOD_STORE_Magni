/** Sidebar de navegación. */
import { NavLink } from "react-router-dom";
import { Home, Package, X, Layers, ShoppingBag, ClipboardList, Users } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const links = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/productos", label: "Productos", icon: ShoppingBag },
  { to: "/categorias", label: "Categorías", icon: Layers },
  { to: "/ingredientes", label: "Ingrediente", icon: Package },
  { to: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/usuarios", label: "Usuarios", icon: Users },
];

export default function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-green-dark text-white
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-0
        `}
      >
        {/* Header del sidebar */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-xl font-bold tracking-tight">
            Food Store
          </h2>
          <button onClick={onClose} className="lg:hidden hover:text-yellow-banner transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Links de navegación */}
        <nav className="mt-4 flex flex-col gap-1 px-3">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? "bg-white/15 text-yellow-banner shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
