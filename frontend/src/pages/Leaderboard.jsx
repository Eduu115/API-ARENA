import { useState, useMemo } from 'react';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import CustomCursor from '../components/CustomCursor';
import './challenges/challenges.css';
import './leaderboard.css';

const MOCK_PLAYERS = [
  { id: 1, username: 'Tomasin', rating: 2847, level: 42, solved: 187, tests: 1420, xp: 94200, change: +15 },
  { id: 2, username: 'David', rating: 2693, level: 39, solved: 172, tests: 1305, xp: 87400, change: +8 },
  { id: 3, username: 'Eduardo', rating: 2541, level: 36, solved: 158, tests: 1189, xp: 79600, change: -3 },
  { id: 4, username: 'Juan', rating: 2398, level: 34, solved: 145, tests: 1090, xp: 72500, change: +22 },
  { id: 5, username: 'Anthony', rating: 2210, level: 31, solved: 132, tests: 980, xp: 66100, change: 0 },
  { id: 6, username: 'David', rating: 2105, level: 29, solved: 121, tests: 910, xp: 60800, change: -7 },
  { id: 7, username: 'Gemma', rating: 1987, level: 27, solved: 110, tests: 835, xp: 55200, change: +11 },
  { id: 8, username: 'Laura', rating: 1834, level: 24, solved: 98, tests: 745, xp: 49100, change: +4 },
  { id: 9, username: 'Rodri', rating: 1720, level: 22, solved: 87, tests: 660, xp: 43500, change: -12 },
  { id: 10, username: 'ME', rating: 1605, level: 20, solved: 76, tests: 580, xp: 38200, change: +6 },
];

const MY_ID = 10;

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
  const [tab, setTab] = useState('rating');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sorted = useMemo(() => {
    const list = [...MOCK_PLAYERS];
    switch (tab) {
      case 'solved': return list.sort((a, b) => b.solved - a.solved);
      case 'xp': return list.sort((a, b) => b.xp - a.xp);
      case 'level': return list.sort((a, b) => b.level - a.level);
      default: return list.sort((a, b) => b.rating - a.rating);
    }
  }, [tab]);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

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

          {/* Podium top 3 */}
          <div className="lb-hero-strip">
            {[top3[1], top3[0], top3[2]].map((p, i) => {
              if (!p) return null;
              const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
              const initials = p.username.slice(0, 2).toUpperCase();
              return (
                <div key={p.id} className={`lb-podium lb-podium-${rank}`}>
                  <div className="lb-podium-rank">#{rank}</div>
                  <div className="lb-podium-avatar">{initials}</div>
                  <div className="lb-podium-name">{p.username}</div>
                  <div className="lb-podium-rating">ELO {p.rating} · LVL {p.level}</div>
                  <div className="lb-podium-stats">
                    <div className="lb-podium-stat">
                      <div className="lb-podium-stat-val" style={{ color: 'var(--green)' }}>{p.solved}</div>
                      <div className="lb-podium-stat-label">Solved</div>
                    </div>
                    <div className="lb-podium-stat">
                      <div className="lb-podium-stat-val" style={{ color: 'var(--cyan)' }}>{p.tests}</div>
                      <div className="lb-podium-stat-label">Tests</div>
                    </div>
                    <div className="lb-podium-stat">
                      <div className="lb-podium-stat-val" style={{ color: 'var(--purple)' }}>{p.xp.toLocaleString()}</div>
                      <div className="lb-podium-stat-label">XP</div>
                    </div>
                    <div className="lb-podium-stat">
                      <div className="lb-podium-stat-val" style={{ color: p.change > 0 ? 'var(--green)' : p.change < 0 ? 'var(--red)' : 'var(--muted)' }}>
                        {p.change > 0 ? `+${p.change}` : p.change === 0 ? '—' : p.change}
                      </div>
                      <div className="lb-podium-stat-label">Change</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="lb-tabs">
            {[
              { val: 'rating', label: 'By Rating' },
              { val: 'solved', label: 'By Solved' },
              { val: 'xp', label: 'By XP' },
              { val: 'level', label: 'By Level' },
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
              <div className="lb-th">Rating</div>
              <div className="lb-th lb-th-right">Solved</div>
              <div className="lb-th lb-th-right">Level</div>
              <div className="lb-th lb-th-right">Change</div>
            </div>
            {rest.map((p, i) => {
              const rank = i + 4;
              const initials = p.username.slice(0, 2).toUpperCase();
              const isMe = p.id === MY_ID;
              const avatarBg = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <div key={p.id} className={`lb-row${isMe ? ' lb-me' : ''}`} style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className={`lb-row-rank ${getRankClass(rank)}`}>{rank}</div>
                  <div className="lb-row-avatar" style={{ background: avatarBg }}>{initials}</div>
                  <div>
                    <div className="lb-row-name" style={isMe ? { color: 'var(--cyan)' } : undefined}>{p.username}</div>
                    <div className="lb-row-sub">{p.xp.toLocaleString()} XP</div>
                  </div>
                  <div>
                    <div className="lb-row-rating" style={{ color: 'var(--warn)' }}>{p.rating}</div>
                    <div className="lb-row-rating-label">ELO</div>
                  </div>
                  <div className="lb-row-stat" style={{ color: 'var(--green)' }}>{p.solved}</div>
                  <div className="lb-row-stat" style={{ color: 'var(--cyan)' }}>{p.level}</div>
                  <div className={`lb-row-change ${p.change > 0 ? 'lb-change-up' : p.change < 0 ? 'lb-change-down' : 'lb-change-same'}`}>
                    {p.change > 0 ? `▲ ${p.change}` : p.change < 0 ? `▼ ${Math.abs(p.change)}` : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
