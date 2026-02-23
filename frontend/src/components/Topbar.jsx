import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

      {/* Hamburger: visible only on tablet/mobile via CSS */}
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
      </div>
    </header>
  );
}
