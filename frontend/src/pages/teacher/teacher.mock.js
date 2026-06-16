export function formatTeacherDate(iso, locale) {
  if (!iso) return "—";
  const d = new Date(iso);
  const loc = locale?.startsWith("es") ? "es-ES" : "en-US";
  return d.toLocaleDateString(loc, { year: "numeric", month: "short", day: "2-digit" });
}
