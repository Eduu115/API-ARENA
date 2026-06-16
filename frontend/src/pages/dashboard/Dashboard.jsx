import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { usePageMeta } from '../../lib/usePageMeta';

const DIFF_COLOR = { easy: 'var(--green)', medium: 'var(--warn)', hard: 'var(--red)', expert: 'var(--purple)' };

const SIDEBAR_LINKS = [
  { label: 'Challenges', path: '/challenges', icon: 'challenges', primary: true },
  { label: 'Submissions', path: '/submissions', icon: 'submissions' },
  { label: 'Profile', path: '/perfil', icon: 'profile' },
];

export default function Dashboard() {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [weeklyStreak, setWeeklyStreak] = useState(null);

  usePageMeta({ title: t('pageTitle'), path: '/dashboard' });

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
  const activeLabel = user?.isActive !== false ? t('active') : t('inactive');
  const userRole = `${user?.role ?? 'STUDENT'} · ${activeLabel}`;
  const elo = user?.rating ?? 1000;
  const level = user?.level ?? 1;
  const xp = user?.experiencePoints ?? 0;
  const solved = user?.totalChallengesCompleted ?? 0;
  const unranked = isUnranked(solved);
  const untilRanked = challengesUntilRanked(solved);

  const dateLocale = i18n.language?.startsWith('es') ? 'es-ES' : 'en-US';

  const statStrip = useMemo(() => ([
    {
      label: t('stats.elo'),
      value: unranked ? t('unranked') : elo.toLocaleString(),
      color: unranked ? 'var(--purple)' : 'var(--warn)',
    },
    { label: t('stats.level'), value: String(level), color: 'var(--cyan)' },
    { label: t('stats.completed'), value: String(solved), color: 'var(--green)' },
    { label: t('stats.xp'), value: xp.toLocaleString(), color: 'var(--purple)' },
  ]), [elo, level, solved, xp, unranked, t]);

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
                  <span className="db-elo-badge-lbl">{t('stats.elo')}</span>
                  <span className="db-elo-badge-val">{t('unranked')}</span>
                </>
              ) : (
                <>{t('stats.elo')} {elo}</>
              )}
            </div>
            {unranked && (
              <p className="db-elo-hint">
                {t('rankMore', { count: untilRanked })}
              </p>
            )}
          </div>

          <div className="ch-sidebar-section db-sidebar-nav">
            <div className="ch-sidebar-label">{t('quickJump')}</div>
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
              <div className="db-page-eyebrow">{t('eyebrow')}</div>
              <h1 className="db-page-title">
                {t('welcomeBefore')} <em>{userName}</em>
              </h1>
              <div className="db-page-sub">
                {new Date().toLocaleDateString(dateLocale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div className="db-header-actions">
              <Link to="/challenges" className="db-btn db-btn-primary">
                {t('enterArena')}
              </Link>
            </div>
          </div>

          <WeeklyStreakPanel streak={weeklyStreak} variant="hero" />

          <div className="db-stat-strip" aria-label={t('combatOverview')}>
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
                {t('featured.title')}
              </div>
              <Link to="/challenges" className="db-panel-action">{t('featured.catalog')}</Link>
            </div>
            <p className="db-panel-lead">
              {t('featured.lead')}
            </p>

            <div className="db-table-header">
              <div style={{ width: 6, flexShrink: 0 }} />
              <div className="db-th db-th-challenge">{t('featured.colChallenge')}</div>
              <div className="db-th db-th-score">{t('featured.colScore')}</div>
              <div className="db-th db-th-status">{t('featured.colDifficulty')}</div>
              <div className="db-th db-th-time">{t('featured.colTime')}</div>
            </div>

            {loadingFeatured ? (
              <div className="db-panel-empty">{t('featured.loading')}</div>
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
                        <span>{ch.timesCompleted ?? 0} {t('featured.solved')}</span>
                      </div>
                    </div>
                    <div className="db-row-score">
                      <div className="db-row-score-label">
                        <span>{ch.maxScore ?? 0}</span>
                        <span>{t('featured.pts')}</span>
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
                {t('featured.empty')}{' '}
                <Link to="/challenges" className="db-panel-action" style={{ display: 'inline' }}>
                  {t('featured.browse')}
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
