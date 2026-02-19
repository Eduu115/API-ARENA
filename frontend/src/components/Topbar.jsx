import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Dashboard',   path: '/dashboard' },
  { label: 'Challenges',  path: '/challenges' },
  { label: 'Submissions', path: '/submissions' },
  { label: 'Leaderboard', path: '/leaderboard' },
  { label: 'Replay',      path: '/replay' },
];

export default function Topbar({ onMenuToggle, sidebarOpen }) {
  const { pathname } = useLocation();

  return (
    <header className="ch-topbar">
      <div className="ch-topbar-logo">
        <div className="ch-logo-hex">
          <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon
              points="14,1 26,7.5 26,20.5 14,27 2,20.5 2,7.5"
              fill="#1A2040"
              stroke="#00D9FF"
              strokeWidth="1.2"
            />
            <path
              d="M9,9.5 L7.5,9.5 Q6.5,9.5 6.5,10.5 L6.5,12.5 Q6.5,14 5,14 Q6.5,14 6.5,15.5 L6.5,17.5 Q6.5,18.5 7.5,18.5 L9,18.5"
              stroke="url(#topbar-cg)"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M19,9.5 L20.5,9.5 Q21.5,9.5 21.5,10.5 L21.5,12.5 Q21.5,14 23,14 Q21.5,14 21.5,15.5 L21.5,17.5 Q21.5,18.5 20.5,18.5 L19,18.5"
              stroke="url(#topbar-cg)"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            />
            <line
              x1="11.5" y1="18.5" x2="16.5" y2="9.5"
              stroke="#B24BF3"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="topbar-cg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#00D9FF" />
                <stop offset="100%" stopColor="#00FFA3" />
              </linearGradient>
            </defs>
          </svg>
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
          <span className="ch-rank-badge">ELO 1247</span>
          <span style={{ color: 'var(--muted)' }}>★ #42</span>
        </div>
        <div className="ch-user-avatar">ED</div>
      </div>
    </header>
  );
}
