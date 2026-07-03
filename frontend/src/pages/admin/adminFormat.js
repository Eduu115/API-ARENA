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

/** Human label for an admin's capability set: Supreme / Operational / BI / combinations. */
export function adminTypeLabel(caps) {
  if (!caps) return null;
  if (caps.length === 0) return "no capabilities";
  if (["MODERATION", "BI"].every((c) => caps.includes(c))) return "Supreme";
  return caps.map((c) => (c === "MODERATION" ? "Operational" : "BI")).join(" · ");
}
