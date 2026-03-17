import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import '../challenges/challenges.css';
import './submissions.css';

const MOCK_SUBMISSIONS = [
  { id: 1, challengeId: 1, challengeTitle: 'REST API Design Basics', category: 'REST API Design', difficulty: 'EASY', status: 'COMPLETED', totalScore: 872.50, maxScore: 1000, createdAt: '2025-06-10T14:32:00', completedAt: '2025-06-10T14:58:00' },
  { id: 2, challengeId: 3, challengeTitle: 'JWT Authentication System', category: 'Authentication', difficulty: 'HARD', status: 'COMPLETED', totalScore: 645.00, maxScore: 1000, createdAt: '2025-06-09T10:15:00', completedAt: '2025-06-09T11:02:00' },
  { id: 3, challengeId: 5, challengeTitle: 'Redis Caching Layer', category: 'Caching', difficulty: 'MEDIUM', status: 'FAILED', totalScore: 0, maxScore: 1000, createdAt: '2025-06-08T16:45:00', completedAt: '2025-06-08T16:46:00' },
  { id: 4, challengeId: 2, challengeTitle: 'CRUD Operations Mastery', category: 'CRUD Operations', difficulty: 'EASY', status: 'COMPLETED', totalScore: 950.00, maxScore: 1000, createdAt: '2025-06-07T09:20:00', completedAt: '2025-06-07T09:45:00' },
  { id: 5, challengeId: 7, challengeTitle: 'WebSocket Real-Time Chat', category: 'WebSockets', difficulty: 'EXPERT', status: 'TESTING', totalScore: 0, maxScore: 1000, createdAt: '2025-06-11T08:10:00', completedAt: null },
  { id: 6, challengeId: 4, challengeTitle: 'SQL Injection Prevention', category: 'Security', difficulty: 'HARD', status: 'BUILDING', totalScore: 0, maxScore: 1000, createdAt: '2025-06-11T09:05:00', completedAt: null },
  { id: 7, challengeId: 8, challengeTitle: 'Database Schema Design', category: 'Database', difficulty: 'MEDIUM', status: 'COMPLETED', totalScore: 780.00, maxScore: 1000, createdAt: '2025-06-06T11:30:00', completedAt: '2025-06-06T12:15:00' },
  { id: 8, challengeId: 9, challengeTitle: 'Microservices Gateway', category: 'Microservices', difficulty: 'EXPERT', status: 'PENDING', totalScore: 0, maxScore: 1000, createdAt: '2025-06-11T09:30:00', completedAt: null },
];

const DIFF_COLOR = { EASY: 'var(--green)', MEDIUM: 'var(--warn)', HARD: 'var(--red)', EXPERT: 'var(--purple)' };

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
  return (
    <span className={`sub-status-badge sub-status-${status.toLowerCase()}`}>
      <span className="sub-status-dot" />
      {status}
    </span>
  );
}

export default function MySubmissions() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = [...MOCK_SUBMISSIONS];
    if (filter !== 'all') list = list.filter(s => s.status === filter);
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [filter]);

  const completed = MOCK_SUBMISSIONS.filter(s => s.status === 'COMPLETED');
  const avgScore = completed.length > 0
    ? (completed.reduce((acc, s) => acc + s.totalScore, 0) / completed.length).toFixed(1) : '0';
  const bestScore = completed.length > 0
    ? Math.max(...completed.map(s => s.totalScore)).toFixed(1) : '0';

  const kpis = [
    { icon: '◎', label: 'Total Submissions', value: MOCK_SUBMISSIONS.length, color: 'var(--cyan)', bar: '100%' },
    { icon: '✓', label: 'Completed', value: completed.length, color: 'var(--green)', bar: `${(completed.length / MOCK_SUBMISSIONS.length) * 100}%` },
    { icon: '★', label: 'Average Score', value: avgScore, color: 'var(--warn)', bar: `${(avgScore / 1000) * 100}%` },
    { icon: '⬆', label: 'Best Score', value: bestScore, color: 'var(--purple)', bar: `${(bestScore / 1000) * 100}%` },
  ];

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
        <Topbar onMenuToggle={() => setSidebarOpen(s => !s)} sidebarOpen={sidebarOpen} />
        <main className="ch-main">
          <div className="ch-page-header" style={{ marginBottom: 28 }}>
            <div>
              <div className="ch-page-eyebrow">// Your Battle History</div>
              <h1 className="ch-page-title">My<em>Submissions</em></h1>
            </div>
          </div>

          <div className="sub-kpi-grid">
            {kpis.map(k => (
              <div key={k.label} className="sub-kpi-card" style={{ '--kpi-color': k.color }}>
                <div className="sub-kpi-icon">{k.icon}</div>
                <div className="sub-kpi-val">{k.value}</div>
                <div className="sub-kpi-label">{k.label}</div>
                <div className="sub-kpi-bar" style={{ width: k.bar }} />
              </div>
            ))}
          </div>

          <div className="sub-filters">
            {['all','COMPLETED','FAILED','TESTING','BUILDING','PENDING'].map(val => (
              <button key={val} className={`sub-filter-btn${filter === val ? ' active' : ''}`} onClick={() => setFilter(val)}>
                {val === 'all' ? 'All' : val}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>
              <span style={{ color: 'var(--text)' }}>{filtered.length}</span> submissions
            </span>
          </div>

          <div className="sub-table">
            <div className="sub-table-head">
              <div className="sub-th">ID</div>
              <div className="sub-th">Challenge</div>
              <div className="sub-th">Score</div>
              <div className="sub-th">Status</div>
              <div className="sub-th sub-th-right">Time</div>
              <div className="sub-th sub-th-right">Actions</div>
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                No submissions match this filter
              </div>
            ) : filtered.map((sub, i) => {
              const pct = sub.maxScore > 0 ? (sub.totalScore / sub.maxScore) * 100 : 0;
              const sc = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--warn)' : pct > 0 ? 'var(--red)' : 'var(--muted)';
              return (
                <div key={sub.id} className="sub-row" style={{ animationDelay: `${i * 0.04}s` }} onClick={() => navigate(`/submissions/${sub.id}`)}>
                  <div className="sub-row-id">#{sub.id}</div>
                  <div>
                    <div className="sub-row-challenge-title">{sub.challengeTitle}</div>
                    <div className="sub-row-challenge-meta">
                      <span style={{ color: DIFF_COLOR[sub.difficulty] }}>{sub.difficulty}</span>
                      <span style={{ color: 'var(--dim)' }}>·</span>
                      <span>{sub.category}</span>
                    </div>
                  </div>
                  <div className="sub-row-score">
                    <div className="sub-row-score-val" style={{ color: sc }}>{sub.totalScore > 0 ? sub.totalScore.toFixed(1) : '—'}</div>
                    <div className="sub-row-score-bar"><div className="sub-row-score-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                  <div><StatusBadge status={sub.status} /></div>
                  <div className="sub-row-time">{formatDate(sub.createdAt)}</div>
                  <div className="sub-row-actions">
                    <button className="sub-action-btn" onClick={e => { e.stopPropagation(); navigate(`/submissions/${sub.id}`); }}>View</button>
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
