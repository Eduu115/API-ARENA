/** Leaderboard view modes and column helpers. */

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

export function getTableColumns(mode) {
  switch (mode) {
    case 'elo':
      return [
        { key: 'rank', label: 'Rank', align: 'center' },
        { key: 'avatar', label: '', align: 'left' },
        { key: 'player', label: 'Player', align: 'left' },
        { key: 'primary', label: 'ELO', align: 'left' },
        { key: 'secondary', label: 'Level', align: 'right' },
        { key: 'tertiary', label: 'Solved', align: 'right' },
      ];
    case 'level':
      return [
        { key: 'rank', label: 'Rank', align: 'center' },
        { key: 'avatar', label: '', align: 'left' },
        { key: 'player', label: 'Player', align: 'left' },
        { key: 'primary', label: 'Level', align: 'left' },
        { key: 'secondary', label: 'XP', align: 'right' },
        { key: 'tertiary', label: 'Solved', align: 'right' },
      ];
    case 'challenge':
      return [
        { key: 'rank', label: 'Rank', align: 'center' },
        { key: 'avatar', label: '', align: 'left' },
        { key: 'player', label: 'Player', align: 'left' },
        { key: 'primary', label: 'Score', align: 'left' },
        { key: 'secondary', label: 'Time', align: 'right' },
        { key: 'tertiary', label: 'Date', align: 'right' },
      ];
    default:
      return [];
  }
}

export function getPodiumPrimary(row, mode) {
  switch (mode) {
    case 'elo':
      return { value: row.rating ?? 0, label: 'ELO' };
    case 'level':
      return { value: row.level ?? 0, label: 'LVL' };
    case 'challenge':
      return { value: row.score ?? 0, label: 'PTS' };
    default:
      return { value: 0, label: '' };
  }
}

export function getPodiumStats(row, mode) {
  switch (mode) {
    case 'elo':
      return [
        { value: row.rating ?? 0, label: 'ELO', color: 'var(--warn)' },
        { value: row.level ?? 0, label: 'Level', color: 'var(--cyan)' },
        { value: (row.experiencePoints ?? 0).toLocaleString(), label: 'XP', color: 'var(--purple)' },
        { value: row.totalChallengesCompleted ?? 0, label: 'Solved', color: 'var(--green)' },
      ];
    case 'level':
      return [
        { value: row.level ?? 0, label: 'Level', color: 'var(--cyan)' },
        { value: (row.experiencePoints ?? 0).toLocaleString(), label: 'XP', color: 'var(--purple)' },
        { value: row.rating ?? 0, label: 'ELO', color: 'var(--warn)' },
        { value: row.totalChallengesCompleted ?? 0, label: 'Solved', color: 'var(--green)' },
      ];
    case 'challenge':
      return [
        { value: (row.score ?? 0).toLocaleString(), label: 'Score', color: 'var(--warn)' },
        { value: formatCompletionTime(row.completionTimeSeconds), label: 'Time', color: 'var(--cyan)' },
        { value: row.completionTimeSeconds ?? '—', label: 'Seconds', color: 'var(--purple)' },
        { value: formatShortDate(row.createdAt), label: 'Date', color: 'var(--green)' },
      ];
    default:
      return [];
  }
}

export function getRowCells(row, mode) {
  switch (mode) {
    case 'elo':
      return {
        sub: `${row.totalChallengesCompleted ?? 0} challenges`,
        primary: { value: row.rating ?? 0, label: 'ELO', color: 'var(--warn)' },
        secondary: { value: row.level ?? 0, color: 'var(--cyan)' },
        tertiary: { value: row.totalChallengesCompleted ?? 0, color: 'var(--green)' },
      };
    case 'level':
      return {
        sub: `${(row.experiencePoints ?? 0).toLocaleString()} XP total`,
        primary: { value: row.level ?? 0, label: 'LVL', color: 'var(--cyan)' },
        secondary: { value: (row.experiencePoints ?? 0).toLocaleString(), color: 'var(--purple)' },
        tertiary: { value: row.totalChallengesCompleted ?? 0, color: 'var(--green)' },
      };
    case 'challenge':
      return {
        sub: 'Best submission',
        primary: { value: (row.score ?? 0).toLocaleString(), label: 'PTS', color: 'var(--warn)' },
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
