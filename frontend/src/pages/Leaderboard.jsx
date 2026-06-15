import { useState, useMemo, useEffect, useCallback } from 'react';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import CustomCursor from '../components/CustomCursor';
import UserProfileCard from '../components/UserProfileCard';
import { useAuth } from '../context/AuthContext';
import { getEloLeaderboard, getLevelLeaderboard } from '../lib/authApi';
import { getChallengeLeaderboard } from '../lib/leaderboardApi';
import { getChallenges } from '../lib/challengesApi';
import {
  LEADERBOARD_MODES,
  getTableColumns,
  getPodiumPrimary,
  getPodiumStats,
  getRowCells,
  mapPlayerEntries,
  mapChallengeEntries,
} from '../lib/leaderboardDisplay';
import { usePageMeta } from '../lib/usePageMeta';
import './challenges/challenges.css';
import './leaderboard.css';

const AVATAR_COLORS = [
  'linear-gradient(135deg, var(--cyan), var(--purple))',
  'linear-gradient(135deg, var(--green), var(--cyan))',
  'linear-gradient(135deg, var(--warn), var(--red))',
  'linear-gradient(135deg, var(--purple), var(--red))',
  'linear-gradient(135deg, var(--cyan), var(--green))',
];

function getRankClass(rank) {
  if (rank === 1) return 'lb-rank-1';
  if (rank === 2) return 'lb-rank-2';
  if (rank === 3) return 'lb-rank-3';
  return 'lb-rank-other';
}

