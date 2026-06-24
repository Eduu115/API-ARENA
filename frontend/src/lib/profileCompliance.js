/** Minimum age gate aligned with backend ComplianceRules.MIN_AGE_YEARS */
export const MIN_PROFILE_AGE = 14;

export function getAgeFromIsoDate(isoDate) {
  const dob = new Date(isoDate);
  if (Number.isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

export const TODAY_ISO = new Date().toISOString().slice(0, 10);
