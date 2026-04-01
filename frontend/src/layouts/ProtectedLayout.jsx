import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./auth-layout.css";

/**
 * Rutas solo para usuarios autenticados. Redirige a /login guardando la URL de destino.
 */
export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="auth-layout-loading" aria-busy="true" aria-live="polite">
        <div className="auth-layout-loading-inner">Cargando…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
