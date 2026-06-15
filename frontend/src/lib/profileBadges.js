/** Alpha cohort cutoff (matches auth-service AchievementService.ALPHA_SEASON_END). */
export const ALPHA_SEASON_END_MS = Date.parse('2026-07-01T00:00:00');

export function hasAlphaCohort(profile, achievements = []) {
  if (achievements.some((a) => a.code === 'ALPHA_WAVE' && a.unlocked)) {
    return true;
  }
  if (profile?.createdAt) {
    const created = Date.parse(profile.createdAt);
    return Number.isFinite(created) && created < ALPHA_SEASON_END_MS;
  }
  return false;
}

export function hasBetaCohort(profile, achievements = []) {
  if (profile?.betaLegacy === true) {
    return true;
  }
  return achievements.some((a) => a.code === 'BETA_PIONEER' && a.unlocked);
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
