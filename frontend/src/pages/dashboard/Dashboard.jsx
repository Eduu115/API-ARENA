import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import '../challenges/challenges.css';
import './dashboard.css';

/* ============================================================
   MOCK DATA
   ============================================================ */
const USER = {
  initials: 'ED',
  name: 'EXPLORADOR',
  role: 'API Engineer · Active',
  elo: 1247,
  rank: 42,
};

const KPI_CARDS = [
  {
    icon: '◎',
    label: 'Challenges Solved',
    value: '38',
    change: '+2 this week',
    changeType: 'up',
    color: 'var(--green)',
    barWidth: '79%',
  },
  {
    icon: '◇',
    label: 'Global Rank',
    value: '#42',
    change: '↑ 3 positions',
    changeType: 'up',
    color: 'var(--cyan)',
    barWidth: '91%',
  },
  {
    icon: '★',
    label: 'Total Points',
    value: '4,850',
    change: '+847 this week',
    changeType: 'up',
    color: 'var(--warn)',
    barWidth: '48%',
  },
  {
    icon: '⊕',
    label: 'Win Rate',
    value: '74%',
    change: '−2% vs last week',
    changeType: 'down',
    color: 'var(--purple)',
    barWidth: '74%',
  },
];

const RECENT_ACTIVITY = [
  {
    id: 'crud-master',
    title: 'CRUD MASTER',
    difficulty: 'easy',
    category: 'CRUD',
    score: 847,
    maxScore: 1000,
    status: 'completed',
    statusLabel: 'Solved',
    statusColor: 'var(--green)',
    dotColor: 'var(--green)',
    time: '2d',
  },
  {
    id: 'auth-fortress',
    title: 'AUTH FORTRESS',
    difficulty: 'medium',
    category: 'Auth',
    score: 612,
    maxScore: 1500,
    status: 'attempted',
    statusLabel: 'In Progress',
    statusColor: 'var(--warn)',
    scoreFill: 'linear-gradient(90deg,var(--warn),#ff6b00)',
    dotColor: 'var(--warn)',
    time: '3d',
  },
  {
    id: 'query-builder',
    title: 'QUERY BUILDER',
    difficulty: 'easy',
    category: 'REST',
    score: 920,
    maxScore: 1000,
    status: 'completed',
    statusLabel: 'Solved',
    statusColor: 'var(--green)',
    dotColor: 'var(--green)',
    time: '5d',
  },
  {
    id: 'rest-architect',
    title: 'REST ARCHITECT',
    difficulty: 'medium',
    category: 'Design',
    score: 780,
    maxScore: 1500,
    status: 'attempted',
    statusLabel: 'In Progress',
    statusColor: 'var(--warn)',
    scoreFill: 'linear-gradient(90deg,var(--warn),#ff6b00)',
    dotColor: 'var(--warn)',
    time: '6d',
  },
  {
    id: 'speed-demon',
    title: 'SPEED DEMON',
    difficulty: 'hard',
    category: 'Performance',
    score: null,
    maxScore: 2500,
    status: 'failed',
    statusLabel: 'Failed',
    statusColor: 'var(--red)',
    dotColor: 'var(--red)',
    time: '1w',
  },
];

const LEADERBOARD = [
  { rank: 1,  username: 'CodeX_Dev',   pts: 12847, hex: 'CX', color: 'var(--cyan)',   rankClass: 'ch-rank-gold' },
  { rank: 2,  username: 'n1nja_net',   pts: 11761, hex: 'NN', color: 'var(--purple)', rankClass: 'ch-rank-silver' },
  { rank: 3,  username: 'api_wizard',  pts: 10943, hex: 'AW', color: 'var(--green)',  rankClass: 'ch-rank-bronze' },
  { rank: 4,  username: 'ByteKnight',  pts:  9688, hex: 'BK', color: 'var(--warn)',   rankClass: 'ch-rank-other' },
  { rank: 5,  username: 'HTTP_Hero',   pts:  8592, hex: 'HH', color: 'var(--red)',    rankClass: 'ch-rank-other' },
  { rank: 42, username: 'EXPLORADOR',  pts:  4850, hex: 'ED', color: 'var(--cyan)',   rankClass: 'ch-rank-other', isMe: true },
];
const MAX_LB_PTS = 12847;

