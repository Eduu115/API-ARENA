import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocalizedPath } from "../routes/LocaleLayout";
import "./auth-layout.css";

function isTeacherRole(role) {
  return String(role || "").toUpperCase() === "TEACHER";
}

/**
 * Teacher routes: requires session and TEACHER role.
 */
export default function TeacherLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const lp = useLocalizedPath();

  if (isLoading) {
    return (
      <div className="auth-layout-loading" aria-busy="true" aria-live="polite">
        <div className="auth-layout-loading-inner">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={lp("/login")} replace state={{ from: location }} />;
  }

  if (!isTeacherRole(user?.role)) {
    return <Navigate to={lp("/dashboard")} replace />;
  }

  return <Outlet />;
}
