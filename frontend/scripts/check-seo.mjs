/**
 * Validates public SEO artifacts and, with --write, regenerates the ones
 * derived from locale copy, docs, and public challenge previews.
 *
 *   npm run seo:check
 *   npm run seo:check -- --write
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getDocDocuments } from "../src/pages/docs/docsContent.js";
import { LEGAL_DOCS } from "../src/pages/legal/legalContent.js";
import { getDocsUi } from "../src/pages/docs/docsUi.js";
import { legalHead } from "../src/seo/legalMeta.js";
import { GUBIA_URL } from "../src/brand/gubia.js";
import {
  AI_CRAWLERS,
  PRIVATE_PATHS,
  SEO_LASTMOD,
  SITE_URL,
  absoluteUrl,
  buildHeadMeta,
  challengePreviewGraph,
  docGraph,
  homeGraph,
  jsonLdTypes,
  metaDescription,
} from "../src/seo/site.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(root, "..");
const write = process.argv.includes("--write");
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function splitTuples(block) {
  const tuples = [];
  let depth = 0;
  let start = -1;
  let inStr = false;
  for (let i = 0; i < block.length; i++) {
    const c = block[i];
    if (inStr) {
      if (c === "'" && block[i + 1] === "'") {
        i += 1;
        continue;
      }
      if (c === "'") inStr = false;
      continue;
    }
    if (c === "'") {
      inStr = true;
      continue;
    }
    if (c === "(") {
      if (depth === 0) start = i;
      depth += 1;
    } else if (c === ")") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        tuples.push(block.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return tuples;
}

function sqlLiterals(tuple) {
  const out = [];
  let i = 0;
  while (i < tuple.length) {
    if (tuple[i] === "'") {
      let j = i + 1;
      let s = "";
      while (j < tuple.length) {
        if (tuple[j] === "'" && tuple[j + 1] === "'") {
          s += "'";
          j += 2;
          continue;
        }
        if (tuple[j] === "'") {
          j += 1;
          break;
        }
        s += tuple[j];
        j += 1;
      }
      out.push(s);
      i = j;
    } else {
      i += 1;
    }
  }
  return out;
}

/** Public preview fields only. Never reads endpoints, hints, or test JSON. */
function publicChallenges() {
  const files = [
    join(repoRoot, "docker/postgres/init-db.sql"),
    join(repoRoot, "docker/postgres/seed-extreme-challenges.sql"),
  ];
  const bySlug = new Map();
  for (const file of files) {
    const sql = readFileSync(file, "utf8");
    let cursor = 0;
    const marker = "INSERT INTO challenges";
    while ((cursor = sql.indexOf(marker, cursor)) !== -1) {
      const valuesAt = sql.indexOf("VALUES", cursor);
      const end = sql.indexOf("ON CONFLICT", valuesAt);
      const block = sql.slice(valuesAt + 6, end === -1 ? sql.length : end);
      for (const tuple of splitTuples(block)) {
        const strings = sqlLiterals(tuple);
        if (strings.length < 4) continue;
        const [title, slug, description, difficulty] = strings;
        if (!bySlug.has(slug)) bySlug.set(slug, { title, slug, description, difficulty });
      }
      cursor = end === -1 ? sql.length : end;
    }
  }
  return [...bySlug.values()];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

function robotsTxt() {
  const lines = [
    "# API Arena crawler policy",
    "#",
    "# Decision: ALLOW indexing of public pages.",
    "# Classic search crawlers and the AI crawlers named in this group share one",
    "# rule set, so they receive the same Allow and the same Disallow.",
    "# A separate User-agent group would NOT inherit these Disallow lines.",
    "#",
    "# Allowed: landing, docs, challenge previews, leaderboard, and legal pages",
    "# in /en and /es, plus /llms.txt and /llms-full.txt.",
    "# Disallowed: account, teacher, admin, and other private areas.",
    "# Public challenge pages are previews. Technical specs are not in the crawl surface.",
    "#",
    `# AI crawlers: ${AI_CRAWLERS.join(", ")}`,
    "",
    "User-agent: *",
    ...AI_CRAWLERS.map((bot) => `User-agent: ${bot}`),
    "",
    "Allow: /",
    "",
  ];
  for (const name of PRIVATE_PATHS) {
    for (const prefix of ["", "/en", "/es"]) {
      lines.push(`Disallow: ${prefix}/${name}`);
    }
  }
  lines.push("", `Sitemap: ${SITE_URL}/sitemap.xml`, "");
  return `${lines.join("\n")}`;
}

function renderLlms({ landingEn, landingEs, docsEn, docsEs, challenges }) {
  const faq = landingEn.cite.faq;
  const docLinks = (docs, locale) => docs.map((doc) => (
    `- [${doc.title}](${absoluteUrl(locale, `/docs/${doc.id}`)}): ${doc.summary}`
  )).join("\n");
  const challengeLinks = challenges.map((challenge) => (
    `- [${challenge.title}](${absoluteUrl("en", `/challenges/${challenge.slug}`)}) (${challenge.difficulty}). Spanish: ${absoluteUrl("es", `/challenges/${challenge.slug}`)}`
  )).join("\n");

  return `# API Arena

> ${faq[0].a}

${faq[1].a}

${faq[2].a}

${faq[3].a}

${faq[4].a}

Website: ${SITE_URL}
English: ${absoluteUrl("en", "/")}
Spanish: ${absoluteUrl("es", "/")}
x-default: ${absoluteUrl("en", "/")}
Alternate names: APIArena, API-Arena
Developed by Gubia.${(GUBIA_URL || "").trim().startsWith("http") ? ` ${(GUBIA_URL || "").trim()}` : ""}
Extended reference: ${SITE_URL}/llms-full.txt

## Who it is for

Students learning backend APIs, self-taught developers who want a measured score, and teachers who group students and review submissions.

## How it works

1. Pick a challenge and read the public preview.
2. Sign in and start a timed session to open the full requirements.
3. Upload a ZIP of a Maven Spring Boot project with pom.xml at the archive root.
4. An isolated sandbox builds and runs the API.
5. Real HTTP tests score functional behavior, performance, and REST design.
6. An AI review adds the remaining points. XP and ELO update. A replay is stored for debugging.

## Scoring

- Maximum score: 1000.
- Technical HTTP tests: up to 800 (functional correctness 300, performance 300, REST design 200).
- AI review: up to 200. The default rubric is heuristic. A language-model provider can be enabled per environment.
- XP is cumulative progress. ELO is a separate competitive rating. Repeating a challenge below your best score on it is penalized.

## Languages

The same public pages exist in English (/en/...) and Spanish (/es/...). Docs are translated. Challenge preview text is the catalog description.

## Docs

${docLinks(docsEn, "en")}

${docLinks(docsEs, "es")}

## Public challenges

Catalog: ${absoluteUrl("en", "/challenges")} and ${absoluteUrl("es", "/challenges")}

These links are previews (title, description, difficulty, category, time limit, XP). They do not include endpoint lists, hidden tests, or hints.

${challengeLinks}

## Crawler policy

Public pages may be indexed by search engines and by ${AI_CRAWLERS.join(", ")}. Private account, teacher, and admin areas are disallowed in ${SITE_URL}/robots.txt.
`;
}

function renderLlmsFull({ landingEn, landingEs, docsEn, docsEs, challenges }) {
  const faqBlock = (faq) => faq.map((item) => `### ${item.q}\n\n${item.a}`).join("\n\n");
  const docsBlock = (docs, locale) => docs.map((doc) => (
    `### ${doc.title}\n\n${absoluteUrl(locale, `/docs/${doc.id}`)}\n\n${doc.summary}`
  )).join("\n\n");
  const challengeBlock = challenges.map((challenge) => (
    `### ${challenge.title}\n\n- Difficulty: ${challenge.difficulty}\n- English preview: ${absoluteUrl("en", `/challenges/${challenge.slug}`)}\n- Spanish preview: ${absoluteUrl("es", `/challenges/${challenge.slug}`)}\n\n${challenge.description}`
  )).join("\n\n");

  return `# API Arena — extended reference

This file adds the Spanish answers, doc summaries, and the public preview text of each seeded challenge. It does not include endpoint contracts, hidden tests, or hints.

## English

${faqBlock(landingEn.cite.faq)}

## Español

${faqBlock(landingEs.cite.faq)}

## Docs (English)

${docsBlock(docsEn, "en")}

## Docs (español)

${docsBlock(docsEs, "es")}

## Challenge previews

${challengeBlock}
`;
}

function sitemapXml(paths) {
  const body = paths.map((page) => {
    const en = escapeXml(absoluteUrl("en", page.path));
    const es = escapeXml(absoluteUrl("es", page.path));
    const alternates = [
      `    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>`,
      `    <xhtml:link rel="alternate" hreflang="es" href="${es}"/>`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${en}"/>`,
    ].join("\n");
    const block = (loc) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${SEO_LASTMOD}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
${alternates}
  </url>`;
    return `${block(en)}\n${block(es)}`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;
}

function noscriptHtml(faq) {
  return `    <noscript>
      <article>
        <h1>API Arena</h1>
        <p>${escapeHtml(faq[0].a)}</p>
        <p>${escapeHtml(faq[1].a)}</p>
        <p>${escapeHtml(faq[2].a)}</p>
        <p>${escapeHtml(faq[3].a)} <a href="${absoluteUrl("en", "/docs/guia-para-empezar")}">Getting Started</a>. <a href="${absoluteUrl("es", "/")}">Español</a>. <a href="${SITE_URL}/llms.txt">llms.txt</a>.</p>
      </article>
    </noscript>`;
}

function replaceMarked(html, start, end, inner) {
  const s = html.indexOf(start);
  const e = html.indexOf(end);
  if (s < 0 || e < 0 || e < s) throw new Error(`Missing markers ${start}`);
  return `${html.slice(0, s + start.length)}\n${inner}\n    ${html.slice(e)}`;
}

function syncFile(rel, next) {
  const path = join(root, rel);
  let current = "";
  try {
    current = readFileSync(path, "utf8");
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  if (current !== next) {
    if (write) writeFileSync(path, next);
    else fail(`${rel} is out of date. Run: npm run seo:check -- --write`);
  }
}

function collectPages(landing, challengesJson, leaderboard, docs, challenges) {
  const pages = [];
  for (const locale of ["en", "es"]) {
    pages.push({
      locale,
      path: "/",
      title: landing[locale].meta.title,
      description: landing[locale].meta.description,
      changefreq: "weekly",
      priority: "1.0",
    });
    pages.push({
      locale,
      path: "/challenges",
      title: challengesJson[locale].pageTitle,
      description: challengesJson[locale].pageDescription,
      changefreq: "daily",
      priority: "0.9",
    });
    pages.push({
      locale,
      path: "/leaderboard",
      title: leaderboard[locale].pageTitle,
      description: leaderboard[locale].pageDescription,
      changefreq: "daily",
      priority: "0.7",
    });
    docs[locale].forEach((doc, index) => {
      pages.push({
        locale,
        path: `/docs/${doc.id}`,
        title: `${doc.title} — Docs`,
        description: doc.summary,
        changefreq: "monthly",
        priority: index === 0 ? "0.8" : "0.6",
      });
    });
    for (const slug of ["aviso-legal", "privacidad", "cookies", "terminos"]) {
      const head = legalHead(slug, locale, LEGAL_DOCS[slug]);
      pages.push({
        locale,
        path: `/${slug}`,
        title: head.title,
        description: head.description,
        changefreq: "yearly",
        priority: "0.3",
      });
    }
    for (const challenge of challenges) {
      pages.push({
        locale,
        path: `/challenges/${challenge.slug}`,
        title: `${challenge.title} ${challengesJson[locale].detail.pageTitleSuffix}`,
        description: metaDescription(challenge.description),
        changefreq: "weekly",
        priority: "0.6",
      });
    }
  }
  return pages;
}

function uniquePaths(pages) {
  const map = new Map();
  for (const page of pages) {
    if (!map.has(page.path)) {
      map.set(page.path, {
        path: page.path,
        changefreq: page.changefreq,
        priority: page.priority,
      });
    }
  }
  return [...map.values()];
}

const landing = {
  en: readJson(join(root, "src/i18n/locales/en/landing.json")),
  es: readJson(join(root, "src/i18n/locales/es/landing.json")),
};
const challengesJson = {
  en: readJson(join(root, "src/i18n/locales/en/challenges.json")),
  es: readJson(join(root, "src/i18n/locales/es/challenges.json")),
};
const leaderboard = {
  en: readJson(join(root, "src/i18n/locales/en/leaderboard.json")),
  es: readJson(join(root, "src/i18n/locales/es/leaderboard.json")),
};
const docs = {
  en: getDocDocuments("en"),
  es: getDocDocuments("es"),
};
const challenges = publicChallenges();
const pages = collectPages(landing, challengesJson, leaderboard, docs, challenges);
const paths = uniquePaths(pages);

const docIdsEn = docs.en.map((doc) => doc.id).join("|");
const docIdsEs = docs.es.map((doc) => doc.id).join("|");
if (docIdsEn !== docIdsEs) fail("English and Spanish docs ids differ");
if (challenges.length < 1) fail("No public challenges parsed from seed SQL");
for (const challenge of challenges) {
  if (/expectStatus|required_endpoints|test_suite/.test(challenge.description)) {
    fail(`Preview description for ${challenge.slug} contains spec fields`);
  }
}

const routes = readFileSync(join(root, "src/routes/RoutesConfig.jsx"), "utf8");
for (const snippet of [
  "element={<Landing",
  'path="challenges"',
  'path="challenges/:id"',
  'path="leaderboard"',
  'path="docs/:docId"',
  'path="aviso-legal"',
  'path="privacidad"',
  'path="cookies"',
  'path="terminos"',
]) {
  if (!routes.includes(snippet)) fail(`RoutesConfig is missing ${snippet}`);
}

const titles = { en: new Set(), es: new Set() };
const descriptions = { en: new Set(), es: new Set() };
for (const page of pages) {
  const meta = buildHeadMeta({
    title: page.title,
    description: page.description,
    path: page.path,
    locale: page.locale,
  });
  if (!meta.title || !meta.description || !meta.canonical) {
    fail(`Missing head meta for ${page.locale} ${page.path}`);
  }
  if (meta.canonical !== absoluteUrl(page.locale, page.path)) {
    fail(`Canonical mismatch for ${page.locale} ${page.path}`);
  }
  if (!meta.hreflang.en || !meta.hreflang.es || !meta.hreflang["x-default"]) {
    fail(`Missing hreflang for ${page.locale} ${page.path}`);
  }
  if (meta.hreflang["x-default"] !== meta.hreflang.en) {
    fail(`x-default is not English for ${page.path}`);
  }
  if (!meta.openGraph["og:image"] || !meta.twitter["twitter:image"]) {
    fail(`Missing share image for ${page.path}`);
  }
  if (meta.robots !== "index, follow") fail(`Public route is not indexable: ${page.path}`);
  if (titles[page.locale].has(meta.title)) fail(`Duplicate title ${meta.title}`);
  if (descriptions[page.locale].has(meta.description)) fail(`Duplicate description for ${page.path}`);
  titles[page.locale].add(meta.title);
  descriptions[page.locale].add(meta.description);
}

const privateMeta = buildHeadMeta({ title: "Sign in", description: "Sign in", path: "/login", locale: "en" });
if (privateMeta.robots !== "noindex, nofollow") fail("Login is indexable");

const home = homeGraph("en", landing.en.cite.faq);
const homeTypes = jsonLdTypes(home);
for (const type of ["Organization", "EducationalOrganization", "WebSite", "SoftwareApplication", "Course", "FAQPage"]) {
  if (!homeTypes.has(type)) fail(`Home JSON-LD missing ${type}`);
}
const faqNode = home["@graph"].find((node) => node["@type"] === "FAQPage");
const faqNames = faqNode.mainEntity.map((q) => q.name);
const expectedNames = landing.en.cite.faq.map((item) => item.q);
if (faqNames.join("\n") !== expectedNames.join("\n")) fail("Home FAQ questions drifted from landing copy");

const firstDoc = docs.en[0];
const docsLd = docGraph("en", {
  homeName: "Home",
  docsName: "Docs",
  docTitle: firstDoc.title,
  docDescription: firstDoc.summary,
  docPath: `/docs/${firstDoc.id}`,
  docsPath: `/docs/${firstDoc.id}`,
  faqs: getDocsUi("en").faq,
});
const docsTypes = jsonLdTypes(docsLd);
for (const type of ["BreadcrumbList", "LearningResource", "FAQPage"]) {
  if (!docsTypes.has(type)) fail(`Docs JSON-LD missing ${type}`);
}

const sample = challenges[0];
const challengeLd = challengePreviewGraph("en", {
  homeName: "Home",
  challengesName: "Challenges",
  title: sample.title,
  description: sample.description,
  slug: sample.slug,
  difficulty: sample.difficulty,
});
const challengeTypes = jsonLdTypes(challengeLd);
for (const type of ["BreadcrumbList", "LearningResource"]) {
  if (!challengeTypes.has(type)) fail(`Challenge JSON-LD missing ${type}`);
}
const challengeJson = JSON.stringify(challengeLd);
if (/expectStatus|required_endpoints|hints/.test(challengeJson)) {
  fail("Challenge JSON-LD includes technical spec fields");
}

const generated = {
  "public/robots.txt": robotsTxt(),
  "public/llms.txt": renderLlms({
    landingEn: landing.en,
    landingEs: landing.es,
    docsEn: docs.en,
    docsEs: docs.es,
    challenges,
  }),
  "public/llms-full.txt": renderLlmsFull({
    landingEn: landing.en,
    landingEs: landing.es,
    docsEn: docs.en,
    docsEs: docs.es,
    challenges,
  }),
  "public/sitemap.xml": sitemapXml(paths),
};

let html = readFileSync(join(root, "index.html"), "utf8");
const jsonBlock = `    <script type="application/ld+json" id="seo-jsonld">
${JSON.stringify(home, null, 2)}
    </script>`;
html = replaceMarked(html, "<!-- seo-jsonld:start -->", "<!-- seo-jsonld:end -->", jsonBlock);
html = replaceMarked(html, "<!-- seo-noscript:start -->", "<!-- seo-noscript:end -->", noscriptHtml(landing.en.cite.faq));
generated["index.html"] = html;

for (const [rel, next] of Object.entries(generated)) syncFile(rel, next);

const indexHtml = readFileSync(join(root, "index.html"), "utf8");
if (!indexHtml.includes(`href="${absoluteUrl("en", "/")}"`)) fail("index.html canonical/hreflang is not /en");
if (!indexHtml.includes('hreflang="es"') || !indexHtml.includes('hreflang="x-default"')) {
  fail("index.html is missing es or x-default hreflang");
}
if (!indexHtml.includes(landing.en.meta.description)) fail("index.html description drifted from English landing meta");
const ldMatch = indexHtml.match(/<script type="application\/ld\+json" id="seo-jsonld">([\s\S]*?)<\/script>/);
if (!ldMatch) fail("index.html JSON-LD script missing");
else {
  let parsed;
  try {
    parsed = JSON.parse(ldMatch[1]);
  } catch (err) {
    fail(`index.html JSON-LD does not parse: ${err.message}`);
  }
  if (parsed) {
    const types = jsonLdTypes(parsed);
    for (const type of ["Organization", "EducationalOrganization", "WebSite", "SoftwareApplication", "Course", "FAQPage"]) {
      if (!types.has(type)) fail(`index.html JSON-LD missing ${type}`);
    }
  }
}

const sitemap = readFileSync(join(root, "public/sitemap.xml"), "utf8");
if (!sitemap.startsWith("<?xml")) fail("sitemap is not XML");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (locs.length !== paths.length * 2) fail(`sitemap URL count ${locs.length}, expected ${paths.length * 2}`);
if (new Set(locs).size !== locs.length) fail("sitemap has duplicate loc values");
const logical = new Set(paths.map((page) => page.path));
for (const loc of locs) {
  if (!loc.startsWith(`${SITE_URL}/`)) fail(`sitemap loc is not absolute: ${loc}`);
  const path = loc.slice(SITE_URL.length).replace(/^\/(en|es)/, "") || "/";
  if (!logical.has(path)) fail(`sitemap URL is not a public route: ${loc}`);
  if (!sitemap.includes(`<loc>${escapeXml(loc)}</loc>\n    <lastmod>${SEO_LASTMOD}</lastmod>`)) {
    fail(`sitemap loc missing lastmod: ${loc}`);
  }
}
for (const token of ['hreflang="en"', 'hreflang="es"', 'hreflang="x-default"']) {
  if (!sitemap.includes(token)) fail(`sitemap missing ${token}`);
}

const robots = readFileSync(join(root, "public/robots.txt"), "utf8");
if (!robots.includes("Allow: /")) fail("robots.txt does not allow public pages");
if (/^Disallow:\s*\/\s*$/m.test(robots)) fail("robots.txt disallows the whole site");
for (const bot of AI_CRAWLERS) {
  if (!robots.includes(`User-agent: ${bot}`)) fail(`robots.txt does not name ${bot}`);
}
for (const name of ["dashboard", "teacher", "admin", "login"]) {
  for (const prefix of ["", "/en", "/es"]) {
    if (!robots.includes(`Disallow: ${prefix}/${name}`)) fail(`robots.txt missing Disallow: ${prefix}/${name}`);
  }
}

const llms = readFileSync(join(root, "public/llms.txt"), "utf8");
const llmsFull = readFileSync(join(root, "public/llms-full.txt"), "utf8");
for (const answer of landing.en.cite.faq.map((item) => item.a)) {
  if (!llms.includes(answer)) fail("llms.txt is missing an English citable answer");
}
for (const answer of landing.es.cite.faq.map((item) => item.a)) {
  if (!llmsFull.includes(answer)) fail("llms-full.txt is missing a Spanish answer");
}
for (const doc of docs.en) {
  if (!llms.includes(absoluteUrl("en", `/docs/${doc.id}`))) fail(`llms.txt missing doc ${doc.id}`);
}
for (const challenge of challenges) {
  if (!llms.includes(`/challenges/${challenge.slug}`)) fail(`llms.txt missing challenge ${challenge.slug}`);
  if (!llmsFull.includes(challenge.description)) fail(`llms-full.txt missing preview for ${challenge.slug}`);
}
if (llmsFull.includes("expectStatus") || llms.includes("expectStatus")) {
  fail("llms files include hidden test expectations");
}
for (const fact of ["800", "200", "ZIP", "sandbox", "ELO"]) {
  if (!llms.includes(fact)) fail(`llms.txt missing ${fact}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`seo ok: ${locs.length} sitemap urls, ${challenges.length} challenge previews, JSON-LD ${[...homeTypes].join(", ")}`);
