export function fmtDuration(seconds) {
  const s = Number(seconds) || 0;
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export function isOnline(lastSeenAt) {
  if (!lastSeenAt) return false;
  const t = new Date(lastSeenAt).getTime();
  return !Number.isNaN(t) && Date.now() - t < 5 * 60 * 1000;
}

const CAP_LABELS = [
  ["MODERATION", "Operational"],
  ["BI", "BI"],
  ["CONTENT", "Content"],
];

/** Human label for an admin's capability set: Supreme, or combinations such as Operational + Content. */
export function adminTypeLabel(caps) {
  if (!caps) return null;
  if (caps.length === 0) return "no capabilities";
  if (CAP_LABELS.every(([code]) => caps.includes(code))) return "Supreme";
  const known = new Set(CAP_LABELS.map(([code]) => code));
  const parts = CAP_LABELS.filter(([code]) => caps.includes(code)).map(([, label]) => label);
  for (const code of caps) {
    if (!known.has(code)) parts.push(code);
  }
  return parts.join(" + ");
}
