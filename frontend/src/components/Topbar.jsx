import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ProfileAccountMenu from "./ProfileAccountMenu";
import { getUnreadNotificationCount } from "../lib/notificationsApi";
import { connectNotificationsWs } from "../lib/notificationsWs";
import { NavIcon, IconBell, IconSun, IconMoon } from "./topbar/TopbarIcons";
import "./Topbar.css";

const NAV_ITEMS_GUEST = [
  { label: "Challenges", path: "/challenges", icon: "challenges" },
  { label: "Leaderboard", path: "/leaderboard", icon: "leaderboard" },
  { label: "Replay", path: "/replay", icon: "replay" },
];

const NAV_ITEMS_AUTH = [
  { label: "Dashboard", path: "/dashboard", icon: "dashboard" },
  { label: "Challenges", path: "/challenges", icon: "challenges" },
  { label: "Submissions", path: "/submissions", icon: "submissions" },
  { label: "Friends", path: "/friends", icon: "friends" },
  { label: "Leaderboard", path: "/leaderboard", icon: "leaderboard" },
  { label: "Replay", path: "/replay", icon: "replay" },
];

/** showSidebarToggle: páginas con panel lateral (filtros, etc.). Sin panel → sin hamburguesa. */
export default function Topbar({
  onMenuToggle,
  sidebarOpen,
  showSidebarToggle = true,
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navItems = isAuthenticated ? NAV_ITEMS_AUTH : NAV_ITEMS_GUEST;
  const { isDark, toggleTheme } = useTheme();
  const rating = user?.rating ?? 1000;
  const isTeacher = String(user?.role || "").toUpperCase() === "TEACHER";
  const profileActive =
    pathname === "/perfil" ||
    pathname.startsWith("/perfil/") ||
    accountMenuOpen;

  useEffect(() => {
    setAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotifications(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const n = await getUnreadNotificationCount();
        if (!cancelled) setUnreadNotifications(Number(n?.count) || 0);
      } catch {
        if (!cancelled) setUnreadNotifications(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, pathname]);

  useEffect(() => {
    if (!isAuthenticated) return () => {};
    const disconnect = connectNotificationsWs({
      onEvent: (msg) => {
        if (msg?.unreadCount != null) {
          setUnreadNotifications(Number(msg.unreadCount) || 0);
        }
      },
    });
    return () => disconnect();
  }, [isAuthenticated]);

  async function handleLogoutFromMenu() {
    await logout();
    navigate("/", { replace: true });
  }

  async function handleSwitchAccount() {
    await logout();
    navigate("/login", { replace: true });
  }

  function renderNavLink({ label, path, icon }) {
    const isActive =
      pathname === path || pathname.startsWith(`${path}/`);
    return (
      <Link
        key={path}
        to={path}
        className={`ch-nav-item ch-nav-item--iconrow${isActive ? " ch-active" : ""}`}
        title={label}
      >
        <span className="ch-nav-ico" aria-hidden>
          <NavIcon name={icon} />
        </span>
        <span className="ch-nav-ico-label">{label}</span>
      </Link>
    );
  }

  return (
    <>
      <header className="ch-topbar">
        <div className="ch-topbar-brand">
          <div className="ch-topbar-logo">
            <div className="ch-logo-hex">
              <img
                src="/icons/logo-hex-sm.svg"
                alt="API Arena logo"
                width="28"
                height="28"
              />
            </div>
            <Link to="/" className="ch-logo-text">
              <span className="ch-api">API</span>
              <span className="ch-arena">Arena</span>
            </Link>
          </div>

          {showSidebarToggle ? (
            <button
              type="button"
              className={`ch-menu-btn${sidebarOpen ? " open" : ""}`}
              onClick={onMenuToggle}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              <span className="ch-hamburger" />
            </button>
          ) : null}
        </div>

        <nav className="ch-topbar-nav" aria-label="Main">
          <div className="ch-topbar-nav-inner">
            {navItems.map((item) => renderNavLink(item))}
            {isTeacher && (
              <Link
                to="/teacher"
                className={`ch-nav-item ch-nav-item--iconrow${
                  pathname.startsWith("/teacher") ? " ch-active" : ""
                }`}
                title="Teacher"
              >
                <span className="ch-nav-ico" aria-hidden>
                  <NavIcon name="teacher" />
                </span>
                <span className="ch-nav-ico-label">Teacher</span>
              </Link>
            )}
          </div>
        </nav>

        {isAuthenticated ? (
          <div className="ch-topbar-actions">
            <div className="ch-topbar-elo" title={`Rating ${rating}`}>
              <span className="ch-topbar-elo-label">ELO</span>
              <span className="ch-topbar-elo-value">{rating}</span>
            </div>

            <Link
              to="/notifications"
              className="ch-topbar-notif-link"
              aria-label="Notifications"
              title="Notifications"
            >
              <span className="ch-topbar-notif-ico" aria-hidden>
                <IconBell />
              </span>
              <span className="ch-topbar-notif-text">Alerts</span>
              {unreadNotifications > 0 && (
                <span className="ch-notif-badge">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </Link>

            <button
              type="button"
              className="ch-topbar-theme-btn"
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="ch-topbar-theme-ico" aria-hidden>
                {isDark ? <IconSun /> : <IconMoon />}
              </span>
              <span className="ch-topbar-theme-text">
                {isDark ? "Light mode" : "Dark mode"}
              </span>
            </button>

            <button
              type="button"
              className={`ch-topbar-profile-btn${profileActive ? " ch-topbar-profile-btn--active" : ""}`}
              onClick={() => setAccountMenuOpen((o) => !o)}
              aria-expanded={accountMenuOpen}
              aria-haspopup="dialog"
              aria-controls="profile-account-menu"
              title="Profile menu"
            >
              <span className="ch-topbar-profile-ico" aria-hidden>
                <NavIcon name="profile" />
              </span>
              <span className="ch-topbar-profile-text">Profile</span>
            </button>
          </div>
        ) : (
          <div className="ch-topbar-actions">
            <Link
              to="/login"
              className="ch-nav-item ch-topbar-login"
              title="Log in"
            >
              Log in
            </Link>
            <button
              type="button"
              className="ch-topbar-theme-btn"
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="ch-topbar-theme-ico" aria-hidden>
                {isDark ? <IconSun /> : <IconMoon />}
              </span>
              <span className="ch-topbar-theme-text">
                {isDark ? "Light mode" : "Dark mode"}
              </span>
            </button>
          </div>
        )}
      </header>

      {isAuthenticated && (
        <ProfileAccountMenu
          id="profile-account-menu"
          open={accountMenuOpen}
          onClose={() => setAccountMenuOpen(false)}
          user={user}
          onLogout={handleLogoutFromMenu}
          onSwitchAccount={handleSwitchAccount}
        />
      )}
    </>
  );
}
