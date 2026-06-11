import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../lib/authApi';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import CustomCursor from '../components/CustomCursor';
import WeeklyStreakPanel from '../components/WeeklyStreakPanel';
import './challenges/challenges.css';
import './dashboard/dashboard.css';
import './Profile.css';


const TIER_LABEL = { COMMON: 'Common', RARE: 'Rare', EPIC: 'Epic', LEGEND: 'Legend' };

const TIER_STYLE = {
  COMMON: { color: 'var(--muted)', accent: 'rgba(255,255,255,0.14)' },
  RARE: { color: 'var(--cyan)', accent: 'rgba(0,255,255,0.45)' },
  EPIC: { color: 'var(--purple)', accent: 'rgba(168,85,247,0.5)' },
  LEGEND: { color: 'var(--warn)', accent: 'rgba(255,200,0,0.55)' },
};

const ACH_ICON = {
  gate: '⬡',
  target: '◎',
  mail: '✉',
  flame: '⌁',
  star: '★',
  bolt: '⚡',
  crown: '♔',
};

function formatTimeStat(seconds) {
  const s = Number(seconds) || 0;
  if (s < 3600) return `${Math.max(0, Math.round(s / 60))} min`;
  const h = s / 3600;
  return `${h.toFixed(1)} h`;
}

function achievementIcon(iconKey) {
  if (iconKey && ACH_ICON[iconKey]) return ACH_ICON[iconKey];
  return '◆';
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
        icon: '★',
        label: 'Rating (ELO)',
        value: elo.toLocaleString(),
        color: 'var(--warn)',
        barWidth: `${Math.min((elo / 3000) * 100, 100)}%`,
      },
      {
        icon: '◇',
        label: 'Level',
        value: String(level),
        color: 'var(--cyan)',
        barWidth: `${Math.min((level / 50) * 100, 100)}%`,
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
    [user, elo, level, xp, solved, testsPassed]
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

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
            <div className="db-avatar">{initials}</div>
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
                <div className="db-qs-val" style={{ color: 'var(--cyan)' }}>{level}</div>
                <div className="db-qs-label">Level</div>
              </div>
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
            <div className="ch-sidebar-label">Weekly streak</div>
            <WeeklyStreakPanel streak={weeklyStreak} compact />
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
            <div className="ch-page-header profile-page-head">
              <div>
                <Link to="/dashboard" className="profile-back-link">
                  ← Dashboard
                </Link>
                <div className="db-page-eyebrow">// Operator file</div>
                <h1 className="db-page-title">
                  <em>{user.username}</em>
                </h1>
                <div className="db-page-sub">
                  {user.email}
                  {' · '}
                  {user.role}
                  {user.emailVerified && (
                    <span className="profile-inline-verified"> · Verified</span>
                  )}
                </div>
              </div>
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

            <section className="profile-strip" aria-label="Performance">
              <div className="db-kpi-grid profile-kpi-grid">
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

            <section className="profile-block" aria-labelledby="ach-heading">
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
                Milestones sync from your account stats and cohort flags.
              </p>
              <div className="profile-ach-grid">
                {achievements.map((a) => {
                  const tier = a.tier || 'COMMON';
                  const ts = TIER_STYLE[tier] || TIER_STYLE.COMMON;
                  const locked = !a.unlocked;
                  return (
                    <div
                      key={a.code}
                      className={`profile-ach${locked ? ' profile-ach--locked' : ''}`}
                      style={{ borderLeftColor: ts.accent }}
                    >
                      <div className="profile-ach-glyph" aria-hidden style={{ color: ts.color }}>
                        {locked ? '·' : achievementIcon(a.iconKey)}
                      </div>
                      <div className="profile-ach-main">
                        <div className="profile-ach-top">
                          <span className="profile-ach-tier" style={{ color: ts.color }}>
                            {TIER_LABEL[tier] || tier}
                          </span>
                          {a.unlocked && a.unlockedAt && (
                            <time className="profile-ach-when" dateTime={a.unlockedAt}>
                              {new Date(a.unlockedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </time>
                          )}
                        </div>
                        <div className="profile-ach-name">{a.title}</div>
                        <p className="profile-ach-desc">{a.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="profile-block" aria-labelledby="info-heading">
              <div className="profile-block-head">
                <h2 id="info-heading" className="profile-block-title">
                  Profile
                </h2>
              </div>

              {!editing ? (
                <div className="profile-info-display">
                  {user.bio && <p className="profile-bio">{user.bio}</p>}
                  {user.githubUsername && (
                    <p className="profile-github">
                      GitHub:{' '}
                      <a
                        href={`https://github.com/${user.githubUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        @{user.githubUsername}
                      </a>
                    </p>
                  )}
                  {!user.bio && !user.githubUsername && (
                    <p className="profile-empty">No bio or links yet.</p>
                  )}
                  <button type="button" className="profile-btn-edit" onClick={handleEdit}>
                    Edit profile
                  </button>
                </div>
              ) : (
                <form className="profile-form" onSubmit={handleSave}>
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
                      rows={3}
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
            </section>

            <section className="profile-block profile-block--meta" aria-labelledby="account-heading">
              <div className="profile-block-head">
                <h2 id="account-heading" className="profile-block-title">
                  Account
                </h2>
              </div>
              <dl className="profile-meta-dl">
                <div className="profile-meta-row">
                  <dt>User ID</dt>
                  <dd>{user.id}</dd>
                </div>
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
