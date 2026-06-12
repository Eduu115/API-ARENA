export const TIER_LABEL = { COMMON: 'Common', RARE: 'Rare', EPIC: 'Epic', LEGEND: 'Legend' };

export const TIER_STYLE = {
  COMMON: {
    color: 'var(--green)',
    accent: 'var(--green)',
    glow: 'rgba(0, 255, 163, 0.16)',
    bg: 'rgba(0, 255, 163, 0.06)',
  },
  RARE: {
    color: 'var(--cyan)',
    accent: 'var(--cyan)',
    glow: 'rgba(0, 229, 255, 0.18)',
    bg: 'rgba(0, 229, 255, 0.06)',
  },
  EPIC: {
    color: 'var(--purple)',
    accent: 'var(--purple)',
    glow: 'rgba(168, 85, 247, 0.2)',
    bg: 'rgba(168, 85, 247, 0.07)',
  },
  LEGEND: {
    color: 'var(--warn)',
    accent: 'var(--warn)',
    glow: 'rgba(255, 184, 0, 0.22)',
    bg: 'rgba(255, 184, 0, 0.07)',
  },
};

export const ACH_ICON = {
  gate: '⬡',
  target: '◎',
  mail: '✉',
  flame: '⌁',
  star: '★',
  bolt: '⚡',
  crown: '♔',
  trophy: '◈',
  diamond: '◇',
  code: '⌘',
  clock: '◷',
  link: '⛓',
  rank: '▲',
};

export function achievementIcon(iconKey) {
  if (iconKey && ACH_ICON[iconKey]) return ACH_ICON[iconKey];
  return '◆';
}

export function achievementTierVars(tier) {
  const ts = TIER_STYLE[tier] || TIER_STYLE.COMMON;
  return {
    '--ach-accent': ts.accent,
    '--ach-color': ts.color,
    '--ach-glow': ts.glow,
    '--ach-bg': ts.bg,
  };
}

/** Most recently unlocked achievements first. */
export function sortAchievementsRecentFirst(list) {
  return [...list].sort((a, b) => {
    if (a.unlocked && b.unlocked) {
      return new Date(b.unlockedAt) - new Date(a.unlockedAt);
    }
    if (a.unlocked) return -1;
    if (b.unlocked) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export function recentUnlockedAchievements(list, limit = 4) {
  return sortAchievementsRecentFirst(list.filter((a) => a.unlocked && a.unlockedAt)).slice(0, limit);
}
