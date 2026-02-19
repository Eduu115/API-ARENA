import { Link, useLocation } from 'react-router-dom';

const ITEMS = [
  { path: '/dashboard',   icon: '◇', label: 'Home' },
  { path: '/challenges',  icon: '⊞', label: 'Challenges' },
  { path: '/leaderboard', icon: '≋', label: 'Rankings' },
  { path: '/profile',     icon: '◉', label: 'Profile' },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="ch-bottom-nav">
      {ITEMS.map(({ path, icon, label }) => {
        const isActive = pathname === path || pathname.startsWith(path + '/');
        return (
          <Link
            key={path}
            to={path}
            className={`ch-bni${isActive ? ' active' : ''}`}
          >
            <span className="ch-bni-icon">{icon}</span>
            <span className="ch-bni-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
