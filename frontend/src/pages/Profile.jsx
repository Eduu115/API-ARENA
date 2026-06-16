import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../lib/authApi';
import { getGlobalUserRank } from '../lib/leaderboardApi';
import { getMyBestPerChallengeStats } from '../lib/submissionsApi';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import CustomCursor from '../components/CustomCursor';
import WeeklyStreakPanel from '../components/WeeklyStreakPanel';
import AchievementList from '../components/AchievementList';
import BadgeCollection from '../components/BadgeCollection';
import ProfileBadges from '../components/ProfileBadges';
import { recentUnlockedAchievements } from '../lib/achievementDisplay';
import { usePageMeta } from '../lib/usePageMeta';
import './challenges/challenges.css';
import './dashboard/dashboard.css';
import './Profile.css';


const PROFILE_ACH_PREVIEW = 4;

function formatTimeStat(seconds, t) {
  const s = Number(seconds) || 0;
  if (s < 3600) return `${Math.max(0, Math.round(s / 60))} ${t('kpi.min')}`;
  const h = s / 3600;
  return `${h.toFixed(1)} ${t('kpi.hours')}`;
}

export default function Profile() {
  const { t, i18n } = useTranslation('profile');
  const { user, isLoading, isAuthenticated, loadUser, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    avatarUrl: '',
    bio: '',
    githubUsername: '',
  });
  const [achievements, setAchievements] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [badges, setBadges] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [badgesSaving, setBadgesSaving] = useState(false);
  const [weeklyStreak, setWeeklyStreak] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [privacyError, setPrivacyError] = useState(null);
  const [globalRank, setGlobalRank] = useState(null);
  const [bestPerChallengeStats, setBestPerChallengeStats] = useState(null);
  const [bestPerChallengeLoading, setBestPerChallengeLoading] = useState(true);

  usePageMeta({ title: t('pageTitle'), path: '/perfil' });

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      navigate('/login', { replace: true, state: { from: { pathname: '/perfil' } } });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;
    setAchievementsLoading(true);
    authApi
      .getMyAchievements()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setAchievements(data);
      })
      .catch(() => {
        if (!cancelled) setAchievements([]);
      })
      .finally(() => {
        if (!cancelled) setAchievementsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;
    setBadgesLoading(true);
    authApi
      .getMyBadges()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setBadges(data);
      })
      .catch(() => {
        if (!cancelled) setBadges([]);
      })
      .finally(() => {
        if (!cancelled) setBadgesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;
    authApi.getMyWeeklyStreak()
      .then((data) => { if (!cancelled) setWeeklyStreak(data); })
      .catch(() => { if (!cancelled) setWeeklyStreak(null); });
    return () => { cancelled = true; };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    let cancelled = false;
    getGlobalUserRank(user.id)
      .then((data) => {
        if (!cancelled) setGlobalRank(data);
      })
      .catch(() => {
        if (!cancelled) setGlobalRank(null);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;
    setBestPerChallengeLoading(true);
    getMyBestPerChallengeStats()
      .then((data) => {
        if (!cancelled) setBestPerChallengeStats(data);
      })
      .catch(() => {
        if (!cancelled) setBestPerChallengeStats(null);
      })
      .finally(() => {
        if (!cancelled) setBestPerChallengeLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, user]);

  const initials = useMemo(() => {
    const src = user?.username || user?.email || 'U';
    const parts = String(src).trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return String(src).slice(0, 2).toUpperCase();
  }, [user]);

  const elo = user?.rating ?? 1000;
  const level = user?.level ?? 1;
  const xp = user?.experiencePoints ?? 0;
  const solved = user?.totalChallengesCompleted ?? 0;
  const testsPassed = user?.totalTestsPassed ?? 0;

  const kpiCards = useMemo(
    () => {
      const devSeconds = user?.totalDevelopmentSeconds ?? 0;
      const browseSeconds = user?.totalBrowsingSeconds ?? 0;
      const avgBest = bestPerChallengeStats?.averageBestScore;
      const avgBestLabel = bestPerChallengeLoading
        ? '…'
        : avgBest != null
          ? avgBest.toFixed(1)
          : '—';
      const avgBestBar =
        avgBest != null
          ? `${Math.min((avgBest / (bestPerChallengeStats?.maxScoreScale ?? 1000)) * 100, 100)}%`
          : '0%';
      const attempted = bestPerChallengeStats?.challengesAttempted ?? 0;
      const avgHint =
        attempted > 0
          ? t('kpi.avgBestHintCount', { count: attempted })
          : t('kpi.avgBestHint');
      return [
      {
        icon: '◈',
        label: t('kpi.avgBest'),
        value: avgBestLabel,
        color: 'var(--warn)',
        barWidth: avgBestBar,
        privateOnly: true,
        hint: avgHint,
      },
      {
        icon: '⏱',
        label: t('kpi.timeCoding'),
        value: formatTimeStat(devSeconds, t),
        color: 'var(--green)',
        barWidth: `${Math.min((devSeconds / 36000) * 100, 100)}%`,
      },
      {
        icon: '⌂',
        label: t('kpi.timeOnSite'),
        value: formatTimeStat(browseSeconds, t),
        color: 'var(--purple)',
        barWidth: `${Math.min((browseSeconds / 36000) * 100, 100)}%`,
      },
      {
        icon: '⊕',
        label: t('kpi.experience'),
        value: xp.toLocaleString(),
        color: 'var(--purple)',
        barWidth: `${Math.min((xp / 10000) * 100, 100)}%`,
      },
      {
        icon: '◎',
        label: t('kpi.challengesCleared'),
        value: String(solved),
        color: 'var(--green)',
        barWidth: `${Math.min(10 + solved * 8, 100)}%`,
      },
      {
        icon: '⊗',
        label: t('kpi.testsPassed'),
        value: String(testsPassed),
        color: 'var(--cyan)',
        barWidth: `${Math.min((testsPassed / 100) * 100, 100)}%`,
      },
    ];
    },
    [user, xp, solved, testsPassed, bestPerChallengeStats, bestPerChallengeLoading, t]
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const unlockedBadgeCount = badges.filter((b) => b.unlocked).length;
  const displayedCollectibles = useMemo(
    () => badges.filter((b) => b.unlocked && b.displayed),
    [badges]
  );
  const previewAchievements = useMemo(
    () => recentUnlockedAchievements(achievements, PROFILE_ACH_PREVIEW),
    [achievements]
  );
  const showViewAllAchievements = !achievementsLoading && achievements.length > 0;

  const handleBadgeDisplayUpdate = async (codes) => {
    setBadgesSaving(true);
    try {
      const updated = await authApi.updateDisplayedBadges(codes);
      setBadges(Array.isArray(updated) ? updated : []);
    } finally {
      setBadgesSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="challenges-page dashboard-page profile-page">
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
        <main className="ch-main profile-main">
          <div className="profile-loading">{t('loading')}</div>
        </main>
        <BottomNav />
        <CustomCursor />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const dateLocale = i18n.language?.startsWith('es') ? 'es-ES' : 'en-US';
  const formatDate = (d) => (d ? new Date(d).toLocaleString(dateLocale) : '—');

  const handleEdit = () => {
    setForm({
      avatarUrl: user.avatarUrl || '',
      bio: user.bio || '',
      githubUsername: user.githubUsername || '',
    });
    setEditing(true);
    setError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await authApi.updateProfile(form);
      setEditing(false);
      await loadUser();
      authApi.getMyBadges().then((data) => {
        if (Array.isArray(data)) setBadges(data);
      }).catch(() => {});
    } catch (err) {
      setError(err?.message || t('updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
    setConfirmLogout(false);
  };

  const handleSwitchAccount = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleExportData = async () => {
    setPrivacyError(null);
    setExporting(true);
    try {
      const data = await authApi.exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'api-arena-my-data.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setPrivacyError(e?.message || t('exportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setPrivacyError(null);
    setDeleting(true);
    try {
      await authApi.deleteMyAccount();
      await logout();
      navigate('/', { replace: true });
    } catch (e) {
      setPrivacyError(e?.message || t('deleteError'));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="challenges-page dashboard-page profile-page">
      <CustomCursor />
      <div className="ch-grid-bg" />

      <div className="ch-layout">
        <Topbar
          onMenuToggle={() => setSidebarOpen((s) => !s)}
          sidebarOpen={sidebarOpen}
        />

        <div
          className={`ch-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside className={`ch-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="db-profile-wrap">
            <div className="db-avatar profile-sidebar-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="profile-sidebar-avatar-img" />
              ) : (
                initials
              )}
            </div>
            <div className="db-profile-name">{user.username}</div>
            <div className="db-profile-sub">{userRoleLabel(user, t)}</div>
            <div className="db-elo-badge">
              <span className="db-elo-dot" />
              ELO {elo}
            </div>
          </div>

          <div className="ch-sidebar-section" style={{ paddingBottom: 0 }}>
            <div className="ch-sidebar-label">{t('combatStats')}</div>
            <div className="db-quick-stats">
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: 'var(--green)' }}>{solved}</div>
                <div className="db-qs-label">{t('solved')}</div>
              </div>
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: 'var(--purple)' }}>{xp.toLocaleString()}</div>
                <div className="db-qs-label">{t('xp')}</div>
              </div>
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: 'var(--warn)' }}>{testsPassed}</div>
                <div className="db-qs-label">{t('tests')}</div>
              </div>
            </div>
          </div>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">{t('achievementsSidebar')}</div>
            <div className="profile-sidebar-ach">
              {achievementsLoading
                ? t('achievementsLoading')
                : t('achievementsCount', { unlocked: unlockedCount, total: achievements.length })}
            </div>
          </div>
        </aside>

        <main className="ch-main profile-main">
          <div className="profile-main-inner">
            <div className="profile-top-bar">
              <Link to="/dashboard" className="profile-back-link">
                {t('backDashboard')}
              </Link>
              <div className="profile-head-actions">
                <button type="button" className="profile-btn-ghost" onClick={handleSwitchAccount}>
                  {t('switchAccount')}
                </button>
                <button
                  type="button"
                  className="profile-btn-logout"
                  onClick={() => setConfirmLogout(true)}
                >
                  {t('logOut')}
                </button>
              </div>
            </div>

            <section className="profile-identity-hero" aria-labelledby="profile-identity-heading">
              <div className="profile-identity-visual">
                <div className="profile-hero-avatar" aria-hidden>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="profile-hero-avatar-img" />
                  ) : (
                    <span className="profile-hero-avatar-initials">{initials}</span>
                  )}
                </div>
              </div>

              <div className="profile-identity-body">
                <div className="profile-identity-eyebrow">{t('eyebrow')}</div>
                <h1 id="profile-identity-heading" className="profile-identity-name">
                  <span className="profile-identity-name-user">{user.username}</span>
                  <span className="profile-identity-name-level">{t('levelPrefix', { level })}</span>
                </h1>
                <ProfileBadges
                  profile={user}
                  globalRank={globalRank}
                  displayedBadges={displayedCollectibles}
                  showRole={false}
                  className="profile-identity-badges"
                />
                <div className="profile-identity-meta">
                  <span>{user.email}</span>
                  <span className="profile-identity-sep" aria-hidden>·</span>
                  <span>{user.role}</span>
                  {user.emailVerified && (
                    <>
                      <span className="profile-identity-sep" aria-hidden>·</span>
                      <span className="profile-inline-verified">{t('verified')}</span>
                    </>
                  )}
                </div>

                {!editing ? (
                  <div className="profile-identity-content">
                    <div className="profile-hero-bio-wrap">
                      {user.bio ? (
                        <p className="profile-hero-bio">{user.bio}</p>
                      ) : (
                        <p className="profile-hero-bio profile-hero-bio--empty">
                          {t('bioEmpty')}
                        </p>
                      )}
                    </div>
                    {user.githubUsername && (
                      <p className="profile-hero-github">
                        <a
                          href={`https://github.com/${user.githubUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          github.com/{user.githubUsername}
                        </a>
                      </p>
                    )}
                    <button type="button" className="profile-btn-edit profile-btn-edit--hero" onClick={handleEdit}>
                      {t('editProfile')}
                    </button>
                  </div>
                ) : (
                  <form className="profile-form profile-form--hero" onSubmit={handleSave}>
                    {error && <div className="profile-error">{error}</div>}
                    <div className="profile-form-group">
                      <label htmlFor="avatarUrl">{t('avatarUrl')}</label>
                      <input
                        id="avatarUrl"
                        type="url"
                        value={form.avatarUrl}
                        onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                        placeholder="https://…"
                      />
                    </div>
                    <div className="profile-form-group">
                      <label htmlFor="bio">{t('bio')}</label>
                      <textarea
                        id="bio"
                        rows={4}
                        value={form.bio}
                        onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                        placeholder={t('bioPlaceholder')}
                      />
                    </div>
                    <div className="profile-form-group">
                      <label htmlFor="githubUsername">{t('githubUsername')}</label>
                      <input
                        id="githubUsername"
                        type="text"
                        value={form.githubUsername}
                        onChange={(e) => setForm((f) => ({ ...f, githubUsername: e.target.value }))}
                      />
                    </div>
                    <div className="profile-form-actions">
                      <button type="submit" className="profile-btn-save" disabled={saving}>
                        {saving ? t('saving') : t('save')}
                      </button>
                      <button type="button" className="profile-btn-cancel" onClick={handleCancel}>
                        {t('cancel')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>

            <section className="profile-strip" aria-label={t('performanceAria')}>
              <div className="db-section-eyebrow">{t('combatOverview')}</div>
              <p className="profile-strip-hint">
                {t('stripHint')}
              </p>
              <div className="db-kpi-grid profile-kpi-grid db-kpi-grid--secondary">
                {kpiCards.map((card) => (
                  <div
                    key={card.label}
                    className={`db-kpi-card${card.privateOnly ? ' db-kpi-card--private' : ''}`}
                    style={{ '--kpi-color': card.color }}
                    title={card.hint}
                  >
                    <div className="db-kpi-top">
                      <span className="db-kpi-icon">{card.icon}</span>
                    </div>
                    <div className="db-kpi-val">{card.value}</div>
                    <div className="db-kpi-label">{card.label}</div>
                    <div className="db-kpi-bar" style={{ width: card.barWidth }} />
                  </div>
                ))}
              </div>
            </section>

            <section className="profile-block profile-block--badges" aria-labelledby="badges-heading">
              <div className="profile-block-head">
                <h2 id="badges-heading" className="profile-block-title">
                  {t('badgesTitle')}
                </h2>
                <span className="profile-block-meta">
                  {badgesLoading ? '…' : t('unlockedCount', { count: unlockedBadgeCount })}
                </span>
              </div>
              <BadgeCollection
                badges={badges}
                loading={badgesLoading}
                saving={badgesSaving}
                globalRank={globalRank}
                onToggleDisplay={handleBadgeDisplayUpdate}
              />
            </section>

            <section className="profile-block profile-block--ach-preview" aria-labelledby="ach-heading">
              <div className="profile-block-head">
                <h2 id="ach-heading" className="profile-block-title">
                  {t('achievementsTitle')}
                </h2>
                <span className="profile-block-meta">
                  {achievementsLoading
                    ? '…'
                    : t('unlockedCount', { count: unlockedCount })}
                </span>
              </div>
              <p className="profile-block-lead">
                {t('achievementsLead')}
              </p>
              {achievementsLoading ? (
                <div className="profile-loading profile-loading--inline">{t('loadingAchievements')}</div>
              ) : previewAchievements.length > 0 ? (
                <AchievementList achievements={previewAchievements} />
              ) : (
                <p className="profile-ach-empty">
                  {t('achievementsEmpty')}
                </p>
              )}
              {showViewAllAchievements && !achievementsLoading && (
                <div className="profile-ach-view-all-wrap">
                  <Link to="/perfil/achievements" className="profile-ach-view-all">
                    {t('viewAllAchievements')}
                  </Link>
                </div>
              )}
            </section>

            <section className="profile-block profile-block--streak" aria-labelledby="streak-heading">
              <div className="profile-block-head">
                <h2 id="streak-heading" className="profile-block-title">
                  {t('streakTitle')}
                </h2>
                <Link to="/dashboard" className="profile-streak-link">
                  {t('streakFullView')}
                </Link>
              </div>
              <WeeklyStreakPanel streak={weeklyStreak} variant="minimal" />
            </section>

            <section className="profile-block profile-block--meta" aria-labelledby="account-heading">
              <div className="profile-block-head">
                <h2 id="account-heading" className="profile-block-title">
                  {t('accountTitle')}
                </h2>
              </div>
              <dl className="profile-meta-dl">
                <div className="profile-meta-row">
                  <dt>{t('joined')}</dt>
                  <dd>{formatDate(user.createdAt)}</dd>
                </div>
                <div className="profile-meta-row">
                  <dt>{t('lastLogin')}</dt>
                  <dd>{formatDate(user.lastLogin)}</dd>
                </div>
                <div className="profile-meta-row">
                  <dt>{t('status')}</dt>
                  <dd>{user.isActive !== false ? t('active') : t('inactive')}</dd>
                </div>
              </dl>
            </section>

            <section className="profile-block profile-block--meta" aria-labelledby="privacy-heading">
              <div className="profile-block-head">
                <h2 id="privacy-heading" className="profile-block-title">
                  {t('privacyTitle')}
                </h2>
              </div>
              <p className="profile-privacy-text">
                <Trans
                  i18nKey="privacyText"
                  t={t}
                  components={{ 1: <Link to="/privacidad" /> }}
                />
              </p>
              {privacyError && (
                <div className="auth-alert" role="alert" style={{ marginBottom: 12 }}>
                  {privacyError}
                </div>
              )}
              <div className="profile-privacy-actions">
                <button
                  type="button"
                  className="profile-btn-ghost"
                  onClick={handleExportData}
                  disabled={exporting}
                >
                  {exporting ? t('exporting') : t('exportData')}
                </button>
                <button
                  type="button"
                  className="profile-btn-logout"
                  onClick={() => setConfirmDelete(true)}
                >
                  {t('deleteAccount')}
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>

      <BottomNav />

      {confirmLogout &&
        createPortal(
          <div
            className="profile-modal-backdrop"
            role="presentation"
            onClick={() => setConfirmLogout(false)}
          >
            <div
              className="profile-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-logout-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-modal-header">
                <h2 id="profile-logout-title">{t('logoutTitle')}</h2>
              </div>
              <div className="profile-modal-body">
                <p>{t('logoutBody')}</p>
              </div>
              <div className="profile-modal-footer">
                <button
                  type="button"
                  className="profile-modal-btn"
                  onClick={() => setConfirmLogout(false)}
                >
                  {t('cancel')}
                </button>
                <button type="button" className="profile-modal-btn profile-modal-btn--danger" onClick={handleLogout}>
                  {t('logOut')}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {confirmDelete &&
        createPortal(
          <div
            className="profile-modal-backdrop"
            role="presentation"
            onClick={() => !deleting && setConfirmDelete(false)}
          >
            <div
              className="profile-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-delete-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-modal-header">
                <h2 id="profile-delete-title">{t('deleteTitle')}</h2>
              </div>
              <div className="profile-modal-body">
                <p>
                  <Trans i18nKey="deleteBody" t={t} components={{ 1: <strong /> }} />
                </p>
              </div>
              <div className="profile-modal-footer">
                <button
                  type="button"
                  className="profile-modal-btn"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  className="profile-modal-btn profile-modal-btn--danger"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? t('deleting') : t('deleteForever')}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function userRoleLabel(u, t) {
  const role = u?.role ?? 'STUDENT';
  const active = u?.isActive !== false ? t('active') : t('inactive');
  return `${role} · ${active}`;
}
