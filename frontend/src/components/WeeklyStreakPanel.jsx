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

function ProgressRow({ label, value, target, color, large = false }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className={`ws-progress-row${large ? ' ws-progress-row--lg' : ''}`}>
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

function StreakGoals({ streak, large = false, showHint = true, layout = 'stack' }) {
  return (
    <div className={`ws-goals${layout === 'wide' ? ' ws-goals--wide' : ''}`}>
      {showHint && (
        <p className="ws-goals-hint">Keep your streak — complete either path this week</p>
      )}
      <ProgressRow
        label="Path A · Weekly XP"
        value={streak.xpEarnedThisWeek ?? 0}
        target={streak.xpTarget ?? 120}
        color="var(--purple)"
        large={large}
      />
      <div className="ws-goals-or" role="separator" aria-label="or">
        <span className="ws-goals-or-line" aria-hidden />
        <span className="ws-goals-or-text">OR</span>
        <span className="ws-goals-or-line" aria-hidden />
      </div>
      <ProgressRow
        label={`Path B · ${streak.qualifyingRunsTarget ?? 3} runs ≥ ${streak.qualifyingScoreMin ?? 650}`}
        value={streak.qualifyingRunsThisWeek ?? 0}
        target={streak.qualifyingRunsTarget ?? 3}
        color="var(--cyan)"
        large={large}
      />
    </div>
  );
}

function WeekGrid({ streak, todayIdx, large = false }) {
  return (
    <>
      <div className={`db-streak-grid${large ? ' db-streak-grid--lg' : ''}`} aria-hidden>
        {DAY_LABELS.map((label, i) => {
          let cls = 'db-streak-dot';
          if (large) cls += ' db-streak-dot--lg';
          if (streak.qualifiedThisWeek && i <= todayIdx) cls += ' active';
          if (i === todayIdx) cls += ' today';
          return <div key={`${label}-${i}`} className={cls} title={label} />;
        })}
      </div>
      <div className={`db-streak-days${large ? ' db-streak-days--lg' : ''}`} aria-hidden>
        {DAY_LABELS.map((label, i) => (
          <div key={`lbl-${i}`} className="db-streak-day-label">{label}</div>
        ))}
      </div>
    </>
  );
}

export default function WeeklyStreakPanel({ streak, variant = 'default' }) {
  const compact = variant === 'compact';
  const minimal = variant === 'minimal';
  const hero = variant === 'hero';
  const todayIdx = isoDayIndexUtc();

  const statusLine = useMemo(() => {
    if (!streak) return 'Loading streak…';
    if (streak.qualifiedThisWeek) {
      const via = streak.qualifiedVia === 'BOTH'
        ? 'XP + qualifying runs'
        : streak.qualifiedVia === 'RUNS'
          ? 'qualifying runs'
          : 'XP';
      return `This week is secured via ${via}.`;
    }
    return formatCountdown(streak.weekEndsAt);
  }, [streak]);

  if (!streak) {
    return (
      <div className={`ws-panel${compact ? ' ws-compact' : ''}${minimal ? ' ws-minimal ws-minimal--loading' : ''}${hero ? ' ws-hero ws-hero--loading' : ''}`}>
        <div className="ws-muted">{minimal ? 'Loading streak…' : 'Loading weekly streak…'}</div>
      </div>
    );
  }

  const streakWeeks = streak.currentStreakWeeks ?? 0;

  if (minimal) {
    return (
      <div
        className={`ws-minimal${streak.qualifiedThisWeek ? ' ws-minimal--secured' : ''}`}
        aria-label="Weekly streak summary"
      >
        <span className="ws-minimal-flame" aria-hidden>⌁</span>
        <span className="ws-minimal-count">{streakWeeks}</span>
        <span className="ws-minimal-unit">
          week{streakWeeks === 1 ? '' : 's'}
        </span>
        {streak.qualifiedThisWeek && (
          <span className="ws-minimal-badge">Secured</span>
        )}
        <span className="ws-minimal-dot" aria-hidden>·</span>
        <span className="ws-minimal-status">{statusLine}</span>
      </div>
    );
  }

  if (hero) {
    return (
      <section
        className={`ws-hero${streak.qualifiedThisWeek ? ' ws-hero--secured' : ''}`}
        aria-label="Weekly streak"
      >
        <div className="ws-hero-glow" aria-hidden />
        <div className="ws-hero-inner">
          <div className="ws-hero-top">
            <div className="ws-hero-main">
              <div className="ws-hero-eyebrow">// Weekly streak</div>
              <div className="ws-hero-count-block">
                <span className="ws-hero-flame" aria-hidden>⌁</span>
                <div className="ws-hero-count-text">
                  <span className="ws-hero-num">{streakWeeks}</span>
                  <span className="ws-hero-unit">
                    week{streakWeeks === 1 ? '' : 's'} streak
                  </span>
                </div>
              </div>
              {streak.qualifiedThisWeek && (
                <span className="ws-hero-badge">Week secured</span>
              )}
              <p className="ws-hero-status">{statusLine}</p>
              {streak.longestStreakWeeks > 0 && (
                <p className="ws-hero-best">
                  Personal best: {streak.longestStreakWeeks} week{streak.longestStreakWeeks === 1 ? '' : 's'}
                </p>
              )}
            </div>

            <div className="ws-hero-week">
              <div className="ws-hero-side-label">This ISO week (UTC)</div>
              <WeekGrid streak={streak} todayIdx={todayIdx} large />
            </div>
          </div>

          <div className="ws-hero-goals-band">
            <StreakGoals streak={streak} large layout="wide" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className={`ws-panel db-streak-body${compact ? ' ws-compact' : ''}`}>
      <div className="db-streak-top">
        <span className="db-streak-num">{streakWeeks}</span>
        <span className="db-streak-unit">
          week{streakWeeks === 1 ? '' : 's'} streak
        </span>
      </div>

      <WeekGrid streak={streak} todayIdx={todayIdx} />

      <div className="ws-status-line">{statusLine}</div>

      {streak.qualifiedThisWeek && (
        <span className="ws-hero-badge ws-hero-badge--inline">Week secured</span>
      )}

      {!compact && <StreakGoals streak={streak} showHint={!compact} />}

      {streak.longestStreakWeeks > 0 && (
        <div className="ws-best">
          Best: {streak.longestStreakWeeks} week{streak.longestStreakWeeks === 1 ? '' : 's'}
        </div>
      )}
    </div>
  );
}
