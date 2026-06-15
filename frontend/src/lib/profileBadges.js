/** Profile badge display helpers. */

export const MAX_DISPLAYED_PROFILE_BADGES = 5;

/** CSS class for a collectible badge chip from styleKey. */
export function badgeStyleClass(styleKey) {
  if (!styleKey) return 'profile-badge--collectible';
  return `profile-badge--${styleKey}`;
}

/** Highest global rank tier label, or null if outside top 25. */
export function globalRankTierLabel(rank) {
  const r = Number(rank);
  if (!Number.isFinite(r) || r < 1 || r > 25) return null;
  if (r === 1) return 'TOP 1 GLOBAL';
  if (r <= 3) return 'TOP 3';
  if (r <= 10) return 'TOP 10';
  return 'TOP 25';
}

export function globalRankTierClass(rank) {
  const r = Number(rank);
  if (!Number.isFinite(r) || r < 1 || r > 25) return null;
  if (r === 1) return 'profile-badge--top1';
  if (r <= 3) return 'profile-badge--top3';
  if (r <= 10) return 'profile-badge--top10';
  return 'profile-badge--top25';
}

export function formatGlobalRankPosition(rank) {
  const r = Number(rank);
  if (!Number.isFinite(r) || r < 1 || r > 25) return null;
  return `#${r} Global`;
}

export function countDisplayedBadges(badges) {
  if (!Array.isArray(badges)) return 0;
  return badges.filter((b) => b.unlocked && b.displayed).length;
}

export function displayedBadgeCodes(badges) {
  if (!Array.isArray(badges)) return [];
  return badges.filter((b) => b.unlocked && b.displayed).map((b) => b.code);
}
