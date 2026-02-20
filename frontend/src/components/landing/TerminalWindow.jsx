import { TERMINAL_SCORE_DIMS } from '../../pages/landing/landing.data';

const TERMINAL_LINES = [
  { type: 'cmd',     prompt: '$', text: 'arena submit ./my-api --challenge crud-master' },
  { type: 'output',  text: '→ Building Docker image...' },
  { type: 'output',  text: '→ Spinning up sandbox...' },
  { type: 'success', text: '✓ Container ready on :8080' },
  { type: 'sep' },
  { type: 'output',  text: '→ Running functional tests [47/47]' },
  { type: 'success', text: '✓ All tests passed · 47/47' },
  { type: 'output',  text: '→ Performance analysis (1000 RPS)' },
  { type: 'success', text: '✓ Avg: 12ms · P99: 28ms' },
  { type: 'output',  text: '→ REST design analysis...' },
  { type: 'info',    text: 'ℹ 2 suggestions · Score: 94/100' },
  { type: 'output',  text: '→ AI code review...' },
  { type: 'success', text: '✓ Claude review: excellent' },
  { type: 'sep' },
];

function TerminalLine({ line }) {
  if (line.type === 'sep') return <hr className="t-separator" />;
  if (line.type === 'cmd') {
    return (
      <div className="t-line">
        <span className="t-prompt">$</span>
        <span className="t-cmd">{line.text}</span>
      </div>
    );
  }
  const cls = { output: 't-output', success: 't-success', info: 't-info' }[line.type] ?? 't-output';
  return <div className={cls}>{line.text}</div>;
}

export default function TerminalWindow() {
  return (
    <div className="terminal-window">
      <div className="terminal-bar">
        <div className="t-dot" />
        <div className="t-dot" />
        <div className="t-dot" />
        <span className="t-title">apiarena · submission #2847</span>
        <span className="t-status">
          <span className="t-status-dot" />
          LIVE
        </span>
      </div>

      <div className="terminal-body">
        {TERMINAL_LINES.map((line, i) => (
          <TerminalLine key={i} line={line} />
        ))}

        {/* Score panel */}
        <div className="score-panel">
          {TERMINAL_SCORE_DIMS.map(({ label, pct, value, color, gradient }) => (
            <div key={label} className="score-row">
              <span className="score-label">{label}</span>
              <div className="score-bar-bg">
                <div
                  className="score-bar-fill"
                  style={{ width: `${pct}%`, background: gradient }}
                />
              </div>
              <span className="score-val" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>

        <div className="t-line" style={{ marginTop: '12px' }}>
          <span className="t-success" style={{ padding: 0, fontSize: '13px' }}>
            ★ TOTAL SCORE: 920 · RANK #3 ↑2
          </span>
        </div>
      </div>
    </div>
  );
}
