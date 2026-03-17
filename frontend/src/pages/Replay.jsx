import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import CustomCursor from '../components/CustomCursor';
import './challenges/challenges.css';
import './replay.css';

const MOCK_EVENTS = [

];

const MOCK_ENDPOINTS = [

];

const METHOD_CLASS = { GET: 'rp-method-get', POST: 'rp-method-post', PUT: 'rp-method-put', DELETE: 'rp-method-delete', OPTIONS: 'rp-method-get' };
const METHOD_COLOR = { GET: 'var(--green)', POST: 'var(--cyan)', PUT: 'var(--warn)', DELETE: 'var(--red)', OPTIONS: 'var(--muted)' };

function statusClass(s) {
  if (s >= 200 && s < 300) return 'rp-status-2xx';
  if (s >= 400 && s < 500) return 'rp-status-4xx';
  return 'rp-status-5xx';
}

export default function Replay() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speed, setSpeed] = useState(1);
  const termRef = useRef(null);
  const timerRef = useRef(null);

  const visibleEvents = MOCK_EVENTS.slice(0, currentIdx);
  const progress = MOCK_EVENTS.length > 0 ? (currentIdx / MOCK_EVENTS.length) * 100 : 0;

  useEffect(() => {
    if (playing && currentIdx < MOCK_EVENTS.length) {
      timerRef.current = setTimeout(() => {
        setCurrentIdx(i => i + 1);
      }, 400 / speed);
    } else if (currentIdx >= MOCK_EVENTS.length) {
      setPlaying(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [playing, currentIdx, speed]);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [currentIdx]);

  function handlePlay() {
    if (currentIdx >= MOCK_EVENTS.length) {
      setCurrentIdx(0);
    }
    setPlaying(p => !p);
  }

  function handleReset() {
    setPlaying(false);
    setCurrentIdx(0);
  }

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: '1fr' }}>
        <Topbar onMenuToggle={() => setSidebarOpen(s => !s)} sidebarOpen={sidebarOpen} />
        <main className="ch-main">
          <div className="rp-container">
            <div className="ch-page-header" style={{ marginBottom: 28 }}>
              <div>
                <div className="ch-page-eyebrow">// Submission Replay</div>
                <h1 className="ch-page-title">Battle<em>Replay</em></h1>
              </div>
            </div>

            {/* Player */}
            <div className="rp-player">
              <div className="rp-player-header">
                <div className="rp-player-title">
                  {playing && <span className="rp-live-dot" />}
                  Submission #1 · REST API Design Basics
                </div>
                <div className="rp-player-meta">
                  <span>Duration: 00:16.2</span>
                  <span>Events: {MOCK_EVENTS.length}</span>
                  <span>Score: 872.5/1000</span>
                </div>
              </div>

              <div className="rp-terminal" ref={termRef}>
                {visibleEvents.length === 0 && (
                  <div style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                    Press play to start the replay...
                  </div>
                )}
                {visibleEvents.map((ev, i) => (
                  <div key={i} className="rp-line" style={{ animationDelay: `${(i % 5) * 0.03}s` }}>
                    <span className="rp-ts">{ev.ts}</span>
                    <span className={`rp-tag rp-tag-${ev.tag}`}>{ev.tag}</span>
                    <span className="rp-content">
                      {ev.method && (
                        <>
                          <span className={`rp-method ${METHOD_CLASS[ev.method] || ''}`}>{ev.method}</span>
                          <span>{ev.path}</span>
                          {ev.content && <span style={{ color: 'var(--muted)' }}> · {ev.content}</span>}
                        </>
                      )}
                      {ev.status && !ev.method && (
                        <>
                          <span className={`rp-status ${statusClass(ev.status)}`}>{ev.status}</span>
                          <span style={{ marginLeft: 6 }}>{ev.time}ms</span>
                          <span style={{ color: 'var(--muted)' }}> · {ev.content}</span>
                        </>
                      )}
                      {!ev.method && !ev.status && ev.content}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rp-controls">
                <button className="rp-play-btn" onClick={handlePlay}>
                  {playing ? '❚❚' : '▶'}
                </button>
                <button className="rp-play-btn" onClick={handleReset} style={{ fontSize: 12 }}>
                  ⟲
                </button>
                <div className="rp-progress-wrap">
                  <div className="rp-progress-bar">
                    <div className="rp-progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="rp-progress-labels">
                    <span>{visibleEvents.length > 0 ? visibleEvents[visibleEvents.length - 1].ts : '00:00.0'}</span>
                    <span>{currentIdx} / {MOCK_EVENTS.length} events</span>
                    <span>00:16.2</span>
                  </div>
                </div>
                {[1, 2, 4].map(s => (
                  <button key={s} className={`rp-speed-btn${speed === s ? ' active' : ''}`} onClick={() => setSpeed(s)}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
