import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import './challenges.css';

/* ============================================================
   MOCK DATA
   ============================================================ */
const CHALLENGES_DATA = [
  {
    id: 'hyperion-gateway',
    featured: true,
    title: 'HYPERION GATEWAY',
    difficulty: 'expert',
    category: 'Performance',
    isNew: true,
    description:
      'Build a high-performance API gateway capable of handling 10,000 concurrent requests with sub-5ms p99 latency. Implement rate limiting, circuit breaking, and dynamic load balancing. The hardest challenge on the platform.',
    skills: ['Nginx', 'Load Balancing', 'Circuit Breaker', 'Rate Limiting', '10k RPS'],
    submissions: 12,
    solved: 3,
    avgTime: '~6h',
    points: 5000,
    status: null,
    glow: 'ch-glow-warn',
    accentColor: 'var(--warn)',
    scoreDimensions: [
      { label: 'Correctness', value: 97, color: 'var(--cyan)' },
      { label: 'Performance', value: 88, color: 'var(--purple)' },
      { label: 'REST Design', value: 94, color: 'var(--green)' },
      { label: 'AI Review',   value: 91, color: 'var(--warn)' },
    ],
    leaderboard: [
      { rank: 1, username: 'CodeX_Dev',  score: 987 },
      { rank: 2, username: 'n1nja_net',  score: 961 },
      { rank: 3, username: 'api_wizard', score: 943 },
    ],
  },
  {
    id: 'crud-master',
    title: 'CRUD MASTER',
    difficulty: 'easy',
    category: 'CRUD',
    description:
      'Build a RESTful API with full CRUD operations for a task manager. Includes pagination, filtering, and input validation.',
    skills: ['REST', 'Validation', 'Pagination'],
    submissions: 142,
    solved: 98,
    points: 1000,
    status: 'completed',
    bestScore: 847,
    maxScore: 1000,
    statusIcon: '✓',
    statusIconColor: 'var(--green)',
    statusTip: 'Completed · Score 847',
    ptsColor: 'var(--green)',
    glow: 'ch-glow-green',
    accentColor: 'var(--green)',
  },
  {
    id: 'auth-fortress',
    title: 'AUTH FORTRESS',
    difficulty: 'medium',
    category: 'Auth',
    description:
      'Implement a complete JWT authentication system with refresh token rotation, rate limiting, and role-based access control.',
    skills: ['JWT', 'RBAC', 'Rate Limit', 'Redis'],
    submissions: 89,
    solved: 34,
    points: 1500,
    status: 'attempted',
    bestScore: 612,
    maxScore: 1500,
    scoreFill: 'linear-gradient(90deg,var(--warn),#ff6b00)',
    scoreValColor: 'var(--warn)',
    statusIcon: '⟳',
    statusIconColor: 'var(--warn)',
    statusTip: 'Attempted · Best: 612',
    glow: 'ch-glow-warn',
    accentColor: 'var(--warn)',
  },
  {
    id: 'speed-demon',
    title: 'SPEED DEMON',
    difficulty: 'hard',
    category: 'Performance',
    description:
      'Optimize your API to handle over 1000 RPS with average latency below 10ms. Stress tested with JMeter at scale.',
    skills: ['Caching', 'Connection Pool', '1000 RPS'],
    submissions: 67,
    solved: 12,
    avgTime: '~4h',
    points: 2500,
    status: null,
    statusIcon: '–',
    statusIconColor: 'var(--muted)',
    statusTip: 'Not attempted',
    glow: 'ch-glow-red',
    accentColor: 'var(--red)',
  },
  {
    id: 'hello-endpoint',
    title: 'HELLO ENDPOINT',
    difficulty: 'easy',
    category: 'REST',
    description:
      'Your first API challenge. Create a simple REST endpoint that returns structured JSON with proper HTTP status codes and headers.',
    skills: ['HTTP', 'JSON', 'Status Codes'],
    submissions: 310,
    solved: 290,
    points: 500,
    status: null,
    glow: 'ch-glow-green',
    accentColor: 'var(--green)',
  },
  {
    id: 'cache-king',
    title: 'CACHE KING',
    difficulty: 'medium',
    category: 'Cache',
    isNew: true,
    description:
      'Implement multi-layer caching with Redis. Your API must handle cache invalidation, TTL strategies, and cache stampede prevention.',
    skills: ['Redis', 'Cache-Control', 'ETag'],
    submissions: 43,
    solved: 18,
    points: 1500,
    status: null,
    glow: 'ch-glow-warn',
    accentColor: 'var(--warn)',
  },
  {
    id: 'real-time-coliseum',
    title: 'REAL-TIME COLISEUM',
    difficulty: 'expert',
    category: 'WS',
    description:
      'Build a WebSocket server supporting 500 concurrent connections with rooms, presence detection, and message persistence.',
    skills: ['WebSocket', 'STOMP', '500 CCU', 'Presence'],
    submissions: 21,
    solved: 4,
    avgTime: '~8h',
    points: 4000,
    status: null,
    statusIcon: '–',
    statusIconColor: 'var(--muted)',
    ptsColor: 'var(--purple)',
    glow: 'ch-glow-purple',
    accentColor: 'var(--purple)',
  },
  {
    id: 'query-builder',
    title: 'QUERY BUILDER',
    difficulty: 'easy',
    category: 'REST',
    description:
      'Design a flexible query API with filtering, sorting, and pagination. Must follow OpenAPI 3.0 specification.',
    skills: ['OpenAPI', 'Filtering', 'HATEOAS'],
    submissions: 118,
    solved: 76,
    points: 1000,
    status: 'completed',
    bestScore: 920,
    maxScore: 1000,
    statusIcon: '✓',
    statusIconColor: 'var(--green)',
    statusTip: 'Completed · Score 920',
    ptsColor: 'var(--green)',
    glow: 'ch-glow-green',
    accentColor: 'var(--green)',
  },
  {
    id: 'zero-trust',
    title: 'ZERO TRUST',
    difficulty: 'hard',
    category: 'Security',
    description:
      'Implement a zero-trust API security model: mTLS, API key rotation, request signing (HMAC), and anomaly detection.',
    skills: ['mTLS', 'HMAC', 'API Keys', 'Anomaly'],
    submissions: 38,
    solved: 9,
    points: 2500,
    status: null,
    glow: 'ch-glow-red',
    accentColor: 'var(--red)',
  },
  {
    id: 'rest-architect',
    title: 'REST ARCHITECT',
    difficulty: 'medium',
    category: 'Design',
    description:
      'Score 95+ in REST design analysis. Implement proper resource naming, versioning, error responses, and hypermedia links.',
    skills: ['HATEOAS', 'Versioning', 'Error Schema'],
    submissions: 72,
    solved: 29,
    points: 1500,
    status: 'attempted',
    bestScore: 780,
    maxScore: 1500,
    scoreFill: 'linear-gradient(90deg,var(--warn),#ff6b00)',
    scoreValColor: 'var(--warn)',
    statusIcon: '⟳',
    statusIconColor: 'var(--warn)',
    statusTip: 'Attempted · Best: 780',
    glow: 'ch-glow-cyan',
    accentColor: 'var(--cyan)',
  },
];

