import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocalizedPath } from '../routes/LocaleLayout';
import { stripLocalePathname } from '../lib/localeRoutes';

const ITEMS_GUEST = [
  { path: '/challenges', icon: '⊞', label: 'Challenges' },
  { path: '/leaderboard', icon: '≋', label: 'Rankings' },
];

const ITEMS_AUTH = [
  { path: '/dashboard', icon: '◇', label: 'Home' },
  { path: '/challenges', icon: '⊞', label: 'Challenges' },
  { path: '/friends', icon: '✧', label: 'Friends' },
  { path: '/notifications', icon: '⌁', label: 'Alerts' },
  { path: '/leaderboard', icon: '≋', label: 'Rankings' },
  { path: '/perfil', icon: '◉', label: 'Profile' },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const logicalPath = stripLocalePathname(pathname);
  const { isAuthenticated } = useAuth();
  const lp = useLocalizedPath();
  const items = isAuthenticated ? ITEMS_AUTH : ITEMS_GUEST;

  return (
    <nav className="ch-bottom-nav">
      {items.map(({ path, icon, label }) => {
        const isActive = logicalPath === path || logicalPath.startsWith(`${path}/`);
        return (
          <Link
            key={path}
            to={lp(path)}
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
