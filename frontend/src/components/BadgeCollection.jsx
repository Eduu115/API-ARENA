import { useCallback, useMemo, useState } from 'react';
import {
  MAX_DISPLAYED_PROFILE_BADGES,
  badgeStyleClass,
  countDisplayedBadges,
  displayedBadgeCodes,
} from '../lib/profileBadges';
import { TIER_LABEL, TIER_STYLE } from '../lib/achievementDisplay';
import './BadgeCollection.css';

export default function BadgeCollection({
  badges = [],
  loading = false,
  saving = false,
  onToggleDisplay,
  globalRank = null,
}) {
  const [error, setError] = useState(null);

  const displayedCount = useMemo(() => countDisplayedBadges(badges), [badges]);
  const atLimit = displayedCount >= MAX_DISPLAYED_PROFILE_BADGES;

  const handleToggle = useCallback(
    async (badge) => {
      if (!badge.unlocked || saving) return;
      setError(null);

      const current = displayedBadgeCodes(badges);
      let next;
      if (badge.displayed) {
        next = current.filter((c) => c !== badge.code);
      } else {
        if (current.length >= MAX_DISPLAYED_PROFILE_BADGES) {
          setError(`You can show at most ${MAX_DISPLAYED_PROFILE_BADGES} badges on your profile.`);
          return;
        }
        next = [...current, badge.code];
      }

      try {
        await onToggleDisplay(next);
      } catch (err) {
        setError(err?.message || 'Could not update displayed badges.');
      }
    },
    [badges, onToggleDisplay, saving],
  );

  if (loading) {
    return <p className="badge-collection-empty">Loading badges…</p>;
  }

  if (!badges.length) {
    return (
      <p className="badge-collection-empty">
        No badges yet. Complete challenges and milestones to unlock collectibles.
      </p>
    );
  }

  const rankHint =
    globalRank?.inTop25 || (globalRank?.rank >= 1 && globalRank?.rank <= 25)
      ? `You are #${globalRank.rank} globally — your rank badge is always visible on your profile.`
      : 'Global rank badges (TOP 25) are always shown when you qualify — they cannot be hidden.';

  return (
    <div className="badge-collection">
      <p className="badge-collection-lead">
        Unlock badges by playing. Pick up to {MAX_DISPLAYED_PROFILE_BADGES} to show on your public profile.
      </p>
      <div className="badge-collection-meta">
        <span className="badge-collection-counter">
          {displayedCount} / {MAX_DISPLAYED_PROFILE_BADGES} displayed
        </span>
        <span className="badge-collection-rank-hint">{rankHint}</span>
      </div>
      {error && (
        <div className="badge-collection-error" role="alert">
          {error}
        </div>
      )}
      <div className="badge-collection-grid">
        {badges.map((badge) => {
          const locked = !badge.unlocked;
          const tier = badge.tier || 'COMMON';
          const ts = TIER_STYLE[tier] || TIER_STYLE.COMMON;
          const canSelect = badge.unlocked && (badge.displayed || !atLimit);

          return (
            <button
              key={badge.code}
              type="button"
              className={[
                'badge-collection-card',
                locked ? 'badge-collection-card--locked' : 'badge-collection-card--unlocked',
                badge.displayed ? 'badge-collection-card--displayed' : '',
                !canSelect && badge.unlocked && !badge.displayed ? 'badge-collection-card--limit' : '',
              ].join(' ')}
              disabled={locked || saving || (!canSelect && !badge.displayed)}
              onClick={() => handleToggle(badge)}
              aria-pressed={badge.displayed}
              title={
                locked
                  ? badge.description
                  : badge.displayed
                    ? 'Click to hide from profile'
                    : 'Click to show on profile'
              }
            >
              <div className="badge-collection-card-top">
                <span
                  className={`profile-badge ${badgeStyleClass(badge.styleKey)} badge-collection-chip`}
                >
                  {badge.displayLabel}
                </span>
                <span
                  className="badge-collection-tier"
                  style={locked ? undefined : { color: ts.color }}
                >
                  {TIER_LABEL[tier] || tier}
                </span>
              </div>
              <div className="badge-collection-name">{badge.title}</div>
              <p className="badge-collection-desc">{badge.description}</p>
              <div className="badge-collection-state">
                {locked ? (
                  <span className="badge-collection-state-label badge-collection-state-label--locked">
                    Locked
                  </span>
                ) : badge.displayed ? (
                  <span className="badge-collection-state-label badge-collection-state-label--on">
                    On profile
                  </span>
                ) : (
                  <span className="badge-collection-state-label">Unlocked</span>
                )}
                {!locked && badge.unlockedAt && (
                  <time className="badge-collection-when" dateTime={badge.unlockedAt}>
                    {new Date(badge.unlockedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
