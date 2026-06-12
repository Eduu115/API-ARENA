import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import { NavIcon } from '../../components/topbar/TopbarIcons';
import * as challengesApi from '../../lib/challengesApi';
import '../challenges/challenges.css';
import './dashboard.css';
import TutorialTour from '../../components/tutorial/TutorialTour';
import WeeklyStreakPanel from '../../components/WeeklyStreakPanel';
import * as authApi from '../../lib/authApi';
import { isUnranked, challengesUntilRanked } from '../../lib/rankConstants';
import { DOCS_PATHS, TOUR_DASHBOARD } from '../../tutorial/tourDefinitions';

const DIFF_COLOR = { easy: 'var(--green)', medium: 'var(--warn)', hard: 'var(--red)', expert: 'var(--purple)' };

const SIDEBAR_LINKS = [
  { label: 'Challenges', path: '/challenges', icon: 'challenges', primary: true },
  { label: 'Submissions', path: '/submissions', icon: 'submissions' },
  { label: 'Profile', path: '/perfil', icon: 'profile' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [weeklyStreak, setWeeklyStreak] = useState(null);

  useEffect(() => {
    let cancelled = false;
    authApi.getMyWeeklyStreak()
      .then((data) => { if (!cancelled) setWeeklyStreak(data); })
      .catch(() => { if (!cancelled) setWeeklyStreak(null); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingFeatured(true);
      try {
        const feat = await challengesApi.getFeaturedChallenges().catch(() => []);
        if (!cancelled) setFeatured(feat || []);
      } finally {
        if (!cancelled) setLoadingFeatured(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '??';
  const userName = user?.username ?? 'User';
  const userRole = `${user?.role ?? 'STUDENT'} · ${user?.isActive !== false ? 'Active' : 'Inactive'}`;
  const elo = user?.rating ?? 1000;
  const level = user?.level ?? 1;
  const xp = user?.experiencePoints ?? 0;
  const solved = user?.totalChallengesCompleted ?? 0;
  const unranked = isUnranked(solved);
  const untilRanked = challengesUntilRanked(solved);

  const statStrip = useMemo(() => ([
    {
      label: 'ELO',
      value: unranked ? 'UNRANKED' : elo.toLocaleString(),
      color: unranked ? 'var(--purple)' : 'var(--warn)',
    },
    { label: 'Level', value: String(level), color: 'var(--cyan)' },
    { label: 'Completed', value: String(solved), color: 'var(--green)' },
    { label: 'XP', value: xp.toLocaleString(), color: 'var(--purple)' },
  ]), [elo, level, solved, xp, unranked]);

  const featuredList = useMemo(() => featured.slice(0, 6), [featured]);

  return (
    <div className="challenges-page dashboard-page">
      <CustomCursor />
      <div className="ch-grid-bg" />

      <div className="ch-layout">
        <Topbar
          onMenuToggle={() => setSidebarOpen(s => !s)}
          sidebarOpen={sidebarOpen}
        />

        <div
          className={`ch-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside className={`ch-sidebar${sidebarOpen ? ' open' : ''}`} data-tutorial="dashboard-sidebar">
          <div className="db-profile-wrap">
            <div className="db-avatar">{initials}</div>
            <div className="db-profile-name">{userName}</div>
            <div className="db-profile-sub">{userRole}</div>
            <div className={`db-elo-badge${unranked ? ' db-elo-badge--unranked' : ''}`}>
              <span className="db-elo-dot" />
              {unranked ? (
                <>
                  <span className="db-elo-badge-lbl">ELO</span>
                  <span className="db-elo-badge-val">UNRANKED</span>
                </>
              ) : (
                <>ELO {elo}</>
              )}
            </div>
            {unranked && (
              <p className="db-elo-hint">
                {untilRanked} more challenge{untilRanked !== 1 ? 's' : ''} to classify
              </p>
            )}
          </div>

          <div className="ch-sidebar-section db-sidebar-nav">
            <div className="ch-sidebar-label">Quick jump</div>
            <div className="db-jump-list">
              {SIDEBAR_LINKS.map(({ label, path, icon, primary }) => {
                const active = pathname === path || pathname.startsWith(`${path}/`);
                return (
                  <Link
                    key={path}
                    to={path}
                    className={[
                      'db-jump-link',
                      primary ? 'db-jump-link--primary' : '',
                      active ? 'db-jump-link--active' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <span className="db-jump-link__ico" aria-hidden>
                      <NavIcon name={icon} />
                    </span>
                    <span className="db-jump-link__label">{label}</span>
                    <span className="db-jump-link__arrow" aria-hidden>→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="ch-main" data-tutorial="dashboard-main">
          <div className="ch-page-header db-page-header">
            <div>
              <div className="db-page-eyebrow">// Your command center</div>
              <h1 className="db-page-title">
                Welcome back, <em>{userName}</em>
              </h1>
              <div className="db-page-sub">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div className="db-header-actions">
              <Link to="/challenges" className="db-btn db-btn-primary">
                Enter Arena
              </Link>
            </div>
          </div>

          <WeeklyStreakPanel streak={weeklyStreak} variant="hero" />

          <div className="db-stat-strip" aria-label="Combat overview">
            {statStrip.map((stat) => (
              <div key={stat.label} className="db-stat-strip__item">
                <span className="db-stat-strip__lbl">{stat.label}</span>
                <span className="db-stat-strip__val" style={{ color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>

          <div className="db-panel db-panel--feed">
            <div className="db-panel-head">
              <div className="db-panel-title">
                <span className="db-live-dot" />
                Featured challenges
              </div>
              <Link to="/challenges" className="db-panel-action">Full catalog →</Link>
            </div>
            <p className="db-panel-lead">
              Current highlights in the arena — hand-picked for visibility.
            </p>

            <div className="db-table-header">
              <div style={{ width: 6, flexShrink: 0 }} />
              <div className="db-th db-th-challenge">Challenge</div>
              <div className="db-th db-th-score">Max Score</div>
              <div className="db-th db-th-status">Difficulty</div>
              <div className="db-th db-th-time">Time</div>
            </div>

            {loadingFeatured ? (
              <div className="db-panel-empty">Loading featured challenges…</div>
            ) : featuredList.length > 0 ? (
              featuredList.map(ch => {
                const diff = (ch.difficulty || 'EASY').toLowerCase();
                const dotColor = DIFF_COLOR[diff] || 'var(--cyan)';
                return (
                  <div
                    key={ch.id}
                    className="db-activity-row"
                    onClick={() => navigate(`/challenges/${ch.id}`)}
                  >
                    <div
                      className="db-row-dot"
                      style={{ background: dotColor, boxShadow: `0 0 5px ${dotColor}` }}
                    />
                    <div className="db-row-info">
                      <div className="db-row-title">{ch.title}</div>
                      <div className="db-row-meta">
                        <span>{ch.category}</span>
                        <span style={{ color: 'var(--dim)' }}>·</span>
                        <span>{ch.timesCompleted ?? 0} solved</span>
                      </div>
                    </div>
                    <div className="db-row-score">
                      <div className="db-row-score-label">
                        <span>{ch.maxScore ?? 0}</span>
                        <span>pts</span>
                      </div>
                      <div className="db-row-track">
                        <div
                          className="db-row-fill"
                          style={{ width: `${Math.min(((ch.averageScore ?? 0) / (ch.maxScore || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="db-row-status" style={{ color: dotColor }}>
                      {ch.difficulty}
                    </div>
                    <div className="db-row-time">{ch.timeLimitMinutes ?? 60}m</div>
                  </div>
                );
              })
            ) : (
              <div className="db-panel-empty">
                No featured challenges right now.{' '}
                <Link to="/challenges" className="db-panel-action" style={{ display: 'inline' }}>
                  Browse the catalog
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav />
      <TutorialTour tourKey="dashboard" steps={TOUR_DASHBOARD} docsHref={DOCS_PATHS.dashboard} when />
    </div>
  );
}
