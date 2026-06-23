import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocalizedPath } from "../routes/LocaleLayout";
import "./auth-layout.css";

/**
 * Routes only for authenticated users. Redirects to /login and preserves destination URL.
 */
export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
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

  return <Outlet />;
}
