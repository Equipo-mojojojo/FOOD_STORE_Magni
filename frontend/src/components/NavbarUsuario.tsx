import { Outlet, Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, ShoppingBag } from "lucide-react";
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
  // Obtenemos los items directamente para que React se suscriba a los cambios
  const items = useCartStore((s) => s.items) || [];
  const totalCartItems = items.reduce((total, item) => total + (item.cantidad || 0), 0);
  
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
                <Link to="/catalogo" className="text-gray-600 hover:text-green-main flex items-center gap-2 font-medium transition-colors">
                  <ShoppingBag size={18} />
                  Productos
                </Link>
                
                {/* Menú Desplegable de Categorías */}
                <NavbarCategoriesMenu />
              </div>
            </div>

            {/* Acciones (Carrito y Usuario) */}
            <div className="flex items-center gap-4">
              <button 
                onClick={openCart}
                className="relative p-2 text-gray-600 hover:text-green-main transition-colors"
              >
                <ShoppingCart size={20} />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-danger-main text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {totalCartItems > 99 ? '99+' : totalCartItems}
                  </span>
                )}
              </button>
              
              {isAuthenticated ? (
                <div className="flex items-center gap-4 border-l border-gray-200 pl-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-main">
                      <User size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                      Hola, <span className="font-bold text-green-dark">{usuario?.nombre?.split(' ')[0] || 'Usuario'}</span>
                    </span>
                  </div>
                  {/* Botón Admin Dashboard si tiene rol */}
                  {usuario?.roles?.some((r: any) => 
                    (typeof r === 'string' && r === 'ADMIN') || 
                    (typeof r === 'object' && r?.rol_codigo === 'ADMIN')
                  ) && (
                    <Link 
                      to="/dashboard"
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md font-medium transition-colors"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="text-sm font-medium text-danger-main hover:text-danger-dark transition-colors"
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-green-main">
                    Ingresar
                  </Link>
                  <Link to="/register" className="text-sm font-medium bg-green-main text-white px-4 py-2 rounded-lg hover:bg-green-dark transition-colors">
                    Crear cuenta
                  </Link>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </nav>

      {/* Renderizamos el panel lateral del carrito globalmente */}
      <CartSlideOver />

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
