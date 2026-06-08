import { Outlet, Link, useNavigate } from "react-router-dom";
import { ShoppingCart, ShoppingBag, User } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";
import { useCartStore } from "../store/cartStore";
import NavbarCategoriesMenu from "./NavbarCategoriesMenu";
import CartSlideOver from "./CartSlideOver";

export default function NavbarUsuario() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);

  const openCart = useUiStore((s) => s.openCart);
  const itemCount = useCartStore((s) => s.itemCount());

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isAdmin = usuario?.roles?.some(
    (r: any) => r === "ADMIN" || r?.rol_codigo === "ADMIN"
  );

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Navbar Pública */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo y enlaces */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-2xl">🍔</span>
                <span className="text-xl font-bold text-green-dark">Food Store</span>
              </Link>

              <div className="hidden md:flex space-x-6">
                <Link
                  to="/catalogo"
                  className="text-gray-600 hover:text-green-main flex items-center gap-2 font-medium transition-colors"
                >
                  <ShoppingBag size={18} />
                  Productos
                </Link>
                <NavbarCategoriesMenu />
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-4">
              {/* Carrito */}
              <button
                onClick={openCart}
                className="relative p-2 text-gray-600 hover:text-green-main transition-colors"
              >
                <ShoppingCart size={24} />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-yellow-banner text-green-dark text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>

              <div className="h-6 w-px bg-gray-200 hidden md:block" />

              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-main">
                      <User size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Hola, <span className="font-bold text-green-dark">{usuario?.nombre?.split(" ")[0]}</span>
                    </span>
                  </div>

                  <div className="hidden md:flex items-center gap-4">
                    <Link
                      to="/mis-pedidos"
                      className="text-sm text-gray-600 hover:text-green-main font-medium transition-colors"
                    >
                      Mis Pedidos
                    </Link>
                    <Link
                      to="/mis-direcciones"
                      className="text-sm text-gray-600 hover:text-green-main font-medium transition-colors"
                    >
                      Mis Direcciones
                    </Link>
                  </div>

                  {isAdmin && (
                    <Link
                      to="/dashboard"
                      className="text-sm bg-green-main text-white px-3 py-1.5 rounded-lg hover:bg-green-dark transition-colors"
                    >
                      Dashboard
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-600 hover:text-green-main"
                  >
                    Ingresar
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium bg-green-main text-white px-4 py-2 rounded-lg hover:bg-green-dark transition-colors"
                  >
                    Crear cuenta
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Panel lateral del carrito */}
      <CartSlideOver />

      {/* Contenido principal */}
      <main className="flex-1 w-full bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Food Store. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
