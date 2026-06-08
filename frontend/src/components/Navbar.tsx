/** Navbar superior. */
import { Menu, LogOut } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useNavigate, Link } from "react-router-dom";
import { useUiStore } from "../store/uiStore";

export default function Navbar() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  const hasRole = useAuthStore((s) => s.hasRole);
  const isAdmin = hasRole("ADMIN");
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu size={24} className="text-green-dark" />
        </button>
        <h1 className="text-lg font-semibold text-green-dark hidden sm:block">
          Food Store
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {isAdmin && (
            <Link
              to="/"
              className="text-sm font-medium text-green-dark hover:text-green-main transition-colors mr-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 hidden md:block"
            >
              Home usuario
            </Link>
        )}
        <Link
          to="/mis-direcciones"
          className="text-sm text-gray-600 hover:text-green-main font-medium transition-colors"
        >
          Mis Direcciones
        </Link>
        <span className="text-sm text-gray-600 hidden sm:block">
          Hola, <strong className="text-green-dark">{usuario?.nombre || 'Usuario'}</strong>
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-danger hover:bg-danger-light rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
