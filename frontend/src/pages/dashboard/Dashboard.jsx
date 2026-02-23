import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import * as challengesApi from '../../lib/challengesApi';
import '../challenges/challenges.css';
import './dashboard.css';

const DIFF_COLOR = { easy: 'var(--green)', medium: 'var(--warn)', hard: 'var(--red)', expert: 'var(--purple)' };
const DIFF_CLASS = { easy: 'ch-badge-easy', medium: 'ch-badge-medium', hard: 'ch-badge-hard', expert: 'ch-badge-expert' };

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingChallenges(true);
      try {
        const [all, feat, cats] = await Promise.all([
          challengesApi.getChallenges().catch(() => []),
          challengesApi.getFeaturedChallenges().catch(() => []),
          challengesApi.getAllCategories().catch(() => []),
        ]);
        if (!cancelled) {
          setChallenges(all || []);
          setFeatured(feat || []);
          setCategories(cats || []);
        }
      } finally {
        if (!cancelled) setLoadingChallenges(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '??';
  const userName = user?.username ?? 'Usuario';
  const userRole = `${user?.role ?? 'STUDENT'} · ${user?.isActive !== false ? 'Active' : 'Inactive'}`;
  const elo = user?.rating ?? 1000;
  const level = user?.level ?? 1;
  const xp = user?.experiencePoints ?? 0;
  const solved = user?.totalChallengesCompleted ?? 0;
  const testsPassed = user?.totalTestsPassed ?? 0;

  const kpiCards = useMemo(() => [
    {
      icon: '◎',
      label: 'Challenges Completed',
      value: String(solved),
      color: 'var(--green)',
      barWidth: challenges.length > 0 ? `${Math.min((solved / challenges.length) * 100, 100)}%` : '0%',
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
      label: 'Experience Points',
      value: xp.toLocaleString(),
      color: 'var(--purple)',
      barWidth: `${Math.min((xp / 10000) * 100, 100)}%`,
    },
  ], [solved, elo, level, xp, challenges.length]);

  const catCounts = useMemo(() => {
    const counts = {};
    for (const ch of challenges) {
      const cat = ch.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    const colors = ['var(--cyan)', 'var(--green)', 'var(--warn)', 'var(--red)', 'var(--purple)'];
    return categories.map((cat, i) => ({
      cat,
      count: counts[cat] || 0,
      total: challenges.length,
      color: colors[i % colors.length],
    }));
  }, [categories, challenges]);

  const latestChallenges = useMemo(() => challenges.slice(0, 5), [challenges]);

  const recommendedChallenges = useMemo(() => {
    const source = featured.length > 0 ? featured : challenges;
    return source.slice(0, 3);
  }, [featured, challenges]);

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="challenges-page">
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

        {/* ── SIDEBAR ─────────────────────────────────────── */}
        <aside className={`ch-sidebar${sidebarOpen ? ' open' : ''}`}>

          <div className="db-profile-wrap">
            <div className="db-avatar">{initials}</div>
            <div className="db-profile-name">{userName}</div>
            <div className="db-profile-sub">{userRole}</div>
            <div className="db-elo-badge">
              <span className="db-elo-dot" />
              ELO {elo}
            </div>
          </div>

          <div className="ch-sidebar-section" style={{ paddingBottom: 0 }}>
            <div className="ch-sidebar-label">Combat Stats</div>
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
            <div className="ch-sidebar-label">Challenges by Category</div>
            {catCounts.length > 0 ? (
              catCounts.map(({ cat, count, total, color }) => (
                <div className="db-cat-row" key={cat}>
                  <div className="db-cat-header">
                    <span>{cat}</span>
                    <span className="db-cat-pct">{count}</span>
                  </div>
                  <div className="db-cat-track">
                    <div
                      className="db-cat-fill"
                      style={{
                        width: total > 0 ? `${(count / total) * 100}%` : '0%',
                        background: color,
                        boxShadow: `0 0 6px ${color}`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                {loadingChallenges ? 'Cargando...' : 'Sin categorias'}
              </div>
            )}
          </div>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">Platform</div>
            <div className="db-quick-stats">
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: 'var(--cyan)' }}>{challenges.length}</div>
                <div className="db-qs-label">Challenges</div>
              </div>
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: 'var(--green)' }}>{categories.length}</div>
                <div className="db-qs-label">Categories</div>
              </div>
            </div>
          </div>

        </aside>

        {/* ── MAIN CONTENT ────────────────────────────────── */}
        <main className="ch-main">

          <div className="ch-page-header" style={{ marginBottom: 28 }}>
            <div>
              <div className="db-page-eyebrow">// Your Command Center</div>
              <h1 className="db-page-title">
                Welcome back, <em>{userName}</em>
              </h1>
              <div className="db-page-sub">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                &nbsp;·&nbsp; {challenges.length} challenges available
              </div>
            </div>
            <div className="db-header-actions">
              <Link to="/challenges" className="db-btn db-btn-primary">
                Enter Arena
              </Link>
              <Link to="/profile" className="db-btn">
                View Profile
              </Link>
            </div>
          </div>

          {/* KPI stat cards */}
          <div className="db-kpi-grid">
            {kpiCards.map(card => (
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

          {/* Challenges + right panel */}
          <div className="db-content-grid">

            {/* Available challenges */}
            <div className="db-panel">
              <div className="db-panel-head">
                <div className="db-panel-title">
                  <span className="db-live-dot" />
                  Available Challenges
                </div>
                <Link to="/challenges" className="db-panel-action">View all →</Link>
              </div>

              <div className="db-table-header">
                <div style={{ width: 6, flexShrink: 0 }} />
                <div className="db-th db-th-challenge">Challenge</div>
                <div className="db-th db-th-score">Max Score</div>
                <div className="db-th db-th-status">Difficulty</div>
                <div className="db-th db-th-time">Time</div>
              </div>

              {loadingChallenges ? (
                <div style={{ padding: 24, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                  Cargando challenges...
                </div>
              ) : latestChallenges.length > 0 ? (
                latestChallenges.map(ch => {
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
                          <span>{ch.timesAttempted ?? 0} attempts</span>
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
                <div style={{ padding: 24, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                  No hay challenges disponibles
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="db-right-stack">

              {/* Your Stats panel */}
              <div className="db-panel">
                <div className="db-panel-head">
                  <div className="db-panel-title">Your Stats</div>
                  <Link to="/profile" className="db-panel-action">Profile →</Link>
                </div>
                <div style={{ padding: '12px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div className="db-avatar" style={{ width: 48, height: 48, fontSize: 18 }}>{initials}</div>
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16,
                        color: 'var(--white)', textTransform: 'uppercase',
                      }}>{userName}</div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9,
                        color: 'var(--muted)', letterSpacing: 1,
                      }}>{user?.email || ''}</div>
                    </div>
                  </div>
                  {[
                    { label: 'Rating', value: elo, color: 'var(--warn)' },
                    { label: 'Level', value: level, color: 'var(--cyan)' },
                    { label: 'XP', value: xp.toLocaleString(), color: 'var(--purple)' },
                    { label: 'Challenges Completed', value: solved, color: 'var(--green)' },
                    { label: 'Tests Passed', value: testsPassed, color: 'var(--green)' },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '6px 0', borderBottom: '1px solid var(--dim)',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9,
                        color: 'var(--muted)', letterSpacing: 1,
                      }}>{stat.label}</span>
                      <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700,
                        fontSize: 14, color: stat.color,
                      }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account info */}
              <div className="db-panel">
                <div className="db-panel-head">
                  <div className="db-panel-title">Account Info</div>
                </div>
                <div style={{ padding: '12px 18px' }}>
                  {[
                    { label: 'Role', value: user?.role ?? 'STUDENT' },
                    { label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : '—' },
                    { label: 'Last login', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-ES') : '—' },
                    { label: 'Status', value: user?.isActive !== false ? 'Active' : 'Inactive' },
                    { label: 'Email verified', value: user?.emailVerified ? 'Yes' : 'No' },
                  ].map(item => (
                    <div key={item.label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '5px 0', borderBottom: '1px solid var(--dim)',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9,
                        color: 'var(--muted)', letterSpacing: 1,
                      }}>{item.label}</span>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10,
                        color: 'var(--text)',
                      }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Recommended / Featured */}
          <div>
            <div className="db-rec-head">
              <div className="db-rec-title">
                {featured.length > 0 ? 'Featured Challenges' : 'Next Battles'}
              </div>
              <Link to="/challenges" className="db-panel-action">Browse all →</Link>
            </div>
            <div className="db-rec-grid">
              {recommendedChallenges.length > 0 ? (
                recommendedChallenges.map(rc => {
                  const diff = (rc.difficulty || 'EASY').toLowerCase();
                  const color = DIFF_COLOR[diff] || 'var(--cyan)';
                  const diffClass = DIFF_CLASS[diff] || 'ch-badge-cat';
                  return (
                    <div
                      key={rc.id}
                      className="db-rec-card"
                      style={{ '--rc-color': color }}
                      onClick={() => navigate(`/challenges/${rc.id}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`ch-badge ${diffClass}`} style={{ cursor: 'none' }}>
                          {rc.difficulty}
                        </span>
                        <span className="ch-badge ch-badge-cat">{rc.category}</span>
                        {rc.featured && <span className="ch-badge ch-badge-new">Featured</span>}
                      </div>
                      <div className="db-rec-card-title">{rc.title}</div>
                      <div className="db-rec-card-meta">
                        <div>
                          <div className="db-rec-card-pts">{(rc.maxScore ?? 0).toLocaleString()}</div>
                          <div className="db-rec-pts-label">POINTS</div>
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: 8,
                          color: 'var(--muted)', letterSpacing: '0.5px',
                          textAlign: 'right', maxWidth: 100,
                        }}>
                          {rc.timeLimitMinutes ?? 60} min · {rc.timesCompleted ?? 0} solved
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{
                  gridColumn: '1 / -1', padding: 24, textAlign: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)',
                }}>
                  {loadingChallenges ? 'Cargando...' : 'No hay challenges destacados'}
                </div>
              )}
            </div>
          </div>

        </main>
      </div>

      <BottomNav />
    </div>
  );
}
