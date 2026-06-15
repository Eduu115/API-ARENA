import {
  formatGlobalRankPosition,
  globalRankTierClass,
  globalRankTierLabel,
  hasAlphaCohort,
  hasBetaCohort,
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
 * Shared profile badges: global rank (top 25), alpha/beta cohort, role, member since.
 */
export default function ProfileBadges({
  profile,
  achievements = [],
  globalRank = null,
  showRole = true,
  showSince = false,
  className = '',
}) {
  const rank = globalRank?.rank;
  const tierLabel = globalRankTierLabel(rank);
  const tierClass = globalRankTierClass(rank);
  const rankPosition = formatGlobalRankPosition(rank);
  const alpha = hasAlphaCohort(profile, achievements);
  const beta = hasBetaCohort(profile, achievements);

  const hasAny =
    tierLabel ||
    alpha ||
    beta ||
    (showRole && profile?.role) ||
    (showSince && profile?.createdAt);

  if (!hasAny) return null;

  return (
    <div className={`profile-badges${className ? ` ${className}` : ''}`}>
      {tierLabel && tierClass && (
        <>
          <span className={`profile-badge ${tierClass}`}>{tierLabel}</span>
          {rankPosition && (
            <span className="profile-badge profile-badge--rank-pos">{rankPosition}</span>
          )}
        </>
      )}
      {alpha && <span className="profile-badge profile-badge--alpha">Alpha</span>}
      {beta && <span className="profile-badge profile-badge--beta">Beta</span>}
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