const CAT_PROGRESS = [
  { cat: 'REST',     pct: 65, color: 'var(--cyan)' },
  { cat: 'CRUD',     pct: 80, color: 'var(--green)' },
  { cat: 'Auth',     pct: 40, color: 'var(--warn)' },
  { cat: 'Perf',     pct: 20, color: 'var(--red)' },
  { cat: 'Security', pct: 10, color: 'var(--purple)' },
];

const STREAK_DAYS = [true, true, true, true, true, true, false];
const DAY_LABELS  = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const STREAK_COUNT = 6;

const RECOMMENDED = [
  {
    id: 'zero-trust',
    title: 'ZERO TRUST',
    difficulty: 'hard',
    diffClass: 'ch-badge-hard',
    category: 'Security',
    points: 2500,
    color: 'var(--red)',
    reason: 'Next in Security path',
  },
  {
    id: 'cache-king',
    title: 'CACHE KING',
    difficulty: 'medium',
    diffClass: 'ch-badge-medium',
    category: 'Cache',
    points: 1500,
    color: 'var(--warn)',
    reason: 'Hot this week',
    isNew: true,
  },
  {
    id: 'real-time-coliseum',
    title: 'REAL-TIME COLISEUM',
    difficulty: 'expert',
    diffClass: 'ch-badge-expert',
    category: 'WebSocket',
    points: 4000,
    color: 'var(--purple)',
    reason: 'Highest payout available',
  },
];

