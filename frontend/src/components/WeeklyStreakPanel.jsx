import { useMemo } from 'react';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function isoDayIndexUtc() {
  const d = new Date().getUTCDay();
  return d === 0 ? 6 : d - 1;
}

function formatCountdown(weekEndsAt) {
  if (!weekEndsAt) return '';
  const ms = new Date(weekEndsAt).getTime() - Date.now();
  if (ms <= 0) return 'Week ending soon';
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days}d ${hours}h left this week`;
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours}h ${mins}m left this week`;
}

function ProgressRow({ label, value, target, color }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="ws-progress-row">
      <div className="ws-progress-head">
        <span className="ws-progress-label">{label}</span>
        <span className="ws-progress-val" style={{ color }}>
          {value}/{target}
        </span>
      </div>
      <div className="ws-progress-track">
        <div className="ws-progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function WeeklyStreakPanel({ streak, compact = false }) {
  const todayIdx = isoDayIndexUtc();

  const statusLine = useMemo(() => {
    if (!streak) return 'Loading streak…';
    if (streak.qualifiedThisWeek) {
      const via = streak.qualifiedVia === 'BOTH'
        ? 'XP + runs'
        : streak.qualifiedVia === 'RUNS'
          ? 'qualifying runs'
          : 'XP';
      return `Week secured via ${via}`;
    }
    return formatCountdown(streak.weekEndsAt);
  }, [streak]);

  if (!streak) {
    return (
      <div className={`db-streak-body${compact ? ' ws-compact' : ''}`}>
        <div className="ws-muted">Loading weekly streak…</div>
      </div>
    );
  }

  const streakWeeks = streak.currentStreakWeeks ?? 0;

  return (
    <div className={`db-streak-body${compact ? ' ws-compact' : ''}`}>
      <div className="db-streak-top">
        <span className="db-streak-num">{streakWeeks}</span>
        <span className="db-streak-unit">
          week{streakWeeks === 1 ? '' : 's'} streak
        </span>
      </div>

      <div className="db-streak-grid" aria-hidden>
        {DAY_LABELS.map((label, i) => {
          let cls = 'db-streak-dot';
          if (streak.qualifiedThisWeek && i <= todayIdx) cls += ' active';
          if (i === todayIdx) cls += ' today';
          return <div key={`${label}-${i}`} className={cls} title={label} />;
        })}
      </div>
      <div className="db-streak-days" aria-hidden>
        {DAY_LABELS.map((label, i) => (
          <div key={`lbl-${i}`} className="db-streak-day-label">{label}</div>
        ))}
      </div>

      <div className="ws-status-line">{statusLine}</div>

      {!compact && (
        <div className="ws-goals">
          <ProgressRow
            label="Weekly XP"
            value={streak.xpEarnedThisWeek ?? 0}
            target={streak.xpTarget ?? 120}
            color="var(--purple)"
          />
          <ProgressRow
            label={`Runs ≥ ${streak.qualifyingScoreMin ?? 650}`}
            value={streak.qualifyingRunsThisWeek ?? 0}
            target={streak.qualifyingRunsTarget ?? 3}
            color="var(--cyan)"
          />
        </div>
      )}

      {streak.longestStreakWeeks > 0 && (
        <div className="ws-best">
          Best: {streak.longestStreakWeeks} week{streak.longestStreakWeeks === 1 ? '' : 's'}
        </div>
      )}
    </div>
  );
}
