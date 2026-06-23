import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import LocaleLink from "../../components/LocaleLink";
import { stripLocalePathname } from "../../lib/localeRoutes";
import { useTranslation } from "react-i18next";
import Topbar from "../../components/Topbar";
import BottomNav from "../../components/BottomNav";
import CustomCursor from "../../components/CustomCursor";
import "../../pages/challenges/challenges.css";
import "../../pages/dashboard/dashboard.css";

const TEACHER_NAV = [
  { label: "Dashboard", path: "/teacher" },
  { label: "Groups", path: "/teacher/groups" },
  { label: "Corrections", path: "/teacher/corrections" },
  { label: "Challenges", path: "/teacher/challenges" },
  { label: "Create challenge", path: "/teacher/challenges/new" },
];

export default function TeacherLayout({ children }) {
  const { t } = useTranslation("teacher");
  const { pathname } = useLocation();
  const logicalPath = stripLocalePathname(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const active = useMemo(() => {
    const exact = TEACHER_NAV.find((n) => n.path === logicalPath);
    if (exact) return exact.path;
    if (logicalPath.startsWith("/teacher/groups")) return "/teacher/groups";
    if (logicalPath.startsWith("/teacher/challenges")) return "/teacher/challenges";
    if (logicalPath.startsWith("/teacher/corrections")) return "/teacher/corrections";
    return "/teacher";
  }, [logicalPath]);

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
            <div className="ch-sidebar-label">{t("layout.teacher")}</div>
            <div style={{ padding: "10px 0 2px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
                {t("layout.teacherPanel")}
              </div>
              <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                <LocaleLink
                  to="/dashboard"
                  className="ch-filter-btn"
                  style={{ justifyContent: "space-between" }}
                >
                  <span>{t("layout.goToDashboard")}</span>
                  <span className="ch-filter-count">→</span>
                </LocaleLink>
              </div>
            </div>
          </div>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">{t("layout.navigation")}</div>
            {TEACHER_NAV.map((item) => (
              <LocaleLink
                key={item.path}
                to={item.path}
                className={`ch-filter-btn${active === item.path ? " ch-active" : ""}`}
                style={{ justifyContent: "space-between" }}
              >
                <span className="ch-filter-label-inner">{item.label}</span>
                <span className="ch-filter-count">{active === item.path ? "●" : ""}</span>
              </LocaleLink>
            ))}
          </div>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">{t("layout.shortcuts")}</div>
            <div className="db-quick-stats" style={{ marginTop: 10 }}>
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: "var(--cyan)" }}>
                  ✓
                </div>
                <div className="db-qs-label">{t("layout.review")}</div>
              </div>
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: "var(--green)" }}>
                  +
                </div>
                <div className="db-qs-label">{t("layout.create")}</div>
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
