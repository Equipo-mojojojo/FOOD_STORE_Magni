/** Navbar superior. */
import { Menu, LogOut } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

interface Props {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: Props) {
  const { nombre, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu size={24} className="text-green-dark" />
        </button>
        <h1 className="text-lg font-semibold text-green-dark hidden sm:block">
          Food Store
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 hidden sm:block">
          Hola, <strong className="text-green-dark">{nombre}</strong>
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
