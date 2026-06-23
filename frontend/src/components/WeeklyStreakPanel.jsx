import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

function isoDayIndexUtc() {
  const d = new Date().getUTCDay();
  return d === 0 ? 6 : d - 1;
}

function formatCountdown(weekEndsAt, t) {
  if (!weekEndsAt) return '';
  const ms = new Date(weekEndsAt).getTime() - Date.now();
  if (ms <= 0) return t('streak.weekEndingSoon');
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return t('streak.countdownDays', { days, hours });
  const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return t('streak.countdownHours', { hours, mins });
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

function StreakGoals({ streak, large = false, showHint = true, layout = 'stack', t }) {
  return (
    <div className={`ws-goals${layout === 'wide' ? ' ws-goals--wide' : ''}`}>
      {showHint && (
        <p className="ws-goals-hint">{t('streak.goalsHint')}</p>
      )}
      <ProgressRow
        label={t('streak.pathA')}
        value={streak.xpEarnedThisWeek ?? 0}
        target={streak.xpTarget ?? 120}
        color="var(--purple)"
        large={large}
      />
      <div className="ws-goals-or" role="separator" aria-label={t('streak.or')}>
        <span className="ws-goals-or-line" aria-hidden />
        <span className="ws-goals-or-text">{t('streak.or')}</span>
        <span className="ws-goals-or-line" aria-hidden />
      </div>
      <ProgressRow
        label={t('streak.pathB', {
          runs: streak.qualifyingRunsTarget ?? 3,
          score: streak.qualifyingScoreMin ?? 650,
        })}
        value={streak.qualifyingRunsThisWeek ?? 0}
        target={streak.qualifyingRunsTarget ?? 3}
        color="var(--cyan)"
        large={large}
      />
    </div>
  );
}

function WeekGrid({ streak, todayIdx, large = false, dayLabels }) {
  return (
    <>
      <div className={`db-streak-grid${large ? ' db-streak-grid--lg' : ''}`} aria-hidden>
        {dayLabels.map((label, i) => {
          let cls = 'db-streak-dot';
          if (large) cls += ' db-streak-dot--lg';
          if (streak.qualifiedThisWeek && i <= todayIdx) cls += ' active';
          if (i === todayIdx) cls += ' today';
          return <div key={`${label}-${i}`} className={cls} title={label} />;
        })}
      </div>
      <div className={`db-streak-days${large ? ' db-streak-days--lg' : ''}`} aria-hidden>
        {dayLabels.map((label, i) => (
          <div key={`lbl-${i}`} className="db-streak-day-label">{label}</div>
        ))}
      </div>
    </>
  );
}

function weekUnitLabel(count, t) {
  if (count === 1) return t('streak.weekStreak');
  return t('streak.weeksStreak');
}

export default function WeeklyStreakPanel({ streak, variant = 'default' }) {
  const { t } = useTranslation('dashboard');
  const compact = variant === 'compact';
  const minimal = variant === 'minimal';
  const hero = variant === 'hero';
  const todayIdx = isoDayIndexUtc();
  const dayLabels = t('streak.days', { returnObjects: true });

  const statusLine = useMemo(() => {
    if (!streak) return t('streak.loadingShort');
    if (streak.qualifiedThisWeek) {
      if (streak.qualifiedVia === 'BOTH') return t('streak.securedViaBoth');
      if (streak.qualifiedVia === 'RUNS') return t('streak.securedViaRuns');
      return t('streak.securedViaXp');
    }
    return formatCountdown(streak.weekEndsAt, t);
  }, [streak, t]);

  if (!streak) {
    return (
      <div className={`ws-panel${compact ? ' ws-compact' : ''}${minimal ? ' ws-minimal ws-minimal--loading' : ''}${hero ? ' ws-hero ws-hero--loading' : ''}`}>
        <div className="ws-muted">{minimal ? t('streak.loadingShort') : t('streak.loading')}</div>
      </div>
    );
  }

  const streakWeeks = streak.currentStreakWeeks ?? 0;

  if (minimal) {
    return (
      <div
        className={`ws-minimal${streak.qualifiedThisWeek ? ' ws-minimal--secured' : ''}`}
        aria-label={t('streak.summaryAria')}
      >
        <span className="ws-minimal-flame" aria-hidden>⌁</span>
        <span className="ws-minimal-count">{streakWeeks}</span>
        <span className="ws-minimal-unit">
          {t('streak.week', { count: streakWeeks })}
        </span>
        {streak.qualifiedThisWeek && (
          <span className="ws-minimal-badge">{t('streak.secured')}</span>
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
        aria-label={t('streak.panelAria')}
      >
        <div className="ws-hero-glow" aria-hidden />
        <div className="ws-hero-inner">
          <div className="ws-hero-top">
            <div className="ws-hero-main">
              <div className="ws-hero-eyebrow">{t('streak.eyebrow')}</div>
              <div className="ws-hero-count-block">
                <span className="ws-hero-flame" aria-hidden>⌁</span>
                <div className="ws-hero-count-text">
                  <span className="ws-hero-num">{streakWeeks}</span>
                  <span className="ws-hero-unit">
                    {weekUnitLabel(streakWeeks, t)}
                  </span>
                </div>
              </div>
              {streak.qualifiedThisWeek && (
                <span className="ws-hero-badge">{t('streak.weekSecured')}</span>
              )}
              <p className="ws-hero-status">{statusLine}</p>
              {streak.longestStreakWeeks > 0 && (
                <p className="ws-hero-best">
                  {t('streak.personalBest', { count: streak.longestStreakWeeks })}
                </p>
              )}
            </div>

            <div className="ws-hero-week">
              <div className="ws-hero-side-label">{t('streak.thisIsoWeek')}</div>
              <WeekGrid streak={streak} todayIdx={todayIdx} large dayLabels={dayLabels} />
            </div>
          </div>

          <div className="ws-hero-goals-band">
            <StreakGoals streak={streak} large layout="wide" t={t} />
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
          {weekUnitLabel(streakWeeks, t)}
        </span>
      </div>

      <WeekGrid streak={streak} todayIdx={todayIdx} dayLabels={dayLabels} />

      <div className="ws-status-line">{statusLine}</div>

      {streak.qualifiedThisWeek && (
        <span className="ws-hero-badge ws-hero-badge--inline">{t('streak.weekSecured')}</span>
      )}

      {!compact && <StreakGoals streak={streak} showHint={!compact} t={t} />}

      {streak.longestStreakWeeks > 0 && (
        <div className="ws-best">
          {t('streak.best', { count: streak.longestStreakWeeks })}
        </div>
      )}
    </div>
  );
}
