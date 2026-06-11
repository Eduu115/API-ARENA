/** Challenges completed before ELO is shown publicly (matches backend + docs). */
export const MIN_RANKED_CHALLENGES = 3;

export function isUnranked(totalChallengesCompleted) {
  const n = Number(totalChallengesCompleted) || 0;
  return n < MIN_RANKED_CHALLENGES;
}

export function challengesUntilRanked(totalChallengesCompleted) {
  const n = Number(totalChallengesCompleted) || 0;
  return Math.max(0, MIN_RANKED_CHALLENGES - n);
}
