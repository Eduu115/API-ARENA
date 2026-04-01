import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { label: 'Dashboard',   path: '/dashboard' },
  { label: 'Challenges',  path: '/challenges' },
  { label: 'Submissions', path: '/submissions' },
  { label: 'Leaderboard', path: '/leaderboard' },
  { label: 'Replay',      path: '/replay' },
  { label: 'Profile',     path: '/profile' },
];

export default function Topbar({ onMenuToggle, sidebarOpen }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'AA';
  const rating = user?.rating ?? 1000;

  return (
    <header className="ch-topbar">
      <div className="ch-topbar-logo">
        <div className="ch-logo-hex">
          <img src="/icons/logo-hex-sm.svg" alt="API Arena logo" width="28" height="28" />
        </div>
        <Link to="/" className="ch-logo-text">
          <span className="ch-api">API</span>
          <span className="ch-arena">Arena</span>
        </Link>
      </div>

      <button
        className={`ch-menu-btn${sidebarOpen ? ' open' : ''}`}
        onClick={onMenuToggle}
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        <span className="ch-hamburger" />
      </button>

      <nav className="ch-topbar-nav">
        {NAV_ITEMS.map(({ label, path }) => {
          const isActive = pathname === path || pathname.startsWith(path + '/');
          return (
            <Link
              key={label}
              to={path}
              className={`ch-nav-item${isActive ? ' ch-active' : ''}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="ch-topbar-right">
        <div className="ch-user-rank">
          <span className="ch-rank-badge">ELO {rating}</span>
        </div>
        <Link to="/profile" className="ch-user-avatar" title="Ver perfil">
          {initials}
        </Link>
        <button
          type="button"
          className="ch-theme-toggle"
          onClick={toggleTheme}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
          aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          {isDark ? (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="10" cy="10" r="4" />
              <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
