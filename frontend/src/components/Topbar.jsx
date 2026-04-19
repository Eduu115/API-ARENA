import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ProfileAccountMenu from "./ProfileAccountMenu";
import { getUnreadNotificationCount } from "../lib/notificationsApi";
import { connectNotificationsWs } from "../lib/notificationsWs";
import { NavIcon, IconBell, IconSun, IconMoon } from "./topbar/TopbarIcons";
import "./Topbar.css";

const MIN_RANKED_CHALLENGES = 3;

const NAV_ITEMS_GUEST = [
  { label: "Challenges", path: "/challenges", icon: "challenges" },
  { label: "Leaderboard", path: "/leaderboard", icon: "leaderboard" },
  { label: "Docs", path: "/docs", icon: "docs" },
  { label: "Replay", path: "/replay", icon: "replay" },
];

const NAV_ITEMS_AUTH = [
  { label: "Dashboard", path: "/dashboard", icon: "dashboard" },
  { label: "Challenges", path: "/challenges", icon: "challenges" },
  { label: "Submissions", path: "/submissions", icon: "submissions" },
  { label: "Friends", path: "/friends", icon: "friends" },
  { label: "Leaderboard", path: "/leaderboard", icon: "leaderboard" },
  { label: "Docs", path: "/docs", icon: "docs" },
  { label: "Replay", path: "/replay", icon: "replay" },
];

/** showSidebarToggle: pages with a side panel (filters, etc.). No panel → no hamburger. */
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
  const completedChallenges = Number(user?.totalChallengesCompleted ?? 0);
  const isUnranked = Number.isFinite(completedChallenges) && completedChallenges < MIN_RANKED_CHALLENGES;
  const remainingForRank = Math.max(0, MIN_RANKED_CHALLENGES - completedChallenges);
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
        className={`arena-nav-link${isActive ? " arena-nav-link--active" : ""}`}
        title={label}
      >
        <span className="arena-nav-link__ico" aria-hidden>
          <NavIcon name={icon} />
        </span>
        <span className="arena-nav-link__label">{label}</span>
      </Link>
    );
  }

  return (
    <>
      <header className="arena-navbar" role="banner" data-tutorial="topbar">
        <nav className="arena-navbar__inner" aria-label="Main">
          <div className="arena-navbar__brand">
            <div className="arena-navbar__logo">
              <div className="arena-navbar__hex">
                <img
                  src="/icons/logo-hex-sm.svg"
                  alt="API Arena logo"
                  width="28"
                  height="28"
                />
              </div>
              <Link to="/" className="arena-navbar__title">
                <span className="arena-navbar__title-api">API</span>
                <span className="arena-navbar__title-arena">Arena</span>
              </Link>
            </div>

            {showSidebarToggle ? (
              <button
                type="button"
                className={`arena-navbar__menu${sidebarOpen ? " is-open" : ""}`}
                onClick={onMenuToggle}
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              >
                <span className="arena-navbar__menu-icon" />
              </button>
            ) : null}
          </div>

          <div className="arena-navbar__link-list">
            {navItems.map((item) => renderNavLink(item))}
            {isTeacher && (
              <Link
                to="/teacher"
                className={`arena-nav-link${
                  pathname.startsWith("/teacher") ? " arena-nav-link--active" : ""
                }`}
                title="Teacher"
              >
                <span className="arena-nav-link__ico" aria-hidden>
                  <NavIcon name="teacher" />
                </span>
                <span className="arena-nav-link__label">Teacher</span>
              </Link>
            )}
          </div>

          {isAuthenticated ? (
          <div className="arena-navbar__actions">
            <div className={`arena-navbar__elo${isUnranked ? " arena-navbar__elo--unranked" : ""}`} title={isUnranked ? undefined : `Rating ${rating}`}>
              <span className="arena-navbar__elo-lbl">ELO</span>
              <span className={`arena-navbar__elo-val${isUnranked ? " arena-navbar__elo-val--unranked" : ""}`}>
                {isUnranked ? "UNRANKED" : rating}
              </span>
              {isUnranked && (
                <span className="arena-navbar__elo-help-wrap">
                  <Link
                    to="/docs/sistema-xp-elo"
                    className="arena-navbar__elo-help"
                    aria-label="Open ELO System documentation"
                  >
                    ?
                  </Link>
                  <span className="arena-navbar__elo-tooltip">
                    You are unranked until you complete {MIN_RANKED_CHALLENGES} challenges.
                    {remainingForRank > 0 ? ` ${remainingForRank} left to classify.` : ""}
                  </span>
                </span>
              )}
            </div>

            <Link
              to="/notifications"
              className="arena-navbar__notif"
              aria-label="Notifications"
              title="Notifications"
            >
              <span className="arena-navbar__notif-ico" aria-hidden>
                <IconBell />
              </span>
              <span className="arena-navbar__notif-txt">Alerts</span>
              {unreadNotifications > 0 && (
                <span className="arena-navbar__notif-badge">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </Link>

            <button
              type="button"
              className="arena-navbar__theme"
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="arena-navbar__theme-ico" aria-hidden>
                {isDark ? <IconSun /> : <IconMoon />}
              </span>
              <span className="arena-navbar__theme-txt">
                {isDark ? "Light mode" : "Dark mode"}
              </span>
            </button>

            <button
              type="button"
              className={`arena-navbar__profile${profileActive ? " arena-navbar__profile--on" : ""}`}
              onClick={() => setAccountMenuOpen((o) => !o)}
              aria-expanded={accountMenuOpen}
              aria-haspopup="dialog"
              aria-controls="profile-account-menu"
              title="Profile menu"
            >
              <span className="arena-navbar__profile-ico" aria-hidden>
                <NavIcon name="profile" />
              </span>
              <span className="arena-navbar__profile-txt">Profile</span>
            </button>
          </div>
          ) : (
            <div className="arena-navbar__actions">
              <Link to="/login" className="arena-navbar__login" title="Log in">
                Log in
              </Link>
              <button
                type="button"
                className="arena-navbar__theme"
                onClick={toggleTheme}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                <span className="arena-navbar__theme-ico" aria-hidden>
                  {isDark ? <IconSun /> : <IconMoon />}
                </span>
                <span className="arena-navbar__theme-txt">
                  {isDark ? "Light mode" : "Dark mode"}
                </span>
              </button>
            </div>
          )}
        </nav>
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