const DIFF_DOT_COLOR = { easy: 'var(--green)', medium: 'var(--warn)', hard: 'var(--red)', expert: 'var(--purple)' };

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── Cursor ────────────────────────────────────────────── */
  useEffect(() => {
    const dot  = document.getElementById('db-dot');
    const ring = document.getElementById('db-ring');
    if (!dot || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    let animId;

    const onMove = e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = `${mx}px`;
      dot.style.top  = `${my}px`;
    };
    const animRing = () => {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      ring.style.left = `${rx}px`;
      ring.style.top  = `${ry}px`;
      animId = requestAnimationFrame(animRing);
    };
    animId = requestAnimationFrame(animRing);
    document.addEventListener('mousemove', onMove);

    const hoverEls = document.querySelectorAll('button, a, .db-rec-card, .db-activity-row, .db-kpi-card, select, input');
    const onEnter = () => {
      ring.style.width  = '42px';
      ring.style.height = '42px';
      ring.style.borderColor = 'rgba(0,217,255,0.8)';
      dot.style.background   = '#ffffff';
    };
    const onLeave = () => {
      ring.style.width  = '28px';
      ring.style.height = '28px';
      ring.style.borderColor = 'rgba(0,217,255,0.5)';
      dot.style.background   = 'var(--cyan)';
    };
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animId);
      hoverEls.forEach(el => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="challenges-page">
      <div className="ch-cursor-dot" id="db-dot" />
      <div className="ch-cursor-ring" id="db-ring" />
      <div className="ch-grid-bg" />

      <div className="ch-layout">
        <Topbar
          onMenuToggle={() => setSidebarOpen(s => !s)}
          sidebarOpen={sidebarOpen}
        />

        {/* Overlay backdrop (tablet/mobile) */}
        <div
          className={`ch-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* ── SIDEBAR ─────────────────────────────────────── */}
        <aside className={`ch-sidebar${sidebarOpen ? ' open' : ''}`}>

          {/* Profile card */}
          <div className="db-profile-wrap">
            <div className="db-avatar">{USER.initials}</div>
            <div className="db-profile-name">{USER.name}</div>
            <div className="db-profile-sub">{USER.role}</div>
            <div className="db-elo-badge">
              <span className="db-elo-dot" />
              ELO {USER.elo}
            </div>
          </div>

          {/* Quick stats 2×2 */}
          <div className="ch-sidebar-section" style={{ paddingBottom: 0 }}>
            <div className="ch-sidebar-label">Combat Stats</div>
            <div className="db-quick-stats">
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: 'var(--cyan)' }}>#{USER.rank}</div>
                <div className="db-qs-label">Rank</div>
              </div>
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: 'var(--green)' }}>38</div>
                <div className="db-qs-label">Solved</div>
              </div>
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: 'var(--purple)' }}>74%</div>
                <div className="db-qs-label">Win Rate</div>
              </div>
              <div className="db-qs-cell">
                <div className="db-qs-val" style={{ color: 'var(--warn)' }}>{STREAK_COUNT}</div>
                <div className="db-qs-label">Streak</div>
              </div>
            </div>
          </div>

          {/* Category progress */}
          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">Category Progress</div>
            {CAT_PROGRESS.map(({ cat, pct, color }) => (
              <div className="db-cat-row" key={cat}>
                <div className="db-cat-header">
                  <span>{cat}</span>
                  <span className="db-cat-pct">{pct}%</span>
                </div>
                <div className="db-cat-track">
                  <div
                    className="db-cat-fill"
                    style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Active challenge widget */}
          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">Currently Active</div>
            <div
              style={{
                background: 'var(--bg3)',
                border: '1px solid rgba(255,184,0,0.3)',
                padding: '12px',
                cursor: 'none',
              }}
              onClick={() => navigate('/challenges/auth-fortress')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span className="ch-badge ch-badge-medium" style={{ cursor: 'none' }}>Medium</span>
                <span className="ch-badge ch-badge-cat">Auth</span>
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 15,
                textTransform: 'uppercase', color: 'var(--white)', marginBottom: 8, lineHeight: 1,
              }}>
                AUTH FORTRESS
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', marginBottom: 4,
                }}>
                  <span>Best attempt</span>
                  <span style={{ color: 'var(--warn)' }}>612 / 1500</span>
                </div>
                <div className="db-cat-track">
                  <div style={{
                    height: '100%', width: '40.8%',
                    background: 'linear-gradient(90deg,var(--warn),#ff6b00)',
                  }} />
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)',
                letterSpacing: '0.5px',
              }}>
                89 submissions · 34 solved
              </div>
            </div>
          </div>

        </aside>

        {/* ── MAIN CONTENT ────────────────────────────────── */}
        <main className="ch-main">

          {/* Page header */}
          <div className="ch-page-header" style={{ marginBottom: 28 }}>
            <div>
              <div className="db-page-eyebrow">// Your Command Center</div>
              <h1 className="db-page-title">
                Welcome back, <em>{USER.name}</em>
              </h1>
              <div className="db-page-sub">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                &nbsp;·&nbsp; 12 new challenges since your last visit
              </div>
            </div>
            <div className="db-header-actions">
              <Link to="/challenges" className="db-btn db-btn-primary">
                ⚔ Enter Arena
              </Link>
              <Link to="/profile" className="db-btn">
                View Profile
              </Link>
            </div>
          </div>

          {/* KPI stat cards */}
          <div className="db-kpi-grid">
            {KPI_CARDS.map(card => (
              <div
                key={card.label}
                className="db-kpi-card"
                style={{ '--kpi-color': card.color }}
              >
                <div className="db-kpi-top">
                  <span className="db-kpi-icon">{card.icon}</span>
                  <span className={`db-kpi-change ${card.changeType}`}>{card.change}</span>
                </div>
                <div className="db-kpi-val">{card.value}</div>
                <div className="db-kpi-label">{card.label}</div>
                <div className="db-kpi-bar" style={{ width: card.barWidth }} />
              </div>
            ))}
          </div>

          {/* Activity + right panel */}
          <div className="db-content-grid">

            {/* Recent activity */}
            <div className="db-panel">
              <div className="db-panel-head">
                <div className="db-panel-title">
                  <span className="db-live-dot" />
                  Recent Activity
                </div>
                <Link to="/submissions" className="db-panel-action">View all →</Link>
              </div>

              {/* Table header */}
              <div className="db-table-header">
                <div style={{ width: 6, flexShrink: 0 }} />
                <div className="db-th db-th-challenge">Challenge</div>
                <div className="db-th db-th-score">Score</div>
                <div className="db-th db-th-status">Status</div>
                <div className="db-th db-th-time">When</div>
              </div>

              {RECENT_ACTIVITY.map(row => {
                const pct = row.score !== null ? ((row.score / row.maxScore) * 100).toFixed(1) : 0;
                return (
                  <div
                    key={row.id}
                    className="db-activity-row"
                    onClick={() => navigate(`/challenges/${row.id}`)}
                  >
                    <div
                      className="db-row-dot"
                      style={{ background: row.dotColor, boxShadow: `0 0 5px ${row.dotColor}` }}
                    />
                    <div className="db-row-info">
                      <div className="db-row-title">{row.title}</div>
                      <div className="db-row-meta">
                        <span>{row.difficulty}</span>
                        <span style={{ color: 'var(--dim)' }}>·</span>
                        <span>{row.category}</span>
                      </div>
                    </div>
                    <div className="db-row-score">
                      {row.score !== null ? (
                        <>
                          <div className="db-row-score-label">
                            <span>{row.score}</span>
                            <span>/{row.maxScore}</span>
                          </div>
                          <div className="db-row-track">
                            <div
                              className="db-row-fill"
                              style={{
                                width: `${pct}%`,
                                ...(row.scoreFill ? { background: row.scoreFill } : {}),
                              }}
                            />
                          </div>
                        </>
                      ) : (
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9,
                          color: 'var(--muted)', letterSpacing: 1,
                        }}>
                          — / {row.maxScore}
                        </div>
                      )}
                    </div>
                    <div className="db-row-status" style={{ color: row.statusColor }}>
                      {row.statusLabel}
                    </div>
                    <div className="db-row-time">{row.time}</div>
                  </div>
                );
              })}
            </div>

            {/* Right column */}
            <div className="db-right-stack">

              {/* Leaderboard */}
              <div className="db-panel">
                <div className="db-panel-head">
                  <div className="db-panel-title">Global Leaderboard</div>
                  <Link to="/leaderboard" className="db-panel-action">Full →</Link>
                </div>
                {LEADERBOARD.map(entry => (
                  <div
                    key={entry.rank}
                    className={`db-lb-row${entry.isMe ? ' db-lb-me' : ''}`}
                  >
                    <span className={`db-lb-rank ${entry.rankClass}`}>{entry.rank}</span>
                    <div
                      className="db-lb-hex"
                      style={{ background: `linear-gradient(135deg, ${entry.color}, var(--bg3))` }}
                    >
                      {entry.hex}
                    </div>
                    <span className="db-lb-name">{entry.isMe ? 'YOU' : entry.username}</span>
                    <span className="db-lb-pts">{entry.pts.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Streak widget */}
              <div className="db-panel">
                <div className="db-panel-head">
                  <div className="db-panel-title">Combat Streak</div>
                </div>
                <div className="db-streak-body">
                  <div className="db-streak-top">
                    <div className="db-streak-num">{STREAK_COUNT}</div>
                    <div className="db-streak-unit">day streak</div>
                  </div>
                  <div className="db-streak-grid">
                    {STREAK_DAYS.map((active, i) => (
                      <div
                        key={i}
                        className={`db-streak-dot${active ? (i === STREAK_COUNT - 1 ? ' today' : ' active') : ''}`}
                      />
                    ))}
                  </div>
                  <div className="db-streak-days">
                    {DAY_LABELS.map(d => (
                      <div key={d} className="db-streak-day-label">{d}</div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Recommended challenges */}
          <div>
            <div className="db-rec-head">
              <div className="db-rec-title">Next Battles</div>
              <Link to="/challenges" className="db-panel-action">Browse all →</Link>
            </div>
            <div className="db-rec-grid">
              {RECOMMENDED.map(rc => (
                <div
                  key={rc.id}
                  className="db-rec-card"
                  style={{ '--rc-color': rc.color }}
                  onClick={() => navigate(`/challenges/${rc.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`ch-badge ${rc.diffClass}`} style={{ cursor: 'none' }}>
                      {rc.difficulty}
                    </span>
                    <span className="ch-badge ch-badge-cat">{rc.category}</span>
                    {rc.isNew && <span className="ch-badge ch-badge-new">New</span>}
                  </div>
                  <div className="db-rec-card-title">{rc.title}</div>
                  <div className="db-rec-card-meta">
                    <div>
                      <div className="db-rec-card-pts">{rc.points.toLocaleString()}</div>
                      <div className="db-rec-pts-label">POINTS</div>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 8,
                      color: 'var(--muted)', letterSpacing: '0.5px',
                      textAlign: 'right', maxWidth: 100,
                    }}>
                      {rc.reason}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

      <BottomNav />
    </div>
  );
}
