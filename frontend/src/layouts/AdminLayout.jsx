import { useEffect } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { clearAdminEscape, setAdminEscape } from "../lib/adminEscape";
import "../pages/admin/admin.css";

function isAdmin(role) {
  return String(role || "").toUpperCase() === "ADMIN";
}

/** Isolated admin console ("bunker"): ADMIN-only, its own command-deck shell, no normal-site chrome. */
export default function AdminLayout() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();

  // Entering the bunker re-seals the escape hatch.
  useEffect(() => {
    if (isAuthenticated && isAdmin(user?.role)) {
      clearAdminEscape();
    }
  }, [isAuthenticated, user?.role]);

  if (isLoading) {
    return (
      <div className="admin-loading" aria-busy="true">
        Initializing console…
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/es/login" replace />;
  }
  if (!isAdmin(user?.role)) {
    return <Navigate to="/es/dashboard" replace />;
  }

  function goToSite() {
    setAdminEscape();
    navigate("/es/dashboard");
  }

  async function handleLogout() {
    await logout();
    navigate("/es/login", { replace: true });
  }

  return (
    <div className="admin-root">
      <div className="admin-bg" aria-hidden="true" />
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img className="admin-brand__logo" src="/icons/logo-hex-lg.svg" alt="" width="36" height="36" />
          <span className="admin-brand__text">
            <span className="admin-brand__name">
              <span className="admin-brand__api">API</span> Arena
            </span>
            <span className="admin-brand__sub">Admin console</span>
          </span>
        </div>

        <nav className="admin-nav" aria-label="Admin sections">
          <NavLink end to="/admin" className="admin-nav__link">
            <span className="admin-nav__ico" aria-hidden="true">▚</span> Overview
          </NavLink>
          <NavLink to="/admin/users" className="admin-nav__link">
            <span className="admin-nav__ico" aria-hidden="true">◇</span> Users
          </NavLink>
          <NavLink to="/admin/audit" className="admin-nav__link">
            <span className="admin-nav__ico" aria-hidden="true">≡</span> Audit log
          </NavLink>
        </nav>

        <div className="admin-sidebar__foot">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={goToSite}>
            ↗ Go to site
          </button>
          <button type="button" className="admin-btn admin-btn--danger" onClick={handleLogout}>
            Log out
          </button>
          <div className="admin-whoami" title={user?.email}>
            {user?.email}
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
