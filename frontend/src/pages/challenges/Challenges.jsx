import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import * as challengesApi from '../../lib/challengesApi';
import './challenges.css';

/* ============================================================
   MAP API RESPONSE TO CARD FORMAT
   ============================================================ */
function mapApiToCard(api) {
  const diff = (api.difficulty || 'EASY').toLowerCase();
  const glowMap = { easy: 'ch-glow-green', medium: 'ch-glow-warn', hard: 'ch-glow-red', expert: 'ch-glow-purple' };
  const accentMap = { easy: 'var(--green)', medium: 'var(--warn)', hard: 'var(--red)', expert: 'var(--purple)' };
  return {
    id: api.id,
    slug: api.slug,
    title: api.title || 'Sin título',
    difficulty: diff,
    category: api.category || 'General',
    description: api.description || '',
    skills: api.category ? [api.category] : [],
    submissions: api.timesAttempted ?? 0,
    solved: api.timesCompleted ?? 0,
    points: api.maxScore ?? 1000,
    status: null,
    featured: api.featured ?? false,
    glow: glowMap[diff] ?? 'ch-glow-cyan',
    accentColor: accentMap[diff] ?? 'var(--cyan)',
  };
}

/* ============================================================
   CHALLENGE CARD
   ============================================================ */
function ChallengeCard({ challenge }) {
  const navigate = useNavigate();
  const {
    id, title, difficulty, category, isNew,
    description, skills = [], submissions, solved, avgTime, points,
    status, bestScore, maxScore, scoreFill, scoreValColor,
    statusIcon, statusIconColor, statusTip, ptsColor,
    glow, accentColor, featured,
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
      className={`ch-card ${glow} ${status === 'completed' ? 'ch-completed' : ''} ${featured ? 'ch-card-featured' : ''}`}
      style={{ '--accent-color': accentColor }}
      onClick={() => navigate(`/challenges/${id}`)}
    >
      <div className="ch-card-accent" style={{ background: accentColor }} />
      <div className="ch-card-inner">
        <div className="ch-card-head">
          <div className="ch-card-tags">
            <span className={`ch-badge ${diffBadgeClass}`}>{difficulty}</span>
            <span className="ch-badge ch-badge-cat">{category}</span>
            {featured && <span className="ch-badge ch-badge-new">Featured</span>}
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

        {skills?.length > 0 && (
          <div className="ch-card-skills">
            {skills.map(s => (
              <span key={s} className="ch-skill-tag">{s}</span>
            ))}
          </div>
        )}

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
              <span className="ch-meta-icon">◎</span> {submissions ?? 0}
            </div>
            <div className="ch-meta-item">
              <span className="ch-meta-icon">✓</span> {solved ?? 0} solved
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
              {(points ?? 0).toLocaleString()}
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

  const [challenges, setChallenges]   = useState([]);
  const [categories, setCategories]   = useState(['All']);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  /* ── Fetch challenges from backend ─────────────────────── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [list, cats] = await Promise.all([
          challengesApi.getChallenges({
            difficulty: diffFilter !== 'all' ? diffFilter.toUpperCase() : undefined,
            category: catFilter !== 'all' ? catFilter : undefined,
            search: search || undefined,
          }),
          challengesApi.getAllCategories(),
        ]);
        if (!cancelled) {
          setChallenges(Array.isArray(list) ? list.map(mapApiToCard) : []);
          setCategories(['All', ...(Array.isArray(cats) ? cats : [])]);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Error al cargar challenges');
          setChallenges([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [diffFilter, catFilter, search]);

  /* Cursor personalizado gestionado por <CustomCursor /> */

  /* ── Derived data ──────────────────────────────────────── */
  const diffCounts = useMemo(() => {
    return {
      all:    challenges.length,
      easy:   challenges.filter(c => c.difficulty === 'easy').length,
      medium: challenges.filter(c => c.difficulty === 'medium').length,
      hard:   challenges.filter(c => c.difficulty === 'hard').length,
      expert: challenges.filter(c => c.difficulty === 'expert').length,
    };
  }, [challenges]);

  const statusCounts = useMemo(() => {
    const unsolved = challenges.filter(c => !c.status).length;
    const attempted = challenges.filter(c => c.status === 'attempted').length;
    const completed = challenges.filter(c => c.status === 'completed').length;
    return {
      all:       challenges.length,
      unsolved,
      attempted,
      completed,
    };
  }, [challenges]);

  const completedChallenges = challenges.filter(c => c.status === 'completed');
  const attemptedCount      = challenges.filter(c => c.status === 'attempted').length;
  const totalPts            = completedChallenges.reduce((acc, c) => acc + (c.bestScore ?? 0), 0);
  const progressPct         = challenges.length ? Math.round((completedChallenges.length / challenges.length) * 100) : 0;

  const filtered = useMemo(() => {
    let list = [...challenges];
    if (statusFilter !== 'all') list = list.filter(c => (c.status ?? 'unsolved') === statusFilter);

    switch (sortBy) {
      case 'newest':   return [...list].reverse();
      case 'hardest':  return [...list].sort((a, b) => {
        const order = { expert: 4, hard: 3, medium: 2, easy: 1 };
        return (order[b.difficulty] ?? 0) - (order[a.difficulty] ?? 0);
      });
      case 'mostSolved': return [...list].sort((a, b) => (b.solved ?? 0) - (a.solved ?? 0));
      case 'highestPts': return [...list].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
      default: return list;
    }
  }, [challenges, statusFilter, sortBy]);

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
      <CustomCursor />
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
              {categories.map(cat => {
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
            {loading ? (
              <div className="ch-empty-state">
                <div className="ch-empty-glyph">...</div>
                <div className="ch-empty-text">Cargando challenges...</div>
              </div>
            ) : error ? (
              <div className="ch-empty-state">
                <div className="ch-empty-glyph">!</div>
                <div className="ch-empty-text">{error}</div>
                <div className="ch-empty-text" style={{ fontSize: 12, marginTop: 8 }}>
                  Comprueba que el challenge-service esté corriendo en http://localhost:8082
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="ch-empty-state">
                <div className="ch-empty-glyph">404</div>
                <div className="ch-empty-text">No hay challenges que coincidan con tus filtros</div>
              </div>
            ) : (
              filtered.map(c => <ChallengeCard key={c.id} challenge={c} />)
            )}
          </div>

        </main>
      </div>

      <BottomNav />
    </div>
  );
}
