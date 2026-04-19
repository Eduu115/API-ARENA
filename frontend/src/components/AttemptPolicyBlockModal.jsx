import { useMsUntilIso, formatCountdownMs } from '../lib/challengeAttemptUtils';
import './AttemptPolicyBlockModal.css';

function formatUtcLine(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' }) + ' UTC';
  } catch {
    return iso;
  }
}

/**
 * Cooldown / daily-limit gate with live countdown (English UI per product rules).
 */
export default function AttemptPolicyBlockModal({
  open,
  blockReason,
  cooldownUntilIso,
  dailyLimitResetsAtIso,
  challengeTitle,
  onDismiss,
  primaryLabel = 'Back to challenge',
}) {
  const targetIso = blockReason === 'DAILY_LIMIT' ? dailyLimitResetsAtIso : cooldownUntilIso;
  const msLeft = useMsUntilIso(open ? targetIso : null);

  if (!open || !blockReason) return null;

  const isDaily = blockReason === 'DAILY_LIMIT';
  const title = isDaily ? 'Daily limit reached' : 'Cooldown active';
  const eyebrow = isDaily ? 'Fair play' : 'Challenge policy';
  const copy = isDaily
    ? `You have used all allowed submissions for this challenge today (UTC). You can start a new run after the reset time below.`
    : `You must wait before starting another run for this challenge. Time remaining until your next attempt is allowed:`;

  return (
    <div className="attempt-block-overlay" role="presentation" onClick={onDismiss}>
      <div
        className="attempt-block-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attempt-block-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="attempt-block-eyebrow">{eyebrow}</p>
        <h2 id="attempt-block-title" className="attempt-block-title">
          {title}
        </h2>
        {challengeTitle && (
          <p className="attempt-block-challenge">
            <span style={{ color: 'var(--dim)' }}>Challenge:</span> {challengeTitle}
          </p>
        )}
        {msLeft != null && (
          <>
            <div className="attempt-block-countdown" aria-live="polite">
              {formatCountdownMs(msLeft)}
            </div>
            <p className="attempt-block-countdown-label">
              {isDaily ? 'Time until daily reset' : 'Time remaining'}
            </p>
          </>
        )}
        <p className="attempt-block-copy">{copy}</p>
        {targetIso && (
          <p className="attempt-block-utc">
            Exact instant (UTC): {formatUtcLine(targetIso)}
          </p>
        )}
        <div className="attempt-block-actions">
          <button type="button" className="attempt-block-btn attempt-block-btn-primary" onClick={onDismiss}>
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
