import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMySubmissions } from '../../lib/submissionsApi';
import Topbar from '../../components/Topbar';
import BottomNav from '../../components/BottomNav';
import CustomCursor from '../../components/CustomCursor';
import '../challenges/challenges.css';
import './submissions.css';

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
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getMySubmissions();
        if (!cancelled) setSubmissions(data || []);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load submissions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = [...submissions];
    if (filter !== 'all') list = list.filter(s => s.status === filter);
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [filter, submissions]);

  const completed = submissions.filter(s => s.status === 'COMPLETED');
  const avgScore = completed.length > 0
    ? (completed.reduce((acc, s) => acc + (Number(s.totalScore) || 0), 0) / completed.length).toFixed(1) : '0';
  const bestScore = completed.length > 0
    ? Math.max(...completed.map(s => Number(s.totalScore) || 0)).toFixed(1) : '0';

  const kpis = [
    { icon: '◎', label: 'Total Submissions', value: submissions.length, color: 'var(--cyan)', bar: '100%' },
    { icon: '✓', label: 'Completed', value: completed.length, color: 'var(--green)', bar: submissions.length > 0 ? `${(completed.length / submissions.length) * 100}%` : '0%' },
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

          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', letterSpacing: 1 }}>
              Loading submissions...
            </div>
          ) : error ? (
            <div style={{ padding: 60, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--red)', letterSpacing: 1 }}>
              {error}
            </div>
          ) : (
            <>
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
                    {submissions.length === 0 ? 'No submissions yet — go solve a challenge!' : 'No submissions match this filter'}
                  </div>
                ) : filtered.map((sub, i) => {
                  const score = Number(sub.totalScore) || 0;
                  const maxScore = 1000;
                  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
                  const sc = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--warn)' : pct > 0 ? 'var(--red)' : 'var(--muted)';
                  return (
                    <div key={sub.id} className="sub-row" style={{ animationDelay: `${i * 0.04}s` }} onClick={() => navigate(`/submissions/${sub.id}`)}>
                      <div className="sub-row-id">#{sub.id}</div>
                      <div>
                        <div className="sub-row-challenge-title">Challenge #{sub.challengeId}</div>
                        <div className="sub-row-challenge-meta">
                          <span>ID {sub.challengeId}</span>
                        </div>
                      </div>
                      <div className="sub-row-score">
                        <div className="sub-row-score-val" style={{ color: sc }}>{score > 0 ? score.toFixed(1) : '—'}</div>
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
            </>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
