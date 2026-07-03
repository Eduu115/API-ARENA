import { getAudit } from "./adminApi.js";

const HIGH_RISK = new Set(["DELETE", "IMPERSONATE"]);
const MODERATION = new Set(["BAN", "UNBAN", "WARN", "CLEAR_WARNINGS"]);

/** Pull every audit page (API caps size at 100). */
export async function fetchAllAuditEvents() {
  const size = 100;
  let page = 0;
  let totalPages = 1;
  const events = [];
  while (page < totalPages) {
    const res = await getAudit({ page, size });
    events.push(...(res?.content ?? []));
    totalPages = res?.totalPages ?? 1;
    page += 1;
  }
  return events;
}

function countBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const k = keyFn(item);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function parseTs(iso) {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function fmtIso(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function pct(part, total) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

/** Build structured stats + human-readable narrative blocks from raw audit rows. */
export function buildAuditReport(events, { generatedBy } = {}) {
  const sorted = [...events].sort((a, b) => {
    const ta = parseTs(a.createdAt) ?? 0;
    const tb = parseTs(b.createdAt) ?? 0;
    return tb - ta;
  });

  const timestamps = sorted.map((e) => parseTs(e.createdAt)).filter((t) => t != null);
  const periodStart = timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : null;
  const periodEnd = timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;

  const byAction = countBy(sorted, (e) => String(e.action || "UNKNOWN").toUpperCase());
  const byActor = countBy(sorted, (e) => e.actorEmail || "unknown");

  const highRisk = sorted.filter((e) => HIGH_RISK.has(String(e.action || "").toUpperCase()));
  const moderation = sorted.filter((e) => MODERATION.has(String(e.action || "").toUpperCase()));
  const bans = sorted.filter((e) => String(e.action).toUpperCase() === "BAN").length;
  const unbans = sorted.filter((e) => String(e.action).toUpperCase() === "UNBAN").length;
  const warns = sorted.filter((e) => String(e.action).toUpperCase() === "WARN").length;

  const topActor = byActor[0];
  const topAction = byAction[0];
  const total = sorted.length;

  const narratives = [];

  if (total === 0) {
    narratives.push(
      "No administrative actions have been recorded in the audit log yet. Once moderators or admins perform actions in the console, they will appear here and in future exports."
    );
  } else {
    narratives.push(
      `This report analyses ${total} administrative event${total === 1 ? "" : "s"} captured in the API Arena admin audit log` +
        (periodStart && periodEnd
          ? `, spanning from ${fmtIso(periodStart)} through ${fmtIso(periodEnd)}.`
          : ".")
    );

    if (topAction) {
      narratives.push(
        `The most frequent action type is ${topAction[0]} (${topAction[1]} occurrence${topAction[1] === 1 ? "" : "s"}, ${pct(topAction[1], total)} of all events). ` +
          (byAction.length > 1
            ? `This is followed by ${byAction.slice(1, 4).map(([a, c]) => `${a} (${c})`).join(", ")}.`
            : "")
      );
    }

    if (moderation.length > 0) {
      narratives.push(
        `Moderation-related activity accounts for ${pct(moderation.length, total)} of the log (${moderation.length} events): ` +
          `${bans} ban${bans === 1 ? "" : "s"}, ${unbans} unban${unbans === 1 ? "" : "s"}, and ${warns} warning${warns === 1 ? "" : "s"}. ` +
          (bans > unbans
            ? "Ban volume exceeds unbans, indicating a net tightening of access during this window."
            : bans < unbans
              ? "More unbans than bans were recorded, suggesting account reinstatements dominated moderation work."
              : "Bans and unbans are balanced in this period.")
      );
    } else {
      narratives.push("No moderation actions (ban, unban, warn) appear in this dataset.");
    }

    if (highRisk.length > 0) {
      narratives.push(
        `${highRisk.length} high-privilege action${highRisk.length === 1 ? "" : "s"} (${[...new Set(highRisk.map((e) => e.action))].join(", ")}) ` +
          `${highRisk.length === 1 ? "was" : "were"} logged. These warrant explicit review: impersonation grants full session access as another user, and deletions are irreversible under GDPR erasure.`
      );
    } else {
      narratives.push("No DELETE or IMPERSONATE actions were recorded — elevated-risk operations were not used in this period.");
    }

    if (topActor) {
      narratives.push(
        `${topActor[0]} is the most active administrator (${topActor[1]} action${topActor[1] === 1 ? "" : "s"}, ${pct(topActor[1], total)} of the total). ` +
          (byActor.length > 1
            ? `The next most active accounts are ${byActor.slice(1, 3).map(([e, c]) => `${e} (${c})`).join(" and ")}.`
            : "Only one administrator account appears in this log.")
      );
    }

    const recentSensitive = highRisk.slice(0, 5);
    if (recentSensitive.length > 0) {
      const lines = recentSensitive.map(
        (e) =>
          `• ${fmtIso(e.createdAt)} — ${e.action} by ${e.actorEmail} on ${e.targetUsername || e.targetUserId || "n/a"}${e.detail ? ` (${e.detail})` : ""}`
      );
      narratives.push(`Recent high-privilege events:\n${lines.join("\n")}`);
    }
  }

  return {
    meta: {
      product: "API Arena",
      reportType: "admin_audit",
      exportedAt: new Date().toISOString(),
      generatedBy: generatedBy ?? null,
      eventCount: total,
      periodStart,
      periodEnd,
    },
    summary: {
      totalEvents: total,
      uniqueActors: byActor.length,
      uniqueActionTypes: byAction.length,
      moderationEvents: moderation.length,
      bans,
      unbans,
      warns,
      highRiskEvents: highRisk.length,
      byAction: Object.fromEntries(byAction),
      byActor: Object.fromEntries(byActor),
    },
    narrative: narratives,
    events: sorted,
  };
}

function stampFilename(ext) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `api-arena-audit-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.${ext}`;
}

export function downloadAuditJson(report) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = stampFilename("json");
  a.click();
  URL.revokeObjectURL(url);
}

