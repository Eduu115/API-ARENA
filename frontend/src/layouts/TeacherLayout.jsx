import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./auth-layout.css";

function isTeacherRole(role) {
  return String(role || "").toUpperCase() === "TEACHER";
}

/**
 * Rutas de profesor: requiere sesión y rol TEACHER. Si no hay sesión → login; si no es teacher → dashboard.
 */
export default function TeacherLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
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

  if (!isTeacherRole(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
