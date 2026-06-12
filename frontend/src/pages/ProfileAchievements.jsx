import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../lib/authApi';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import CustomCursor from '../components/CustomCursor';
import AchievementList from '../components/AchievementList';
import { sortAchievementsRecentFirst } from '../lib/achievementDisplay';
import './challenges/challenges.css';
import './dashboard/dashboard.css';
import './Profile.css';

export default function ProfileAchievements() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      navigate('/login', { replace: true, state: { from: { pathname: '/perfil/achievements' } } });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;
    setLoading(true);
    authApi
      .getMyAchievements()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setAchievements(data);
      })
      .catch(() => {
        if (!cancelled) setAchievements([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  const sorted = useMemo(() => sortAchievementsRecentFirst(achievements), [achievements]);

  const filtered = useMemo(() => {
    if (filter === 'unlocked') return sorted.filter((a) => a.unlocked);
    if (filter === 'locked') return sorted.filter((a) => !a.unlocked);
    return sorted;
  }, [sorted, filter]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="challenges-page dashboard-page profile-page">
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
        <main className="ch-main profile-main">
          <div className="profile-loading">Loading achievements…</div>
        </main>
        <BottomNav />
        <CustomCursor />
      </div>
    );
  }

  return (
    <div className="challenges-page dashboard-page profile-page">
      <CustomCursor />
      <div className="ch-grid-bg" />

      <div className="ch-layout">
        <Topbar onMenuToggle={() => setSidebarOpen((s) => !s)} sidebarOpen={sidebarOpen} />

        <div
          className={`ch-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        <main className="ch-main profile-main profile-main--achievements">
          <div className="profile-main-inner">
            <div className="profile-top-bar">
              <Link to="/perfil" className="profile-back-link">
                ← Profile
              </Link>
            </div>

            <header className="profile-ach-page-head">
              <div className="profile-identity-eyebrow">// Milestones</div>
              <h1 className="profile-ach-page-title">Achievements</h1>
              <p className="profile-ach-page-lead">
                {loading
                  ? 'Loading…'
                  : `${unlockedCount} of ${achievements.length} unlocked — synced from your stats and streaks.`}
              </p>
            </header>

            <div className="profile-ach-filters" role="tablist" aria-label="Filter achievements">
              {[
                { id: 'all', label: 'All' },
                { id: 'unlocked', label: 'Unlocked' },
                { id: 'locked', label: 'Locked' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filter === id}
                  className={`profile-ach-filter${filter === id ? ' profile-ach-filter--active' : ''}`}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="profile-loading profile-loading--inline">Loading achievements…</div>
            ) : (
              <AchievementList
                achievements={filtered}
                emptyMessage={
                  filter === 'unlocked'
                    ? 'Nothing unlocked in this filter yet — keep playing.'
                    : filter === 'locked'
                      ? 'You have unlocked every achievement so far.'
                      : 'No achievements defined yet.'
                }
              />
            )}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