const PDF = {
  margin: 48,
  footerH: 40,
  line: 14,
  lineSm: 11,
  accent: [0, 168, 196],
  accent2: [108, 58, 220],
  ink: [28, 32, 42],
  muted: [100, 108, 124],
};

function pageBottom(doc) {
  return doc.internal.pageSize.getHeight() - PDF.footerH;
}

function ensureSpace(doc, y, need) {
  if (y + need > pageBottom(doc)) {
    doc.addPage();
    drawHeader(doc);
    return PDF.margin + 10;
  }
  return y;
}

function drawHeader(doc) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PDF.accent);
  doc.rect(0, 0, w, 6, "F");
  doc.setFillColor(...PDF.accent2);
  doc.rect(0, 6, w, 3, "F");
}

function writeLines(doc, lines, x, y, lineH = PDF.line) {
  for (const line of lines) {
    y = ensureSpace(doc, y, lineH);
    doc.text(line, x, y);
    y += lineH;
  }
  return y;
}

function writeParagraph(doc, text, x, y, maxW) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...PDF.ink);
  const chunks = String(text).split(/\n/);
  for (const chunk of chunks) {
    if (!chunk.trim()) {
      y += 6;
      continue;
    }
    const lines = doc.splitTextToSize(chunk, maxW);
    y = writeLines(doc, lines, x, y, PDF.line);
  }
  return y + 6;
}

function writeLabelValue(doc, label, value, x, y, labelW, maxW) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PDF.muted);
  doc.text(label, x, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF.ink);
  const lines = doc.splitTextToSize(value, maxW);
  if (lines.length <= 1) {
    y = ensureSpace(doc, y, PDF.line);
    doc.text(lines[0] ?? "—", x + labelW, y);
    return y + PDF.line;
  }
  y = ensureSpace(doc, y, PDF.line);
  doc.text(lines[0], x + labelW, y);
  y += PDF.line;
  for (let i = 1; i < lines.length; i += 1) {
    y = ensureSpace(doc, y, PDF.line);
    doc.text(lines[i], x + labelW, y);
    y += PDF.line;
  }
  return y;
}

function writeSectionTitle(doc, title, x, y) {
  y = ensureSpace(doc, y, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PDF.accent);
  doc.text(title, x, y);
  doc.setDrawColor(...PDF.accent);
  doc.setLineWidth(0.6);
  doc.line(x, y + 4, x + 120, y + 4);
  return y + 22;
}

function writeEventBlock(doc, e, x, y, contentW) {
  const target = e.targetUsername || (e.targetUserId ? `#${e.targetUserId}` : "—");
  const rows = [
    ["When", fmtIso(e.createdAt)],
    ["Action", String(e.action || "—")],
    ["Actor", e.actorEmail || "—"],
    ["Target", target],
  ];
  if (e.detail) rows.push(["Detail", String(e.detail)]);

  y = ensureSpace(doc, y, PDF.lineSm * rows.length + 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...PDF.accent2);
  doc.text(`${rows[1][1]}`, x, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...PDF.muted);
  doc.text(fmtIso(e.createdAt), x + contentW, y, { align: "right" });
  y += PDF.lineSm + 2;

  const labelW = 44;
  const valueW = contentW - labelW;
  for (const [label, value] of rows.slice(1)) {
    if (label === "Action") continue;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...PDF.muted);
    const labelLines = doc.splitTextToSize(`${label}:`, labelW - 4);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF.ink);
    const valueLines = doc.splitTextToSize(value, valueW);
    const rowLines = Math.max(labelLines.length, valueLines.length);
    y = ensureSpace(doc, y, rowLines * PDF.lineSm + 2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...PDF.muted);
    doc.text(labelLines, x, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF.ink);
    doc.text(valueLines, x + labelW, y);
    y += rowLines * PDF.lineSm + 2;
  }

  doc.setDrawColor(200, 204, 212);
  doc.setLineWidth(0.4);
  y = ensureSpace(doc, y, 10);
  doc.line(x, y, x + contentW, y);
  return y + 10;
}