export default function Leaderboard() {
  usePageMeta({
    title: 'Leaderboard — Top API Developers',
    description:
      'Global ELO and level rankings plus per-challenge leaderboards on API Arena.',
    path: '/leaderboard',
  });

  const [mode, setMode] = useState('elo');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function loadChallenges() {
      setChallengesLoading(true);
      try {
        const data = await getChallenges();
        if (!cancelled) {
          const list = Array.isArray(data) ? data : [];
          setChallenges(list.filter((c) => c.isActive !== false));
        }
      } catch {
        if (!cancelled) setChallenges([]);
      } finally {
        if (!cancelled) setChallengesLoading(false);
      }
    }
    loadChallenges();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRankings() {
      if (mode === 'challenge' && !selectedChallengeId) {
        setPlayers([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let data;
        if (mode === 'elo') {
          data = await getEloLeaderboard();
          if (!cancelled) setPlayers(mapPlayerEntries(data));
        } else if (mode === 'level') {
          data = await getLevelLeaderboard();
          if (!cancelled) setPlayers(mapPlayerEntries(data));
        } else {
          data = await getChallengeLeaderboard(selectedChallengeId);
          if (!cancelled) setPlayers(mapChallengeEntries(data));
        }
      } catch (err) {
        if (!cancelled) {
          setPlayers([]);
          setError(err?.message || 'Failed to load leaderboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRankings();
    return () => { cancelled = true; };
  }, [mode, selectedChallengeId]);

  const sorted = useMemo(() => {
    const list = [...players];
    if (mode === 'challenge') {
      return list.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    }
    return list.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  }, [players, mode]);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const columns = getTableColumns(mode);
  const selectedChallenge = challenges.find((c) => String(c.id) === String(selectedChallengeId));

  const closeProfile = useCallback(() => setSelectedUserId(null), []);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    if (nextMode !== 'challenge') {
      setSelectedChallengeId('');
    }
  };

  const showEmptyChallengePrompt = mode === 'challenge' && !selectedChallengeId;
  const showNoEntries = !loading && !showEmptyChallengePrompt && players.length === 0;

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
        <Topbar onMenuToggle={() => setSidebarOpen((s) => !s)} sidebarOpen={sidebarOpen} />
        <main className="ch-main">
          <div className="ch-page-header lb-page-header">
            <div>
              <div className="ch-page-eyebrow">// Global Rankings</div>
              <h1 className="ch-page-title">Leader<em>Board</em></h1>
            </div>
          </div>

          <div className="lb-controls">
            <div className="lb-tabs" role="tablist" aria-label="Leaderboard mode">
              {LEADERBOARD_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={mode === m.id}
                  className={`lb-tab${mode === m.id ? ' active' : ''}`}
                  onClick={() => handleModeChange(m.id)}
                  title={m.description}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {mode === 'challenge' && (
              <div className="lb-challenge-filter">
                <label className="lb-challenge-label" htmlFor="lb-challenge-select">
                  Challenge
                </label>
                <select
                  id="lb-challenge-select"
                  className="lb-challenge-select"
                  value={selectedChallengeId}
                  onChange={(e) => setSelectedChallengeId(e.target.value)}
                  disabled={challengesLoading}
                >
                  <option value="">
                    {challengesLoading ? 'Loading challenges…' : 'Select a challenge…'}
                  </option>
                  {challenges.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {mode === 'challenge' && selectedChallenge && (
            <p className="lb-mode-hint">
              Rankings for <strong>{selectedChallenge.title}</strong> — best score, then fastest time.
            </p>
          )}
          {mode === 'elo' && (
            <p className="lb-mode-hint">
              ELO ranking includes players with at least 3 completed challenges.
            </p>
          )}

          {loading ? (
            <div className="lb-state-message">Loading rankings…</div>
          ) : error ? (
            <div className="lb-state-message lb-state-error">{error}</div>
          ) : showEmptyChallengePrompt ? (
            <div className="lb-state-message">
              Select a challenge above to view its leaderboard.
            </div>
          ) : showNoEntries ? (
            <div className="lb-state-message">
              {mode === 'challenge'
                ? 'No submissions for this challenge yet.'
                : 'No leaderboard entries yet. Complete a challenge to appear here!'}
            </div>
          ) : (
            <>
              <div className="lb-hero-strip">
                {[top3[1], top3[0], top3[2]].map((p, i) => {
                  if (!p) return <div key={`empty-${i}`} />;
                  const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
                  const initials = p.username.slice(0, 2).toUpperCase();
                  const primary = getPodiumPrimary(p, mode);
                  const stats = getPodiumStats(p, mode);
                  return (
                    <div
                      key={p.userId}
                      className={`lb-podium lb-podium-${rank} lb-clickable`}
                      onClick={() => setSelectedUserId(p.userId)}
                    >
                      <div className="lb-podium-rank">#{rank}</div>
                      <div className="lb-podium-avatar">{initials}</div>
                      <div className="lb-podium-name">{p.username}</div>
                      <div className="lb-podium-rating">
                        {typeof primary.value === 'number'
                          ? primary.value.toLocaleString()
                          : primary.value}{' '}
                        {primary.label}
                      </div>
                      <div className="lb-podium-stats">
                        {stats.map((s) => (
                          <div key={s.label} className="lb-podium-stat">
                            <div className="lb-podium-stat-val" style={{ color: s.color }}>{s.value}</div>
                            <div className="lb-podium-stat-label">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="lb-table">
                <div className="lb-table-head">
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      className={`lb-th${col.align === 'right' ? ' lb-th-right' : ''}${col.align === 'center' ? ' lb-th-center' : ''}`}
                    >
                      {col.label}
                    </div>
                  ))}
                </div>
                {rest.length === 0 && top3.length <= 3 ? (
                  <div className="lb-table-empty">Only podium players so far</div>
                ) : (
                  rest.map((p, i) => {
                    const rank = p.rank ?? i + 4;
                    const initials = p.username.slice(0, 2).toUpperCase();
                    const isMe = user && p.userId === user.id;
                    const avatarBg = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    const cells = getRowCells(p, mode);
                    return (
                      <div
                        key={p.userId}
                        className={`lb-row lb-clickable${isMe ? ' lb-me' : ''}`}
                        style={{ animationDelay: `${i * 0.04}s` }}
                        onClick={() => setSelectedUserId(p.userId)}
                      >
                        <div className={`lb-row-rank ${getRankClass(rank)}`}>{rank}</div>
                        <div className="lb-row-avatar" style={{ background: avatarBg }}>{initials}</div>
                        <div>
                          <div className="lb-row-name" style={isMe ? { color: 'var(--cyan)' } : undefined}>
                            {p.username}
                          </div>
                          <div className="lb-row-sub">{cells.sub}</div>
                        </div>
                        <div>
                          <div className="lb-row-rating" style={{ color: cells.primary.color }}>
                            {cells.primary.value}
                          </div>
                          <div className="lb-row-rating-label">{cells.primary.label}</div>
                        </div>
                        <div className="lb-row-stat" style={{ color: cells.secondary.color ?? 'var(--text)' }}>
                          {cells.secondary.value}
                        </div>
                        <div className="lb-row-stat" style={{ color: cells.tertiary.color ?? 'var(--text)' }}>
                          {cells.tertiary.value}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </main>
      </div>
      <BottomNav />

      {selectedUserId && (
        <UserProfileCard userId={selectedUserId} onClose={closeProfile} />
      )}
    </div>
  );
}
