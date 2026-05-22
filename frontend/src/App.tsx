/** App principal — Router + Layout con Sidebar. */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useUiStore } from "./store/uiStore";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import IngredientesPage from "./pages/IngredientesPage";
import CategoriasPage from "./pages/CategoriasPage";
import ProductosPage from "./pages/ProductosPage";
import RegisterPage from "./pages/RegisterPage";

function AppLayout() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const closeSidebar = useUiStore((s) => s.closeSidebar);

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/ingredientes" element={<IngredientesPage />} />
            <Route path="/categorias" element={<CategoriasPage />} />
            <Route path="/productos" element={<ProductosPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
