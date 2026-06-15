import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../lib/authApi';
import { getGlobalUserRank } from '../lib/leaderboardApi';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import CustomCursor from '../components/CustomCursor';
import WeeklyStreakPanel from '../components/WeeklyStreakPanel';
import AchievementList from '../components/AchievementList';
import ProfileBadges from '../components/ProfileBadges';
import { recentUnlockedAchievements } from '../lib/achievementDisplay';
import './challenges/challenges.css';
import './dashboard/dashboard.css';
import './Profile.css';


const PROFILE_ACH_PREVIEW = 4;

function formatTimeStat(seconds) {
  const s = Number(seconds) || 0;
  if (s < 3600) return `${Math.max(0, Math.round(s / 60))} min`;
  const h = s / 3600;
  return `${h.toFixed(1)} h`;
}

export default function Profile() {
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
  const [weeklyStreak, setWeeklyStreak] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [privacyError, setPrivacyError] = useState(null);
  const [globalRank, setGlobalRank] = useState(null);

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
      return [
      {
        icon: '⏱',
        label: 'Time coding',
        value: formatTimeStat(devSeconds),
        color: 'var(--green)',
        barWidth: `${Math.min((devSeconds / 36000) * 100, 100)}%`,
      },
      {
        icon: '⌂',
        label: 'Time on site',
        value: formatTimeStat(browseSeconds),
        color: 'var(--purple)',
        barWidth: `${Math.min((browseSeconds / 36000) * 100, 100)}%`,
      },
      {
        icon: '⊕',
        label: 'Experience',
        value: xp.toLocaleString(),
        color: 'var(--purple)',
        barWidth: `${Math.min((xp / 10000) * 100, 100)}%`,
      },
      {
        icon: '◎',
        label: 'Challenges cleared',
        value: String(solved),
        color: 'var(--green)',
        barWidth: `${Math.min(10 + solved * 8, 100)}%`,
      },
      {
        icon: '⊗',
        label: 'Tests passed',
        value: String(testsPassed),
        color: 'var(--cyan)',
        barWidth: `${Math.min((testsPassed / 100) * 100, 100)}%`,
      },
    ];
    },
    [user, xp, solved, testsPassed]
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const previewAchievements = useMemo(
    () => recentUnlockedAchievements(achievements, PROFILE_ACH_PREVIEW),
    [achievements]
  );
  const showViewAllAchievements = !achievementsLoading && achievements.length > 0;

  if (isLoading) {
    return (
      <div className="challenges-page dashboard-page profile-page">
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
        <main className="ch-main profile-main">
          <div className="profile-loading">Loading profile…</div>
        </main>
        <BottomNav />
        <CustomCursor />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const formatDate = (d) => (d ? new Date(d).toLocaleString('en-US') : '—');

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
    } catch (err) {
      setError(err?.message || 'Could not update profile');
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
      setPrivacyError(e?.message || 'Could not export your data.');
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
      setPrivacyError(e?.message || 'Could not delete your account.');
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
            <div className="db-profile-sub">{userRoleLabel(user)}</div>
            <div className="db-elo-badge">
              <span className="db-elo-dot" />
              ELO {elo}
            </div>
          </div>

          <div className="ch-sidebar-section" style={{ paddingBottom: 0 }}>
            <div className="ch-sidebar-label">Combat stats</div>
            <div className="db-quick-stats">
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: 'var(--green)' }}>{solved}</div>
                <div className="db-qs-label">Solved</div>
              </div>
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: 'var(--purple)' }}>{xp.toLocaleString()}</div>
                <div className="db-qs-label">XP</div>
              </div>
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: 'var(--warn)' }}>{testsPassed}</div>
                <div className="db-qs-label">Tests</div>
              </div>
            </div>
          </div>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">Achievements</div>
            <div className="profile-sidebar-ach">
              {achievementsLoading
                ? 'Loading…'
                : `${unlockedCount} / ${achievements.length} unlocked`}
            </div>
          </div>
        </aside>

        <main className="ch-main profile-main">
          <div className="profile-main-inner">
            <div className="profile-top-bar">
              <Link to="/dashboard" className="profile-back-link">
                ← Dashboard
              </Link>
              <div className="profile-head-actions">
                <button type="button" className="profile-btn-ghost" onClick={handleSwitchAccount}>
                  Switch account
                </button>
                <button
                  type="button"
                  className="profile-btn-logout"
                  onClick={() => setConfirmLogout(true)}
                >
                  Log out
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
                <div className="profile-identity-eyebrow">// Operator file</div>
                <h1 id="profile-identity-heading" className="profile-identity-name">
                  <span className="profile-identity-name-user">{user.username}</span>
                  <span className="profile-identity-name-level">· Lvl {level}</span>
                </h1>
                <ProfileBadges
                  profile={user}
                  achievements={achievements}
                  globalRank={globalRank}
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
                      <span className="profile-inline-verified">Verified</span>
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
                          No bio yet — tell the arena who you are.
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
                      Edit profile
                    </button>
                  </div>
                ) : (
                  <form className="profile-form profile-form--hero" onSubmit={handleSave}>
                    {error && <div className="profile-error">{error}</div>}
                    <div className="profile-form-group">
                      <label htmlFor="avatarUrl">Avatar URL</label>
                      <input
                        id="avatarUrl"
                        type="url"
                        value={form.avatarUrl}
                        onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                        placeholder="https://…"
                      />
                    </div>
                    <div className="profile-form-group">
                      <label htmlFor="bio">Bio</label>
                      <textarea
                        id="bio"
                        rows={4}
                        value={form.bio}
                        onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                        placeholder="Short intro…"
                      />
                    </div>
                    <div className="profile-form-group">
                      <label htmlFor="githubUsername">GitHub username</label>
                      <input
                        id="githubUsername"
                        type="text"
                        value={form.githubUsername}
                        onChange={(e) => setForm((f) => ({ ...f, githubUsername: e.target.value }))}
                      />
                    </div>
                    <div className="profile-form-actions">
                      <button type="submit" className="profile-btn-save" disabled={saving}>
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button type="button" className="profile-btn-cancel" onClick={handleCancel}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>

            <section className="profile-strip" aria-label="Performance">
              <div className="db-section-eyebrow">Combat overview</div>
              <div className="db-kpi-grid profile-kpi-grid db-kpi-grid--secondary">
                {kpiCards.map((card) => (
                  <div
                    key={card.label}
                    className="db-kpi-card"
                    style={{ '--kpi-color': card.color }}
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

            <section className="profile-block profile-block--ach-preview" aria-labelledby="ach-heading">
              <div className="profile-block-head">
                <h2 id="ach-heading" className="profile-block-title">
                  Achievements
                </h2>
                <span className="profile-block-meta">
                  {achievementsLoading
                    ? '…'
                    : `${unlockedCount} unlocked`}
                </span>
              </div>
              <p className="profile-block-lead">
                Latest milestones — synced from your stats and streaks.
              </p>
              {achievementsLoading ? (
                <div className="profile-loading profile-loading--inline">Loading achievements…</div>
              ) : previewAchievements.length > 0 ? (
                <AchievementList achievements={previewAchievements} />
              ) : (
                <p className="profile-ach-empty">
                  No achievements unlocked yet. Complete a challenge or verify your email to start.
                </p>
              )}
              {showViewAllAchievements && !achievementsLoading && (
                <div className="profile-ach-view-all-wrap">
                  <Link to="/perfil/achievements" className="profile-ach-view-all">
                    View all achievements →
                  </Link>
                </div>
              )}
            </section>

            <section className="profile-block profile-block--streak" aria-labelledby="streak-heading">
              <div className="profile-block-head">
                <h2 id="streak-heading" className="profile-block-title">
                  Weekly streak
                </h2>
                <Link to="/dashboard" className="profile-streak-link">
                  Full view →
                </Link>
              </div>
              <WeeklyStreakPanel streak={weeklyStreak} variant="minimal" />
            </section>

            <section className="profile-block profile-block--meta" aria-labelledby="account-heading">
              <div className="profile-block-head">
                <h2 id="account-heading" className="profile-block-title">
                  Account
                </h2>
              </div>
              <dl className="profile-meta-dl">
                <div className="profile-meta-row">
                  <dt>Joined</dt>
                  <dd>{formatDate(user.createdAt)}</dd>
                </div>
                <div className="profile-meta-row">
                  <dt>Last login</dt>
                  <dd>{formatDate(user.lastLogin)}</dd>
                </div>
                <div className="profile-meta-row">
                  <dt>Status</dt>
                  <dd>{user.isActive !== false ? 'Active' : 'Inactive'}</dd>
                </div>
              </dl>
            </section>

            <section className="profile-block profile-block--meta" aria-labelledby="privacy-heading">
              <div className="profile-block-head">
                <h2 id="privacy-heading" className="profile-block-title">
                  Privacy &amp; data
                </h2>
              </div>
              <p className="profile-privacy-text">
                You can download a copy of your personal data, or permanently delete your account.
                See our <Link to="/privacidad">Privacy Policy</Link>.
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
                  {exporting ? 'Preparing…' : 'Export my data'}
                </button>
                <button
                  type="button"
                  className="profile-btn-logout"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete my account
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
                <h2 id="profile-logout-title">Log out?</h2>
              </div>
              <div className="profile-modal-body">
                <p>You will need to sign in again to access your profile.</p>
              </div>
              <div className="profile-modal-footer">
                <button
                  type="button"
                  className="profile-modal-btn"
                  onClick={() => setConfirmLogout(false)}
                >
                  Cancel
                </button>
                <button type="button" className="profile-modal-btn profile-modal-btn--danger" onClick={handleLogout}>
                  Log out
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
                <h2 id="profile-delete-title">Delete your account?</h2>
              </div>
              <div className="profile-modal-body">
                <p>
                  This action is <strong>permanent</strong>. It deletes your profile, submissions,
                  uploaded files and associated personal data. This cannot be undone.
                </p>
              </div>
              <div className="profile-modal-footer">
                <button
                  type="button"
                  className="profile-modal-btn"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="profile-modal-btn profile-modal-btn--danger"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Delete forever'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function userRoleLabel(u) {
  const role = u?.role ?? 'STUDENT';
  const active = u?.isActive !== false ? 'Active' : 'Inactive';
  return `${role} · ${active}`;
}
