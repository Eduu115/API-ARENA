import { useState, useMemo, useEffect } from 'react';
import { useNavigateLocalized } from '../../routes/LocaleLayout';
import { useTranslation } from 'react-i18next';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import * as challengesApi from '../../lib/challengesApi';
import './challenges.css';
import TutorialTour from '../../components/tutorial/TutorialTour';
import { DOCS_PATHS } from '../../tutorial/tourDefinitions';
import { useTourSteps } from '../../lib/tourSteps';
import { usePageMeta } from '../../lib/usePageMeta';
import ChallengeNewsletterBanner from '../../components/challenges/ChallengeNewsletterBanner';

function mapApiToCard(api) {
  const diff = (api.difficulty || 'EASY').toLowerCase();
  const glowMap = { easy: 'ch-glow-green', medium: 'ch-glow-warn', hard: 'ch-glow-red', expert: 'ch-glow-purple', extreme: 'ch-glow-extreme' };
  const accentMap = { easy: 'var(--green)', medium: 'var(--warn)', hard: 'var(--red)', expert: 'var(--purple)', extreme: 'var(--extreme)' };
  return {
    id: api.id,
    slug: api.slug,
    title: api.title || 'Untitled',
    difficulty: diff,
    category: api.category || 'General',
    description: api.description || '',
    skills: api.category ? [api.category] : [],
    submissions: api.timesAttempted ?? 0,
    solved: api.timesCompleted ?? 0,
    points: api.maxScore ?? 1000,
    status: null,
    featured: api.featured ?? false,
    origin: (api.origin || 'LEGACY').toUpperCase(),
    glow: glowMap[diff] ?? 'ch-glow-cyan',
    accentColor: accentMap[diff] ?? 'var(--cyan)',
  };
}

