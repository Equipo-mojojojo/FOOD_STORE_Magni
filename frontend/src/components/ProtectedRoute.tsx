/** ProtectedRoute — redirige a /login si no está autenticado, a / si no tiene el rol. */
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface Props {
  children: React.ReactNode;
  /** Si se pasa, al menos uno de estos roles debe tener el usuario. */
  roles?: string[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasRole = useAuthStore((s) => s.hasRole);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && !roles.some((r) => hasRole(r))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
