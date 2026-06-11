import { useState, useMemo, useEffect, useCallback } from 'react';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import CustomCursor from '../components/CustomCursor';
import UserProfileCard from '../components/UserProfileCard';
import { useAuth } from '../context/AuthContext';
import * as leaderboardApi from '../lib/leaderboardApi';
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
      'Global rankings of API Arena players by score and ELO. See who builds the best APIs and where you stand.',
    path: '/leaderboard',
  });
  const [tab, setTab] = useState('score');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await leaderboardApi.getGlobalLeaderboard();
        if (!cancelled) setPlayers(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setPlayers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const sorted = useMemo(() => {
    const list = [...players];
    switch (tab) {
      case 'challenges': return list.sort((a, b) => b.challengesCompleted - a.challengesCompleted);
      case 'score':
      default: return list.sort((a, b) => b.totalScore - a.totalScore);
    }
  }, [players, tab]);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const closeProfile = useCallback(() => setSelectedUserId(null), []);

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
        <Topbar onMenuToggle={() => setSidebarOpen(s => !s)} sidebarOpen={sidebarOpen} />
        <main className="ch-main">
          <div className="ch-page-header" style={{ marginBottom: 28 }}>
            <div>
              <div className="ch-page-eyebrow">// Global Rankings</div>
              <h1 className="ch-page-title">Leader<em>Board</em></h1>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>
              Loading rankings...
            </div>
          ) : players.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>
              No leaderboard entries yet. Complete a challenge to appear here!
            </div>
          ) : (
            <>
              {/* Podium top 3 */}
              <div className="lb-hero-strip">
                {[top3[1], top3[0], top3[2]].map((p, i) => {
                  if (!p) return <div key={`empty-${i}`} />;
                  const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
                  const initials = p.username.slice(0, 2).toUpperCase();
                  return (
                    <div
                      key={p.userId}
                      className={`lb-podium lb-podium-${rank} lb-clickable`}
                      onClick={() => setSelectedUserId(p.userId)}
                    >
                      <div className="lb-podium-rank">#{rank}</div>
                      <div className="lb-podium-avatar">{initials}</div>
                      <div className="lb-podium-name">{p.username}</div>
                      <div className="lb-podium-rating">{p.totalScore.toLocaleString()} PTS</div>
                      <div className="lb-podium-stats">
                        <div className="lb-podium-stat">
                          <div className="lb-podium-stat-val" style={{ color: 'var(--green)' }}>{p.challengesCompleted}</div>
                          <div className="lb-podium-stat-label">Solved</div>
                        </div>
                        <div className="lb-podium-stat">
                          <div className="lb-podium-stat-val" style={{ color: 'var(--cyan)' }}>{p.totalScore.toLocaleString()}</div>
                          <div className="lb-podium-stat-label">Score</div>
                        </div>
                        <div className="lb-podium-stat">
                          <div className="lb-podium-stat-val" style={{ color: 'var(--purple)' }}>
                            {p.challengesCompleted > 0 ? Math.round(p.totalScore / p.challengesCompleted) : 0}
                          </div>
                          <div className="lb-podium-stat-label">Avg</div>
                        </div>
                        <div className="lb-podium-stat">
                          <div className="lb-podium-stat-val" style={{ color: 'var(--warn)' }}>#{p.rank}</div>
                          <div className="lb-podium-stat-label">Rank</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tabs */}
              <div className="lb-tabs">
                {[
                  { val: 'score', label: 'By Score' },
                  { val: 'challenges', label: 'By Challenges' },
                ].map(t => (
                  <button key={t.val} className={`lb-tab${tab === t.val ? ' active' : ''}`} onClick={() => setTab(t.val)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="lb-table">
                <div className="lb-table-head">
                  <div className="lb-th" style={{ textAlign: 'center' }}>Rank</div>
                  <div className="lb-th"></div>
                  <div className="lb-th">Player</div>
                  <div className="lb-th">Score</div>
                  <div className="lb-th lb-th-right">Solved</div>
                  <div className="lb-th lb-th-right">Avg</div>
                </div>
                {rest.length === 0 && top3.length <= 3 ? (
                  <div style={{ padding: 30, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                    Only podium players so far
                  </div>
                ) : (
                  rest.map((p, i) => {
                    const rank = i + 4;
                    const initials = p.username.slice(0, 2).toUpperCase();
                    const isMe = user && p.userId === user.id;
                    const avatarBg = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    const avg = p.challengesCompleted > 0 ? Math.round(p.totalScore / p.challengesCompleted) : 0;
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
                          <div className="lb-row-name" style={isMe ? { color: 'var(--cyan)' } : undefined}>{p.username}</div>
                          <div className="lb-row-sub">{p.challengesCompleted} challenges</div>
                        </div>
                        <div>
                          <div className="lb-row-rating" style={{ color: 'var(--warn)' }}>{p.totalScore.toLocaleString()}</div>
                          <div className="lb-row-rating-label">PTS</div>
                        </div>
                        <div className="lb-row-stat" style={{ color: 'var(--green)' }}>{p.challengesCompleted}</div>
                        <div className="lb-row-stat" style={{ color: 'var(--cyan)' }}>{avg}</div>
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