const ALL_CATS = ['All', 'REST', 'CRUD', 'Auth', 'Performance', 'Cache', 'Design', 'Security', 'WS'];

const RANK_CLASS = ['ch-rank-gold', 'ch-rank-silver', 'ch-rank-bronze'];

/* ============================================================
   FEATURED CARD
   ============================================================ */
function FeaturedCard({ challenge }) {
  const navigate = useNavigate();
  const { accentColor, scoreDimensions, leaderboard } = challenge;

  return (
    <div
      className={`ch-card ch-card-featured ${challenge.glow}`}
      style={{ '--accent-color': accentColor }}
      onClick={() => navigate(`/challenges/${challenge.id}`)}
    >
      <div className="ch-card-accent" style={{ background: accentColor }} />
      <div className="ch-card-inner">
        {/* Left column */}
        <div className="ch-card-left">
          <div className="ch-featured-badge">
            <span className="ch-featured-dot" />
            Weekly Featured
          </div>

          <div className="ch-card-tags" style={{ marginBottom: 10 }}>
            <span className="ch-badge ch-badge-expert">Expert</span>
            <span className="ch-badge ch-badge-cat">{challenge.category}</span>
            {challenge.isNew && <span className="ch-badge ch-badge-new">New</span>}
          </div>

          <div className="ch-card-title" style={{ fontSize: 36, marginBottom: 10 }}>
            {challenge.title}
          </div>
          <div className="ch-card-desc" style={{ fontSize: 11, maxWidth: 480 }}>
            {challenge.description}
          </div>

          <div className="ch-card-skills" style={{ marginBottom: 18 }}>
            {challenge.skills.map(s => (
              <span key={s} className="ch-skill-tag">{s}</span>
            ))}
          </div>

          <div className="ch-card-footer" style={{ width: '100%' }}>
            <div className="ch-card-meta">
              <div className="ch-meta-item">
                <span className="ch-meta-icon">◎</span> {challenge.submissions} submissions
              </div>
              {challenge.avgTime && (
                <div className="ch-meta-item">
                  <span className="ch-meta-icon">◷</span> {challenge.avgTime} avg
                </div>
              )}
              <div className="ch-meta-item">
                <span className="ch-meta-icon">✓</span> {challenge.solved} solved
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="ch-card-pts">{challenge.points.toLocaleString()}</div>
              <div className="ch-pts-label">POINTS</div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="ch-card-right">
          <div>
            <div className="ch-lb-mini-title">Top Scores</div>
            <div className="ch-score-breakdown">
              {scoreDimensions.map(dim => (
                <div key={dim.label} className="ch-score-dim">
                  <span className="ch-score-dim-label">{dim.label}</span>
                  <div className="ch-score-dim-bar">
                    <div
                      className="ch-score-dim-fill"
                      style={{ width: `${dim.value}%`, background: dim.color }}
                    />
                  </div>
                  <span className="ch-score-dim-val" style={{ color: dim.color }}>
                    {dim.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="ch-lb-mini-title">Leaderboard</div>
            {leaderboard.map((entry, i) => (
              <div key={entry.rank} className="ch-lb-mini-row">
                <span className={`ch-lb-rank-num ${RANK_CLASS[i] ?? 'ch-rank-other'}`}>
                  {entry.rank}
                </span>
                <span className="ch-lb-username">{entry.username}</span>
                <span className="ch-lb-score-mini">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CHALLENGE CARD
   ============================================================ */
function ChallengeCard({ challenge }) {
  const navigate = useNavigate();
  const {
    id, title, difficulty, category, isNew,
    description, skills, submissions, solved, avgTime, points,
    status, bestScore, maxScore, scoreFill, scoreValColor,
    statusIcon, statusIconColor, statusTip, ptsColor,
    glow, accentColor,
  } = challenge;

  const diffBadgeClass = {
    easy:   'ch-badge-easy',
    medium: 'ch-badge-medium',
    hard:   'ch-badge-hard',
    expert: 'ch-badge-expert',
  }[difficulty] ?? 'ch-badge-cat';

  const hasScore = bestScore !== undefined && maxScore !== undefined;
  const scorePct = hasScore ? ((bestScore / maxScore) * 100).toFixed(1) : null;

  return (
    <div
      className={`ch-card ${glow} ${status === 'completed' ? 'ch-completed' : ''}`}
      style={{ '--accent-color': accentColor }}
      onClick={() => navigate(`/challenges/${id}`)}
    >
      <div className="ch-card-accent" style={{ background: accentColor }} />
      <div className="ch-card-inner">
        <div className="ch-card-head">
          <div className="ch-card-tags">
            <span className={`ch-badge ${diffBadgeClass}`}>{difficulty}</span>
            <span className="ch-badge ch-badge-cat">{category}</span>
            {isNew && <span className="ch-badge ch-badge-new">New</span>}
          </div>
          {statusIcon && (
            <div
              className="ch-card-status-icon"
              style={{ color: statusIconColor ?? 'var(--muted)' }}
              data-tip={statusTip}
            >
              {statusIcon}
            </div>
          )}
        </div>

        <div className="ch-card-title">{title}</div>
        <div className="ch-card-desc">{description}</div>

        <div className="ch-card-skills">
          {skills.map(s => (
            <span key={s} className="ch-skill-tag">{s}</span>
          ))}
        </div>

        {hasScore && (
          <div className="ch-card-score-bar">
            <div className="ch-score-bar-label">
              <span>Your best score</span>
              <span style={{ color: scoreValColor ?? 'var(--cyan)' }}>
                {bestScore} / {maxScore}
              </span>
            </div>
            <div className="ch-score-track">
              <div
                className="ch-score-fill"
                style={{
                  width: `${scorePct}%`,
                  ...(scoreFill ? { background: scoreFill, boxShadow: 'none' } : {}),
                }}
              />
            </div>
          </div>
        )}

        <div className="ch-card-footer">
          <div className="ch-card-meta">
            <div className="ch-meta-item">
              <span className="ch-meta-icon">◎</span> {submissions}
            </div>
            <div className="ch-meta-item">
              <span className="ch-meta-icon">✓</span> {solved} solved
            </div>
            {avgTime && (
              <div className="ch-meta-item">
                <span className="ch-meta-icon">◷</span> {avgTime}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              className="ch-card-pts"
              style={ptsColor ? { color: ptsColor } : undefined}
            >
              {points.toLocaleString()}
            </div>
            <div className="ch-pts-label">POINTS</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function Challenges() {
  const [search, setSearch]           = useState('');
  const [diffFilter, setDiffFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [catFilter, setCatFilter]     = useState('all');
  const [sortBy, setSortBy]           = useState('featured');
  const [viewMode, setViewMode]       = useState('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── Cursor effect ─────────────────────────────────────── */
  useEffect(() => {
    const dot  = document.getElementById('ch-dot');
    const ring = document.getElementById('ch-ring');
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

    const hoverEls = document.querySelectorAll('button, a, .ch-card, select, input');
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

  /* ── Derived data ──────────────────────────────────────── */
  const featured  = CHALLENGES_DATA.find(c => c.featured);
  const regular   = CHALLENGES_DATA.filter(c => !c.featured);

  const diffCounts = useMemo(() => {
    const all = CHALLENGES_DATA.filter(c => !c.featured);
    return {
      all:    all.length,
      easy:   all.filter(c => c.difficulty === 'easy').length,
      medium: all.filter(c => c.difficulty === 'medium').length,
      hard:   all.filter(c => c.difficulty === 'hard').length,
      expert: all.filter(c => c.difficulty === 'expert').length,
    };
  }, []);

  const statusCounts = useMemo(() => {
    const all = regular;
    return {
      all:       all.length,
      unsolved:  all.filter(c => !c.status).length,
      attempted: all.filter(c => c.status === 'attempted').length,
      completed: all.filter(c => c.status === 'completed').length,
    };
  }, [regular]);

  const completedChallenges = regular.filter(c => c.status === 'completed');
  const attemptedCount      = regular.filter(c => c.status === 'attempted').length;
  const totalPts            = completedChallenges.reduce((acc, c) => acc + (c.bestScore ?? 0), 0);
  const progressPct         = Math.round((completedChallenges.length / regular.length) * 100);

  const filtered = useMemo(() => {
    let list = regular;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
    if (diffFilter !== 'all')   list = list.filter(c => c.difficulty === diffFilter);
    if (statusFilter !== 'all') list = list.filter(c => (c.status ?? 'unsolved') === statusFilter);
    if (catFilter !== 'all')    list = list.filter(c => c.category.toLowerCase() === catFilter.toLowerCase());

    switch (sortBy) {
      case 'newest':   return [...list].reverse();
      case 'hardest':  return [...list].sort((a, b) => {
        const order = { expert: 4, hard: 3, medium: 2, easy: 1 };
        return (order[b.difficulty] ?? 0) - (order[a.difficulty] ?? 0);
      });
      case 'mostSolved': return [...list].sort((a, b) => b.solved - a.solved);
      case 'highestPts': return [...list].sort((a, b) => b.points - a.points);
      default: return list;
    }
  }, [regular, search, diffFilter, statusFilter, catFilter, sortBy]);

  const diffLabel = diffFilter === 'all'
    ? 'ALL DIFFICULTIES'
    : diffFilter.toUpperCase();

  const catLabel = catFilter === 'all'
    ? 'ALL CATEGORIES'
    : catFilter.toUpperCase();

  const statusLabel = statusFilter === 'all' ? null : statusFilter.toUpperCase();

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="challenges-page">
      <div className="ch-cursor-dot" id="ch-dot" />
      <div className="ch-cursor-ring" id="ch-ring" />
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

        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className={`ch-sidebar${sidebarOpen ? ' open' : ''}`}>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">Search</div>
            <div className="ch-search-wrap">
              <span className="ch-search-icon">/</span>
              <input
                type="text"
                className="ch-search-input"
                placeholder="challenge name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">Difficulty</div>
            {[
              { val: 'all',    label: 'All difficulties', dot: null },
              { val: 'easy',   label: 'Easy',   dot: 'green' },
              { val: 'medium', label: 'Medium', dot: 'yellow' },
              { val: 'hard',   label: 'Hard',   dot: 'red' },
              { val: 'expert', label: 'Expert', dot: 'purple' },
            ].map(({ val, label, dot }) => (
              <button
                key={val}
                className={`ch-filter-btn${diffFilter === val ? ' ch-active' : ''}`}
                onClick={() => setDiffFilter(val)}
              >
                <span className="ch-filter-label-inner">
                  {dot && <span className={`ch-filter-dot ${dot}`} />}
                  {label}
                </span>
                <span className="ch-filter-count">{diffCounts[val]}</span>
              </button>
            ))}
          </div>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">Status</div>
            {[
              { val: 'all',       label: 'All' },
              { val: 'unsolved',  label: 'Unsolved' },
              { val: 'attempted', label: 'Attempted' },
              { val: 'completed', label: 'Completed' },
            ].map(({ val, label }) => (
              <button
                key={val}
                className={`ch-filter-btn${statusFilter === val ? ' ch-active' : ''}`}
                onClick={() => setStatusFilter(val)}
              >
                <span>{label}</span>
                <span className="ch-filter-count">{statusCounts[val]}</span>
              </button>
            ))}
          </div>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">Category</div>
            <div className="ch-cat-grid">
              {ALL_CATS.map(cat => {
                const val = cat === 'All' ? 'all' : cat;
                return (
                  <button
                    key={cat}
                    className={`ch-cat-tag${catFilter === val ? ' ch-active' : ''}`}
                    onClick={() => setCatFilter(val)}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">My Progress</div>
            <div className="ch-stat-row">
              <span className="ch-stat-row-label">Completed</span>
              <span className="ch-stat-row-val green">{completedChallenges.length}</span>
            </div>
            <div className="ch-stat-row">
              <span className="ch-stat-row-label">Attempted</span>
              <span className="ch-stat-row-val warn">{attemptedCount}</span>
            </div>
            <div className="ch-stat-row">
              <span className="ch-stat-row-label">Best rank</span>
              <span className="ch-stat-row-val purple">#3</span>
            </div>
            <div className="ch-stat-row">
              <span className="ch-stat-row-label">Total pts</span>
              <span className="ch-stat-row-val">{totalPts.toLocaleString()}</span>
            </div>
            <div className="ch-progress-bar-wrap">
              <div className="ch-progress-label">
                <span>Overall progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="ch-progress-track">
                <div className="ch-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>

        </aside>

        {/* ── Main content ────────────────────────────────── */}
        <main className="ch-main">

          <div className="ch-page-header">
            <div>
              <div className="ch-page-eyebrow">
                // {diffCounts.all} challenges available
              </div>
              <h1 className="ch-page-title">
                Choose<em>Your Battle</em>
              </h1>
            </div>
            <div className="ch-page-controls">
              <select
                className="ch-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="featured">SORT: FEATURED</option>
                <option value="newest">SORT: NEWEST</option>
                <option value="hardest">SORT: HARDEST</option>
                <option value="mostSolved">SORT: MOST SOLVED</option>
                <option value="highestPts">SORT: HIGHEST PTS</option>
              </select>
              <div className="ch-view-toggle">
                <button
                  className={`ch-view-btn${viewMode === 'grid' ? ' ch-active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  ⊞
                </button>
                <button
                  className={`ch-view-btn${viewMode === 'list' ? ' ch-active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  ☰
                </button>
              </div>
            </div>
          </div>

          {/* Active filters bar */}
          <div className="ch-active-filters">
            <div className="ch-active-filter-tag">
              {diffLabel}
              {diffFilter !== 'all' && (
                <button className="ch-remove-btn" onClick={() => setDiffFilter('all')}>×</button>
              )}
            </div>
            <div className="ch-active-filter-tag">
              {catLabel}
              {catFilter !== 'all' && (
                <button className="ch-remove-btn" onClick={() => setCatFilter('all')}>×</button>
              )}
            </div>
            {statusLabel && (
              <div className="ch-active-filter-tag">
                {statusLabel}
                <button className="ch-remove-btn" onClick={() => setStatusFilter('all')}>×</button>
              </div>
            )}
            <span className="ch-results-count">
              <span>{filtered.length}</span> challenges found
            </span>
          </div>

          {/* Grid */}
          <div className="ch-challenges-grid">
            {featured && <FeaturedCard challenge={featured} />}

            {filtered.length === 0 ? (
              <div className="ch-empty-state">
                <div className="ch-empty-glyph">404</div>
                <div className="ch-empty-text">No challenges match your filters</div>
              </div>
            ) : (
              filtered.map(c => <ChallengeCard key={c.id} challenge={c} />)
            )}
          </div>

          <div className="ch-load-more-wrap">
            <button className="ch-load-more-btn">LOAD MORE CHALLENGES →</button>
          </div>

        </main>
      </div>

      <BottomNav />
    </div>
  );
}
