import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Topbar from "../../components/Topbar";
import BottomNav from "../../components/BottomNav";
import CustomCursor from "../../components/CustomCursor";
import "../../pages/challenges/challenges.css";
import "../../pages/dashboard/dashboard.css";

const TEACHER_NAV = [
  { label: "Dashboard", path: "/teacher" },
  { label: "Grupos", path: "/teacher/groups" },
  { label: "Correcciones", path: "/teacher/corrections" },
  { label: "Challenges", path: "/teacher/challenges" },
  { label: "Crear challenge", path: "/teacher/challenges/new" },
];

export default function TeacherLayout({ children }) {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const active = useMemo(() => {
    const exact = TEACHER_NAV.find((n) => n.path === pathname);
    if (exact) return exact.path;
    if (pathname.startsWith("/teacher/groups")) return "/teacher/groups";
    if (pathname.startsWith("/teacher/challenges")) return "/teacher/challenges";
    if (pathname.startsWith("/teacher/corrections")) return "/teacher/corrections";
    return "/teacher";
  }, [pathname]);

  return (
    <div className="challenges-page teacher-page">
      <CustomCursor />
      <div className="ch-grid-bg" />

      <div className="ch-layout">
        <Topbar onMenuToggle={() => setSidebarOpen((s) => !s)} sidebarOpen={sidebarOpen} />

        <div
          className={`ch-sidebar-overlay${sidebarOpen ? " open" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside className={`ch-sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">Profesor</div>
            <div style={{ padding: "10px 0 2px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
                // Panel docente
              </div>
              <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                <Link
                  to="/dashboard"
                  className="ch-filter-btn"
                  style={{ justifyContent: "space-between" }}
                >
                  <span>Ir al dashboard</span>
                  <span className="ch-filter-count">→</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">Navegación</div>
            {TEACHER_NAV.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`ch-filter-btn${active === item.path ? " ch-active" : ""}`}
                style={{ justifyContent: "space-between" }}
              >
                <span className="ch-filter-label-inner">{item.label}</span>
                <span className="ch-filter-count">{active === item.path ? "●" : ""}</span>
              </Link>
            ))}
          </div>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">Atajos</div>
            <div className="db-quick-stats" style={{ marginTop: 10 }}>
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: "var(--cyan)" }}>
                  ✓
                </div>
                <div className="db-qs-label">Evaluar</div>
              </div>
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: "var(--green)" }}>
                  +
                </div>
                <div className="db-qs-label">Crear</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="ch-main">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}

