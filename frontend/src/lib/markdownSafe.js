/** Safe markdown subset for the admin preview. Mirrors SafeMarkdown.java. */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function safeUrl(url) {
  if (url == null) return null;
  const trimmed = String(url).trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) return null;
  const ok = lower.startsWith("https://") || lower.startsWith("http://") || lower.startsWith("mailto:")
    || (trimmed.startsWith("/") && !trimmed.startsWith("//"));
  if (!ok) return null;
  if (/["<>\s']/.test(trimmed)) return null;
  return escapeHtml(trimmed);
}

function matchingParen(raw, open) {
  let depth = 0;
  for (let j = open; j < raw.length; j += 1) {
    const c = raw[j];
    if (c === "(") depth += 1;
    else if (c === ")") {
      depth -= 1;
      if (depth === 0) return j;
    }
  }
  return -1;
}

function inline(raw) {
  let out = "";
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === "`") {
      const end = raw.indexOf("`", i + 1);
      if (end > i) {
        out += `<code>${escapeHtml(raw.slice(i + 1, end))}</code>`;
        i = end + 1;
        continue;
      }
    }
    if (raw.startsWith("![", i)) {
      const next = appendLink(raw, i, true);
      if (next.end > i) {
        out += next.html;
        i = next.end;
        continue;
      }
    }
    if (raw[i] === "[") {
      const next = appendLink(raw, i, false);
      if (next.end > i) {
        out += next.html;
        i = next.end;
        continue;
      }
    }
    if (raw.startsWith("**", i) || raw.startsWith("__", i)) {
      const mark = raw.slice(i, i + 2);
      const end = raw.indexOf(mark, i + 2);
      if (end > i) {
        out += `<strong>${inline(raw.slice(i + 2, end))}</strong>`;
        i = end + 2;
        continue;
      }
    }
    if (raw[i] === "*" || (raw[i] === "_" && (i === 0 || !/[0-9A-Za-z]/.test(raw[i - 1])))) {
      const mark = raw[i];
      const end = raw.indexOf(mark, i + 1);
      const boundary = mark !== "_" || end + 1 === raw.length || !/[0-9A-Za-z]/.test(raw[end + 1] || "");
      if (end > i + 1 && boundary) {
        out += `<em>${inline(raw.slice(i + 1, end))}</em>`;
        i = end + 1;
        continue;
      }
    }
    out += escapeHtml(raw[i]);
    i += 1;
  }
  return out;
}

function appendLink(raw, i, image) {
  const labelStart = image ? i + 2 : i + 1;
  const close = raw.indexOf("]", labelStart);
  if (close < 0 || raw[close + 1] !== "(") return { end: i, html: "" };
  const urlEnd = matchingParen(raw, close + 1);
  if (urlEnd < 0) return { end: i, html: "" };
  const label = raw.slice(labelStart, close);
  const url = raw.slice(close + 2, urlEnd).trim();
  const safe = safeUrl(url);
  let html;
  if (image) {
    html = safe == null ? escapeHtml(label) : `<img src="${safe}" alt="${escapeHtml(label)}">`;
  } else if (safe == null) {
    html = escapeHtml(label);
  } else {
    html = `<a href="${safe}" rel="noopener noreferrer">${inline(label)}</a>`;
  }
  return { end: urlEnd + 1, html };
}

function isUl(line) {
  return line.startsWith("- ") || line.startsWith("* ");
}

function isOl(line) {
  return /^\d+\.\s+/.test(line);
}

function isSeparator(line) {
  const trimmed = line.trim();
  return trimmed.includes("-") && /^[\s|:-]+$/.test(trimmed);
}

function isTableStart(lines, i) {
  return i + 1 < lines.length && lines[i].includes("|") && isSeparator(lines[i + 1]);
}

function isBlockStart(lines, i) {
  const line = lines[i];
  return line.startsWith("```") || line.startsWith(">") || line.startsWith("#")
    || isUl(line) || isOl(line) || isTableStart(lines, i);
}

function cells(line) {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((part) => part.trim());
}

export function toHtml(markdown) {
  if (!markdown) return "";
  const lines = String(markdown).replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
  let html = "";
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      i += 1;
      const code = [];
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(escapeHtml(lines[i]));
        i += 1;
      }
      if (i < lines.length) i += 1;
      html += `<pre><code>${code.join("\n")}</code></pre>\n`;
      continue;
    }
    if (isTableStart(lines, i)) {
      const header = cells(lines[i]);
      i += 2;
      html += `<table><thead><tr>${header.map((cell) => `<th>${inline(cell)}</th>`).join("")}</tr></thead><tbody>`;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() && !isSeparator(lines[i])) {
        html += `<tr>${cells(lines[i]).map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`;
        i += 1;
      }
      html += "</tbody></table>\n";
      continue;
    }
    if (line.startsWith(">")) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quote.push(inline(lines[i].replace(/^>\s?/, "")));
        i += 1;
      }
      html += `<blockquote><p>${quote.join(" ")}</p></blockquote>\n`;
      continue;
    }
    if (line.startsWith("### ")) {
      html += `<h3>${inline(line.slice(4))}</h3>\n`;
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      html += `<h2>${inline(line.slice(3))}</h2>\n`;
      i += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      html += `<h1>${inline(line.slice(2))}</h1>\n`;
      i += 1;
      continue;
    }
    if (isUl(line)) {
      html += "<ul>";
      while (i < lines.length && isUl(lines[i])) {
        html += `<li>${inline(lines[i].replace(/^[-*]\s+/, ""))}</li>`;
        i += 1;
      }
      html += "</ul>\n";
      continue;
    }
    if (isOl(line)) {
      html += "<ol>";
      while (i < lines.length && isOl(lines[i])) {
        html += `<li>${inline(lines[i].replace(/^\d+\.\s+/, ""))}</li>`;
        i += 1;
      }
      html += "</ol>\n";
      continue;
    }
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const paragraph = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines, i)) {
      paragraph.push(inline(lines[i]));
      i += 1;
    }
    html += `<p>${paragraph.join(" ")}</p>\n`;
  }
  return html;
}
