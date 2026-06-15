import {
  badgeStyleClass,
  formatGlobalRankPosition,
  globalRankTierClass,
  globalRankTierLabel,
} from '../lib/profileBadges';
import './profileBadges.css';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Profile badge chips: global rank (always when qualified) + user-selected collectibles.
 */
export default function ProfileBadges({
  globalRank = null,
  displayedBadges = [],
  showRole = false,
  showSince = false,
  profile = null,
  className = '',
}) {
  const rank = globalRank?.rank;
  const tierLabel = globalRankTierLabel(rank);
  const tierClass = globalRankTierClass(rank);
  const rankPosition = formatGlobalRankPosition(rank);

  const collectibles = Array.isArray(displayedBadges) ? displayedBadges : [];

  const hasAny =
    tierLabel ||
    collectibles.length > 0 ||
    (showRole && profile?.role) ||
    (showSince && profile?.createdAt);

  if (!hasAny) return null;

  return (
    <div className={`profile-badges${className ? ` ${className}` : ''}`}>
      {tierLabel && tierClass && (
        <>
          <span className={`profile-badge profile-badge--mandatory ${tierClass}`} title="Always shown when in top 25">
            {tierLabel}
          </span>
          {rankPosition && (
            <span className="profile-badge profile-badge--rank-pos profile-badge--mandatory">{rankPosition}</span>
          )}
        </>
      )}
      {collectibles.map((badge) => (
        <span
          key={badge.code}
          className={`profile-badge ${badgeStyleClass(badge.styleKey)}`}
          title={badge.title || badge.displayLabel}
        >
          {badge.displayLabel}
        </span>
      ))}
      {showRole && profile?.role && (
        <span className="profile-badge profile-badge--role">{profile.role}</span>
      )}
      {showSince && profile?.createdAt && (
        <span className="profile-badge profile-badge--since">
          Since {formatDate(profile.createdAt)}
        </span>
      )}
    </div>
  );
}
