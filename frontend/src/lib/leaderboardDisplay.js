/** Leaderboard view modes and column helpers. */

export const LEADERBOARD_MODE_IDS = ['elo', 'level', 'challenge'];

export const LEADERBOARD_MODES = [
  { id: 'elo', label: 'ELO', description: 'Competitive rating (3+ challenges)' },
  { id: 'level', label: 'Level', description: 'Account level and XP' },
  { id: 'challenge', label: 'Challenge', description: 'Best score on a challenge' },
];

export function formatCompletionTime(seconds) {
  if (seconds == null) return '—';
  const s = Number(seconds);
  if (!Number.isFinite(s) || s < 0) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function formatShortDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

export function getTableColumns(mode, t) {
  const col = (key) => t(`columns.${key}`);
  switch (mode) {
    case 'elo':
      return [
        { key: 'rank', label: col('rank'), align: 'center' },
        { key: 'avatar', label: '', align: 'left' },
        { key: 'player', label: col('player'), align: 'left' },
        { key: 'primary', label: col('elo'), align: 'left' },
        { key: 'secondary', label: col('level'), align: 'right' },
        { key: 'tertiary', label: col('solved'), align: 'right' },
      ];
    case 'level':
      return [
        { key: 'rank', label: col('rank'), align: 'center' },
        { key: 'avatar', label: '', align: 'left' },
        { key: 'player', label: col('player'), align: 'left' },
        { key: 'primary', label: col('level'), align: 'left' },
        { key: 'secondary', label: col('xp'), align: 'right' },
        { key: 'tertiary', label: col('solved'), align: 'right' },
      ];
    case 'challenge':
      return [
        { key: 'rank', label: col('rank'), align: 'center' },
        { key: 'avatar', label: '', align: 'left' },
        { key: 'player', label: col('player'), align: 'left' },
        { key: 'primary', label: col('score'), align: 'left' },
        { key: 'secondary', label: col('time'), align: 'right' },
        { key: 'tertiary', label: col('date'), align: 'right' },
      ];
    default:
      return [];
  }
}

export function getPodiumPrimary(row, mode, t) {
  switch (mode) {
    case 'elo':
      return { value: row.rating ?? 0, label: t('columns.elo') };
    case 'level':
      return { value: row.level ?? 0, label: t('labels.lvl') };
    case 'challenge':
      return { value: row.score ?? 0, label: t('labels.pts') };
    default:
      return { value: 0, label: '' };
  }
}

export function getPodiumStats(row, mode, t) {
  switch (mode) {
    case 'elo':
      return [
        { value: row.rating ?? 0, label: t('columns.elo'), color: 'var(--warn)' },
        { value: row.level ?? 0, label: t('columns.level'), color: 'var(--cyan)' },
        { value: (row.experiencePoints ?? 0).toLocaleString(), label: t('columns.xp'), color: 'var(--purple)' },
        { value: row.totalChallengesCompleted ?? 0, label: t('columns.solved'), color: 'var(--green)' },
      ];
    case 'level':
      return [
        { value: row.level ?? 0, label: t('columns.level'), color: 'var(--cyan)' },
        { value: (row.experiencePoints ?? 0).toLocaleString(), label: t('columns.xp'), color: 'var(--purple)' },
        { value: row.rating ?? 0, label: t('columns.elo'), color: 'var(--warn)' },
        { value: row.totalChallengesCompleted ?? 0, label: t('columns.solved'), color: 'var(--green)' },
      ];
    case 'challenge':
      return [
        { value: (row.score ?? 0).toLocaleString(), label: t('columns.score'), color: 'var(--warn)' },
        { value: formatCompletionTime(row.completionTimeSeconds), label: t('columns.time'), color: 'var(--cyan)' },
        { value: row.completionTimeSeconds ?? '—', label: t('columns.seconds'), color: 'var(--purple)' },
        { value: formatShortDate(row.createdAt), label: t('columns.date'), color: 'var(--green)' },
      ];
    default:
      return [];
  }
}

export function getRowCells(row, mode, t) {
  switch (mode) {
    case 'elo':
      return {
        sub: t('labels.challengesSub', { count: row.totalChallengesCompleted ?? 0 }),
        primary: { value: row.rating ?? 0, label: t('columns.elo'), color: 'var(--warn)' },
        secondary: { value: row.level ?? 0, color: 'var(--cyan)' },
        tertiary: { value: row.totalChallengesCompleted ?? 0, color: 'var(--green)' },
      };
    case 'level':
      return {
        sub: t('labels.xpTotalSub', { xp: (row.experiencePoints ?? 0).toLocaleString() }),
        primary: { value: row.level ?? 0, label: t('labels.lvl'), color: 'var(--cyan)' },
        secondary: { value: (row.experiencePoints ?? 0).toLocaleString(), color: 'var(--purple)' },
        tertiary: { value: row.totalChallengesCompleted ?? 0, color: 'var(--green)' },
      };
    case 'challenge':
      return {
        sub: t('labels.bestSubmission'),
        primary: { value: (row.score ?? 0).toLocaleString(), label: t('labels.pts'), color: 'var(--warn)' },
        secondary: { value: formatCompletionTime(row.completionTimeSeconds), color: 'var(--cyan)' },
        tertiary: { value: formatShortDate(row.createdAt), color: 'var(--muted)' },
      };
    default:
      return { sub: '', primary: { value: 0, label: '' }, secondary: { value: 0 }, tertiary: { value: 0 } };
  }
}

/** Map auth-service player rows (ELO / level). */
export function mapPlayerEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((e) => ({
    userId: e.userId,
    username: e.username,
    rank: e.rank,
    rating: e.rating,
    level: e.level,
    experiencePoints: e.experiencePoints,
    totalChallengesCompleted: e.totalChallengesCompleted,
  }));
}

/** Map leaderboard-service challenge rows. */
export function mapChallengeEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((e) => ({
    userId: e.userId,
    username: e.username,
    rank: e.rank,
    score: e.score,
    completionTimeSeconds: e.completionTimeSeconds,
    createdAt: e.createdAt,
  }));
}