function startSection(doc, title, y, x, minSpace = 120) {
  if (y > pageBottom(doc) - minSpace) {
    doc.addPage();
    drawHeader(doc);
    y = PDF.margin + 10;
  }
  return writeSectionTitle(doc, title, x, y);
}

/** Generate a readable PDF brief with narrative commentary on the audit data. */
export async function downloadAuditPdf(report) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const contentW = w - PDF.margin * 2;
  let y = PDF.margin;

  drawHeader(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...PDF.ink);
  doc.text("API Arena", PDF.margin, y);
  y += 28;
  doc.setFontSize(16);
  doc.setTextColor(...PDF.accent2);
  doc.text("Administrative Audit Report", PDF.margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF.muted);
  doc.text(`Generated ${fmtIso(report.meta.exportedAt)}`, PDF.margin, y);
  if (report.meta.generatedBy) {
    y += 12;
    doc.text(`Requested by ${report.meta.generatedBy}`, PDF.margin, y);
  }
  y += 24;

  y = writeSectionTitle(doc, "Executive summary", PDF.margin, y);
  for (const para of report.narrative) {
    y = writeParagraph(doc, para, PDF.margin, y, contentW);
  }

  y = writeSectionTitle(doc, "Key metrics", PDF.margin, y);
  const metrics = [
    ["Total events", String(report.summary.totalEvents)],
    ["Unique administrators", String(report.summary.uniqueActors)],
    ["Action types", String(report.summary.uniqueActionTypes)],
    ["Moderation events", String(report.summary.moderationEvents)],
    ["Bans / Unbans", `${report.summary.bans} / ${report.summary.unbans}`],
    ["High-risk actions", String(report.summary.highRiskEvents)],
    ["Period start", fmtIso(report.meta.periodStart)],
    ["Period end", fmtIso(report.meta.periodEnd)],
  ];
  for (const [label, value] of metrics) {
    y = writeLabelValue(doc, label, value, PDF.margin, y, 160, contentW - 160);
  }
  y += 10;

  y = startSection(doc, "Actions breakdown", y, PDF.margin);
  const actions = Object.entries(report.summary.byAction);
  if (actions.length === 0) {
    y = writeParagraph(doc, "No actions recorded.", PDF.margin, y, contentW);
  } else {
    for (const [action, count] of actions) {
      y = writeLabelValue(
        doc,
        action,
        `${count} (${pct(count, report.summary.totalEvents)})`,
        PDF.margin,
        y,
        100,
        contentW - 100
      );
    }
  }
  y += 8;

  y = startSection(doc, "Administrator activity", y, PDF.margin);
  const actors = Object.entries(report.summary.byActor).slice(0, 20);
  for (const [email, count] of actors) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PDF.ink);
    const lines = doc.splitTextToSize(email, contentW - 36);
    y = ensureSpace(doc, y, lines.length * PDF.lineSm + 4);
    doc.text(lines, PDF.margin, y);
    doc.setTextColor(...PDF.muted);
    doc.text(String(count), PDF.margin + contentW, y, { align: "right" });
    y += lines.length * PDF.lineSm + 6;
  }

  if (report.events.length > 0) {
    doc.addPage();
    drawHeader(doc);
    y = PDF.margin + 10;
    y = writeSectionTitle(doc, "Event log (appendix)", PDF.margin, y);
    y = writeParagraph(
      doc,
      `${report.events.length} event${report.events.length === 1 ? "" : "s"} in chronological order (newest first). Each entry is expanded so long details and email addresses wrap cleanly.`,
      PDF.margin,
      y,
      contentW
    );
    for (const e of report.events) {
      y = writeEventBlock(doc, e, PDF.margin, y, contentW);
    }
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PDF.muted);
    doc.text(`API Arena · Admin audit · Page ${i} of ${pages}`, PDF.margin, doc.internal.pageSize.getHeight() - 24);
  }

  doc.save(stampFilename("pdf"));
}

// ponytail: self-check — narrative must mention event count when events exist
if (import.meta.env?.DEV) {
  const sample = buildAuditReport([
    { id: 1, action: "BAN", actorEmail: "a@test", targetUserId: 2, targetUsername: "u", detail: "spam", createdAt: "2026-01-01T10:00:00" },
  ]);
  console.assert(sample.summary.totalEvents === 1 && sample.narrative.length >= 3, "adminAuditReport self-check");
}
