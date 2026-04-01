/**
 * Convierte líneas de logs de build/test en eventos para el reproductor de replay.
 * Intenta detectar peticiones HTTP y códigos de estado; el resto va como sys/test.
 */

const STEP_MS = 140;

function parseLogLine(line, sectionTag) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const reqMatch = trimmed.match(/^(GET|POST|PUT|DELETE|PATCH|OPTIONS)\s+(\S+)/i);
  if (reqMatch) {
    return {
      tag: "req",
      method: reqMatch[1].toUpperCase(),
      path: reqMatch[2],
    };
  }

  const resMatch = trimmed.match(/(?:HTTP\/[\d.]+\s+)?(\d{3})\b/);
  if (resMatch) {
    const status = parseInt(resMatch[1], 10);
    const timeMatch = trimmed.match(/(\d+)\s*ms/i);
    return {
      tag: "res",
      status,
      time: timeMatch ? parseInt(timeMatch[1], 10) : 0,
      content: trimmed,
    };
  }

  return { tag: sectionTag, content: trimmed };
}

function formatTs(msTotal) {
  const totalSec = msTotal / 1000;
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${String(mm).padStart(2, "0")}:${ss.toFixed(1).padStart(4, "0")}`;
}

/**
 * @param {string|null|undefined} buildLogs
 * @param {string|null|undefined} testLogs
 * @returns {Array<{ ts: string, tag: string, method?: string, path?: string, status?: number, time?: number, content?: string }>}
 */
export function logsToReplayEvents(buildLogs, testLogs) {
  const events = [];
  let ms = 0;

  function pushLine(sectionTag, line) {
    const parsed = parseLogLine(line, sectionTag);
    if (!parsed) return;
    ms += STEP_MS;
    events.push({ ts: formatTs(ms), ...parsed });
  }

  for (const line of (buildLogs || "").split("\n")) {
    pushLine("sys", line);
  }
  for (const line of (testLogs || "").split("\n")) {
    pushLine("test", line);
  }

  return events;
}
