import { useTranslation } from 'react-i18next';
import { TERMINAL_SCORE_DIMS } from '../../pages/landing/landing.data';

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

function ScoreRow({ label, score, max, pct, color, gradient }) {
  return (
    <div className="score-row">
      <span className="score-label">{label}</span>
      <div className="score-bar-bg">
        <div
          className="score-bar-fill"
          style={{ width: `${pct}%`, background: gradient }}
        />
      </div>
      <span className="score-val" style={{ color }}>
        {score}<span className="score-val-max">/{max}</span>
      </span>
    </div>
  );
}

export default function TerminalWindow() {
  const { t } = useTranslation('landing');
  const lines = t('terminal.lines', { returnObjects: true });
  const scoreLabels = t('terminal.scoreItems', { returnObjects: true });
  const httpRows = TERMINAL_SCORE_DIMS.filter((r) => r.group === 'http');
  const reviewRow = TERMINAL_SCORE_DIMS.find((r) => r.group === 'review');

  return (
    <div className="terminal-window">
      <div className="terminal-bar">
        <div className="t-dot" />
        <div className="t-dot" />
        <div className="t-dot" />
        <span className="t-title">{t('terminal.title')}</span>
        <span className="t-status">
          <span className="t-status-dot" />
          {t('terminal.live')}
        </span>
      </div>

      <div className="terminal-body">
        {(Array.isArray(lines) ? lines : []).map((line, i) => (
          <TerminalLine key={i} line={line} />
        ))}

        <div className="score-panel">
          <div className="score-panel-group-label">{t('terminal.scoreHttpGroup')}</div>
          {httpRows.map((row, i) => (
            <ScoreRow
              key={row.labelKey}
              {...row}
              label={Array.isArray(scoreLabels) ? scoreLabels[i] : row.labelKey}
            />
          ))}
          <div className="score-panel-group-label score-panel-group-label--review">
            {t('terminal.scoreReviewGroup')}
          </div>
          {reviewRow && (
            <ScoreRow
              {...reviewRow}
              label={t('terminal.scoreReviewItem')}
            />
          )}
        </div>

        <div className="t-line" style={{ marginTop: '12px' }}>
          <span className="t-success" style={{ padding: 0, fontSize: '13px' }}>
            {t('terminal.totalScore')}
          </span>
        </div>
      </div>
    </div>
  );
}