function ChallengeCard({ challenge, spotlight = false }) {
  const { t } = useTranslation('challenges');
  const navigate = useNavigateLocalized();
  const {
    id, title, difficulty, category, isNew,
    description, skills = [], submissions, solved, avgTime, points,
    status, bestScore, maxScore, scoreFill, scoreValColor,
    statusIcon, statusIconColor, statusTip, ptsColor,
    glow, accentColor, featured, origin,
  } = challenge;

  const diffBadgeClass = {
    easy:   'ch-badge-easy',
    medium: 'ch-badge-medium',
    hard:   'ch-badge-hard',
    expert: 'ch-badge-expert',
    extreme: 'ch-badge-extreme',
  }[difficulty] ?? 'ch-badge-cat';

  const hasScore = bestScore !== undefined && maxScore !== undefined;
  const scorePct = hasScore ? ((bestScore / maxScore) * 100).toFixed(1) : null;

  return (
    <div
      className={`ch-card ${glow} ${status === 'completed' ? 'ch-completed' : ''}${spotlight ? ' ch-card--spotlight' : ''}`}
      style={{ '--accent-color': accentColor }}
      onClick={() => navigate(`/challenges/${id}`)}
    >
      <div className="ch-card-accent" style={{ background: accentColor }} />
      <div className="ch-card-inner">
        <div className="ch-card-head">
          <div className="ch-card-tags">
            <span className={`ch-badge ${diffBadgeClass}`}>
              {['easy', 'medium', 'hard', 'expert', 'extreme'].includes(difficulty)
                ? t(`difficulty.${difficulty}`)
                : difficulty}
            </span>
            <span className="ch-badge ch-badge-cat">{category}</span>
            <span className={`ch-badge ${origin === 'COMMUNITY' ? 'ch-badge-community' : 'ch-badge-legacy'}`}>
              {origin === 'COMMUNITY' ? t('community') : t('legacy')}
            </span>
            {featured && <span className="ch-badge ch-badge-new">{t('featuredBadge')}</span>}
            {isNew && <span className="ch-badge ch-badge-new">{t('new')}</span>}
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
              <span className="ch-meta-icon">✓</span> {solved ?? 0} {t('solved')}
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
            <div className="ch-pts-label">{t('points')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Challenges() {
  const { t } = useTranslation('challenges');
  usePageMeta({
    title: t('pageTitle'),
    description: t('pageDescription'),
    path: '/challenges',
  });
  const tourSteps = useTourSteps('challenges');
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
          setError(e?.message || t('loadError'));
          setChallenges([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [diffFilter, catFilter, search, t]);

  const diffFilterOptions = useMemo(
    () => [
      { val: 'all', labelKey: 'difficulty.all', dot: null },
      { val: 'easy', labelKey: 'difficulty.easy', dot: 'green' },
      { val: 'medium', labelKey: 'difficulty.medium', dot: 'yellow' },
      { val: 'hard', labelKey: 'difficulty.hard', dot: 'red' },
      { val: 'expert', labelKey: 'difficulty.expert', dot: 'purple' },
      { val: 'extreme', labelKey: 'difficulty.extreme', dot: 'extreme' },
    ],
    [],
  );

  const statusFilterOptions = useMemo(
    () => [
      { val: 'all', labelKey: 'status.all' },
      { val: 'unsolved', labelKey: 'status.unsolved' },
      { val: 'attempted', labelKey: 'status.attempted' },
      { val: 'completed', labelKey: 'status.completed' },
    ],
    [],
  );

  const sortOptions = useMemo(
    () => [
      { val: 'featured', labelKey: 'sort.featured' },
      { val: 'newest', labelKey: 'sort.newest' },
      { val: 'hardest', labelKey: 'sort.hardest' },
      { val: 'mostSolved', labelKey: 'sort.mostSolved' },
      { val: 'highestPts', labelKey: 'sort.highestPts' },
    ],
    [],
  );

  const diffCounts = useMemo(() => {
    return {
      all:    challenges.length,
      easy:   challenges.filter(c => c.difficulty === 'easy').length,
      medium: challenges.filter(c => c.difficulty === 'medium').length,
      hard:   challenges.filter(c => c.difficulty === 'hard').length,
      expert: challenges.filter(c => c.difficulty === 'expert').length,
      extreme: challenges.filter(c => c.difficulty === 'extreme').length,
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
      case 'featured':
        return [...list].sort((a, b) => {
          const af = a.featured ? 1 : 0;
          const bf = b.featured ? 1 : 0;
          if (bf !== af) return bf - af;
          return (b.points ?? 0) - (a.points ?? 0);
        });
      case 'newest':   return [...list].reverse();
      case 'hardest':  return [...list].sort((a, b) => {
        const order = { extreme: 5, expert: 4, hard: 3, medium: 2, easy: 1 };
        return (order[b.difficulty] ?? 0) - (order[a.difficulty] ?? 0);
      });
      case 'mostSolved': return [...list].sort((a, b) => (b.solved ?? 0) - (a.solved ?? 0));
      case 'highestPts': return [...list].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
      default: return list;
    }
  }, [challenges, statusFilter, sortBy]);

  const { featuredItems, catalogItems } = useMemo(() => {
    const featured = [];
    const rest = [];
    for (const c of filtered) {
      if (c.featured) featured.push(c);
      else rest.push(c);
    }
    return { featuredItems: featured, catalogItems: rest };
  }, [filtered]);

  const featuredGridClass = featuredItems.length === 1
    ? 'ch-featured-grid ch-featured-grid--solo'
    : featuredItems.length === 2
      ? 'ch-featured-grid ch-featured-grid--duo'
      : 'ch-featured-grid';

  const diffLabel =
    diffFilter === 'all' ? t('difficulty.allTag') : t(`difficulty.${diffFilter}`).toUpperCase();

  const catLabel = catFilter === 'all' ? t('category.all') : catFilter.toUpperCase();

  const statusLabel =
    statusFilter === 'all' ? null : t(`status.${statusFilter}`).toUpperCase();

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

        <aside className={`ch-sidebar${sidebarOpen ? ' open' : ''}`} data-tutorial="challenges-sidebar">

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">{t('sidebar.search')}</div>
            <div className="ch-search-wrap">
              <span className="ch-search-icon">/</span>
              <input
                type="text"
                className="ch-search-input"
                placeholder={t('sidebar.searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">{t('sidebar.difficulty')}</div>
            {diffFilterOptions.map(({ val, labelKey, dot }) => (
              <button
                key={val}
                className={`ch-filter-btn${diffFilter === val ? ' ch-active' : ''}`}
                onClick={() => setDiffFilter(val)}
              >
                <span className="ch-filter-label-inner">
                  {dot && <span className={`ch-filter-dot ${dot}`} />}
                  {t(labelKey)}
                </span>
                <span className="ch-filter-count">{diffCounts[val]}</span>
              </button>
            ))}
          </div>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">{t('sidebar.status')}</div>
            {statusFilterOptions.map(({ val, labelKey }) => (
              <button
                key={val}
                className={`ch-filter-btn${statusFilter === val ? ' ch-active' : ''}`}
                onClick={() => setStatusFilter(val)}
              >
                <span>{t(labelKey)}</span>
                <span className="ch-filter-count">{statusCounts[val]}</span>
              </button>
            ))}
          </div>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">{t('sidebar.category')}</div>
            <div className="ch-cat-grid">
              {categories.map(cat => {
                const val = cat === 'All' ? 'all' : cat;
                const displayCat = cat === 'All' ? t('status.all') : cat;
                return (
                  <button
                    key={cat}
                    className={`ch-cat-tag${catFilter === val ? ' ch-active' : ''}`}
                    onClick={() => setCatFilter(val)}
                  >
                    {displayCat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ch-sidebar-section">
            <div className="ch-sidebar-label">{t('sidebar.myProgress')}</div>
            <div className="ch-stat-row">
              <span className="ch-stat-row-label">{t('sidebar.completed')}</span>
              <span className="ch-stat-row-val green">{completedChallenges.length}</span>
            </div>
            <div className="ch-stat-row">
              <span className="ch-stat-row-label">{t('sidebar.attempted')}</span>
              <span className="ch-stat-row-val warn">{attemptedCount}</span>
            </div>
            <div className="ch-stat-row">
              <span className="ch-stat-row-label">{t('sidebar.bestRank')}</span>
              <span className="ch-stat-row-val purple">#3</span>
            </div>
            <div className="ch-stat-row">
              <span className="ch-stat-row-label">{t('sidebar.totalPts')}</span>
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

        <main className="ch-main" data-tutorial="challenges-main">

          <div className="ch-page-header">
            <div>
              <div className="ch-page-eyebrow">
                // {t('header.eyebrow', { count: diffCounts.all })}
              </div>
              <h1 className="ch-page-title">
                {t('header.titleBefore')}
                <em>{t('header.titleEm')}</em>
              </h1>
            </div>
            <div className="ch-page-controls">
              <select
                className="ch-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                {sortOptions.map(({ val, labelKey }) => (
                  <option key={val} value={val}>{t(labelKey)}</option>
                ))}
              </select>
              <div className="ch-view-toggle">
                <button
                  className={`ch-view-btn${viewMode === 'grid' ? ' ch-active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title={t('view.grid')}
                >
                  ⊞
                </button>
                <button
                  className={`ch-view-btn${viewMode === 'list' ? ' ch-active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title={t('view.list')}
                >
                  ☰
                </button>
              </div>
            </div>
          </div>

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
              <span>{t('results', { count: filtered.length })}</span>
            </span>
          </div>

          {loading ? (
            <div className="ch-challenges-grid">
              <div className="ch-empty-state">
                <div className="ch-empty-glyph">...</div>
                <div className="ch-empty-text">{t('loading')}</div>
              </div>
            </div>
          ) : error ? (
            <div className="ch-challenges-grid">
              <div className="ch-empty-state">
                <div className="ch-empty-glyph">!</div>
                <div className="ch-empty-text">{error}</div>
                <div className="ch-empty-text" style={{ fontSize: 12, marginTop: 8 }}>
                  {t('serviceHint')}
                </div>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="ch-challenges-grid">
              <div className="ch-empty-state">
                <div className="ch-empty-glyph">404</div>
                <div className="ch-empty-text">{t('emptyFilters')}</div>
              </div>
            </div>
          ) : (
            <>
              {featuredItems.length > 0 && (
                <section className="ch-featured-section" aria-labelledby="ch-featured-heading">
                  <div className="ch-featured-section-head">
                    <div className="ch-featured-section-eyebrow">{t('featured.eyebrow')}</div>
                    <h2 id="ch-featured-heading" className="ch-featured-section-title">
                      {t('featured.titleBefore')}
                      <em>{t('featured.titleEm')}</em>
                    </h2>
                  </div>
                  <div className={featuredGridClass}>
                    {featuredItems.map((c) => (
                      <ChallengeCard key={c.id} challenge={c} spotlight />
                    ))}
                  </div>
                </section>
              )}

              {catalogItems.length > 0 && (
                <section
                  className="ch-catalog-section"
                  aria-labelledby={featuredItems.length > 0 ? 'ch-catalog-heading' : undefined}
                >
                  {featuredItems.length > 0 && (
                    <div className="ch-catalog-section-head">
                      <div className="ch-catalog-section-eyebrow">{t('catalog.eyebrow')}</div>
                      <h2 id="ch-catalog-heading" className="ch-catalog-section-title">
                        {t('catalog.titleBefore')}
                        <em>{t('catalog.titleEm')}</em>
                      </h2>
                    </div>
                  )}
                  <div className="ch-challenges-grid">
                    {catalogItems.map((c) => (
                      <ChallengeCard key={c.id} challenge={c} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {!loading && !error && <ChallengeNewsletterBanner />}

        </main>
      </div>

      <BottomNav />
      <TutorialTour tourKey="challenges" steps={tourSteps} docsHref={DOCS_PATHS.challenges} when={!loading} />
    </div>
  );
}
