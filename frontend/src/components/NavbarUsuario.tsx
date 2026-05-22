import { Outlet, Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, ShoppingBag } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import NavbarCategoriesMenu from "./NavbarCategoriesMenu";

export default function NavbarUsuario() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Navbar Pública */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo y Enlaces */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-2xl">🍔</span>
                <span className="text-xl font-bold text-green-dark">Food Store</span>
              </Link>
              
              <div className="hidden md:flex space-x-6">
                <Link to="/" className="text-gray-600 hover:text-green-main flex items-center gap-2 font-medium transition-colors">
                  <ShoppingBag size={18} />
                  Productos
                </Link>
                
                {/* Menú Desplegable de Categorías */}
                <NavbarCategoriesMenu />
              </div>
            </div>

            {/* Acciones (Carrito y Usuario) */}
            <div className="flex items-center gap-4 md:gap-6">
              <button className="relative p-2 text-gray-600 hover:text-green-main transition-colors">
                <ShoppingCart size={24} />
                <span className="absolute top-0 right-0 bg-yellow-banner text-green-dark text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">
                  0
                </span>
              </button>

              <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 hidden md:block">
                    Hola, {usuario?.nombre}
                  </span>
                  {/* Link al dashboard si es admin */}
                  {usuario?.roles?.some((r: any) => r === 'ADMIN' || r?.rol_codigo === 'ADMIN') && (
                    <Link to="/dashboard" className="text-sm bg-green-main text-white px-3 py-1.5 rounded-lg hover:bg-green-dark transition-colors">
                      Dashboard
                    </Link>
                  )}
                  <button onClick={handleLogout} className="text-sm text-danger-main hover:text-danger-dark font-medium transition-colors">
                    Salir
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-gray-600 hover:text-green-main font-medium text-sm transition-colors hidden md:block">
                    Ingresar
                  </Link>
                  <Link to="/register" className="bg-green-main text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-dark transition-colors shadow-sm">
                    Crear Cuenta
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal (Outlet renderiza las rutas hijas, en este caso HomePage) */}
      <main className="flex-1 w-full bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      {/* Footer Básico */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Food Store. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
