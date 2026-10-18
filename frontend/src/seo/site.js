import { localePath } from "../lib/localeRoutes.js";

export const SITE_URL = "https://apiarena.net";
export const SITE_NAME = "API Arena";
export const OG_IMAGE = `${SITE_URL}/og-image.png`;
export const OG_IMAGE_WIDTH = "1200";
export const OG_IMAGE_HEIGHT = "630";
export const SEO_LASTMOD = "2026-10-18";

/** Named in robots.txt. Same public allow / private disallow as every other crawler. */
export const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
  "Applebot-Extended",
];

/** Logical paths (no locale prefix) that must not be indexed. */
export const PRIVATE_PATHS = [
  "404",
  "admin",
  "dashboard",
  "submissions",
  "perfil",
  "profile",
  "friends",
  "notifications",
  "replay",
  "teacher",
  "verify-email",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "multiplayer",
];

export function logicalPathname(path = "/") {
  const raw = path.startsWith("/") ? path : `/${path}`;
  const q = raw.search(/[?#]/);
  return q === -1 ? raw : raw.slice(0, q);
}

export function isIndexablePath(path = "/") {
  const p = logicalPathname(path);
  return !PRIVATE_PATHS.some((name) => p === `/${name}` || p.startsWith(`/${name}/`));
}

export function absoluteUrl(locale, path = "/") {
  const loc = locale === "es" ? "es" : "en";
  return `${SITE_URL}${localePath(loc, logicalPathname(path))}`;
}

export function metaDescription(text, max = 160) {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  if (raw.length <= max) return raw;
  return `${raw.slice(0, max - 1).trimEnd()}…`;
}

export function buildHeadMeta({ title, description, path = "/", locale = "en", indexable } = {}) {
  const loc = locale === "es" ? "es" : "en";
  const logical = logicalPathname(path);
  const url = absoluteUrl(loc, logical);
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — Compete. Build. Conquer.`;
  const allow = indexable ?? isIndexablePath(logical);
  const imageAlt = `${SITE_NAME} — Compete. Build. Conquer.`;
  return {
    title: fullTitle,
    description: description || "",
    canonical: url,
    robots: allow ? "index, follow" : "noindex, nofollow",
    htmlLang: loc,
    hreflang: {
      en: absoluteUrl("en", logical),
      es: absoluteUrl("es", logical),
      "x-default": absoluteUrl("en", logical),
    },
    openGraph: {
      "og:type": "website",
      "og:site_name": SITE_NAME,
      "og:title": fullTitle,
      "og:description": description || "",
      "og:url": url,
      "og:image": OG_IMAGE,
      "og:image:width": OG_IMAGE_WIDTH,
      "og:image:height": OG_IMAGE_HEIGHT,
      "og:image:alt": imageAlt,
      "og:locale": loc === "es" ? "es_ES" : "en_US",
      "og:locale:alternate": loc === "es" ? "en_US" : "es_ES",
    },
    twitter: {
      "twitter:card": "summary_large_image",
      "twitter:title": fullTitle,
      "twitter:description": description || "",
      "twitter:image": OG_IMAGE,
      "twitter:image:alt": imageAlt,
    },
  };
}

function orgId() {
  return `${SITE_URL}/#organization`;
}

export function siteNodes(locale = "en") {
  const loc = locale === "es" ? "es" : "en";
  const home = absoluteUrl(loc, "/");
  const description = loc === "es"
    ? "API Arena es una plataforma competitiva y gratuita donde estudiantes y desarrolladores envían APIs Spring Boot reales en un ZIP. Un sandbox aislado las ejecuta y tests HTTP las puntúan sobre 1000: hasta 800 puntos técnicos y hasta 200 de revisión con IA."
    : "API Arena is a free competitive platform where students and developers submit real Spring Boot APIs as a ZIP. An isolated sandbox runs them and HTTP tests score them out of 1000: up to 800 technical points and up to 200 from an AI review.";
  return [
    {
      "@type": ["Organization", "EducationalOrganization"],
      "@id": orgId(),
      name: SITE_NAME,
      alternateName: ["APIArena", "API-Arena"],
      url: SITE_URL,
      logo: `${SITE_URL}/icons/logo-hex-lg.svg`,
      description,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: home,
      name: SITE_NAME,
      alternateName: ["APIArena", "API-Arena"],
      description,
      inLanguage: ["en", "es"],
      publisher: { "@id": orgId() },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: home,
      description,
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      provider: { "@id": orgId() },
    },
    {
      "@type": "Course",
      "@id": `${SITE_URL}/#course`,
      name: loc === "es" ? "API Arena — práctica de APIs" : "API Arena — API practice",
      description: loc === "es"
        ? "Recorrido práctico para construir APIs Spring Boot, entregarlas en un ZIP y mejorarlas con tests HTTP reales, XP y ELO."
        : "Hands-on track for building Spring Boot APIs, submitting them as a ZIP, and improving them with real HTTP tests, XP, and ELO.",
      provider: { "@id": orgId() },
      url: absoluteUrl(loc, "/docs/guia-para-empezar"),
      inLanguage: loc,
      isAccessibleForFree: true,
    },
  ];
}

export function faqNode(faqs, url) {
  const list = Array.isArray(faqs) ? faqs.filter((item) => item?.q && item?.a) : [];
  if (!list.length) return null;
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    url,
    mainEntity: list.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbNode(items, pageUrl) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function learningResourceNode({
  name,
  description,
  url,
  locale,
  learningResourceType = "Guide",
  educationalLevel,
}) {
  const node = {
    "@type": "LearningResource",
    "@id": `${url}#learning-resource`,
    name,
    description,
    url,
    inLanguage: locale === "es" ? "es" : "en",
    isAccessibleForFree: true,
    learningResourceType,
    provider: { "@id": orgId() },
  };
  if (educationalLevel) node.educationalLevel = educationalLevel;
  return node;
}

export function graph(nodes) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean),
  };
}

export function homeGraph(locale, faqs) {
  const url = absoluteUrl(locale, "/");
  return graph([...siteNodes(locale), faqNode(faqs, url)]);
}

export function docGraph(locale, { homeName, docsName, docTitle, docDescription, docPath, docsPath, faqs }) {
  const url = absoluteUrl(locale, docPath);
  return graph([
    ...siteNodes(locale),
    breadcrumbNode([
      { name: homeName, url: absoluteUrl(locale, "/") },
      { name: docsName, url: absoluteUrl(locale, docsPath) },
      { name: docTitle, url },
    ], url),
    learningResourceNode({
      name: docTitle,
      description: docDescription,
      url,
      locale,
      learningResourceType: "Guide",
    }),
    faqs?.length ? faqNode(faqs, url) : null,
  ]);
}

const GUBIA_ID = `${SITE_URL}/#gubia`;
const DEVELOPER_ID = `${SITE_URL}/#developer`;

/**
 * Person + AboutPage for /about. Gubia is a sibling organization node until a
 * brand ticket publishes a real url. Biography fields stay TODO(content).
 */
export function aboutGraph(locale, { homeName, aboutName, description }) {
  const loc = locale === "es" ? "es" : "en";
  const url = absoluteUrl(loc, "/about");
  return graph([
    ...siteNodes(loc),
    {
      "@type": "Organization",
      "@id": GUBIA_ID,
      name: "Gubia",
      url: "TODO(content)",
      description: "TODO(content)",
    },
    {
      "@type": "Person",
      "@id": DEVELOPER_ID,
      name: "TODO(content)",
      description: "TODO(content)",
      url,
      affiliation: { "@id": GUBIA_ID },
    },
    {
      "@type": "AboutPage",
      "@id": `${url}#about`,
      url,
      name: aboutName,
      description,
      inLanguage: loc,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      mainEntity: { "@id": DEVELOPER_ID },
      about: [{ "@id": DEVELOPER_ID }, { "@id": GUBIA_ID }],
    },
    breadcrumbNode([
      { name: homeName, url: absoluteUrl(loc, "/") },
      { name: aboutName, url },
    ], url),
  ]);
}

export function challengeCatalogGraph(locale, { homeName, challengesName }) {
  const url = absoluteUrl(locale, "/challenges");
  return graph([
    ...siteNodes(locale),
    breadcrumbNode([
      { name: homeName, url: absoluteUrl(locale, "/") },
      { name: challengesName, url },
    ], url),
  ]);
}

/** Preview fields only: title, description, difficulty, slug. No endpoints or tests. */
export function challengePreviewGraph(locale, {
  homeName,
  challengesName,
  title,
  description,
  slug,
  difficulty,
}) {
  const url = absoluteUrl(locale, `/challenges/${slug}`);
  return graph([
    ...siteNodes(locale),
    breadcrumbNode([
      { name: homeName, url: absoluteUrl(locale, "/") },
      { name: challengesName, url: absoluteUrl(locale, "/challenges") },
      { name: title, url },
    ], url),
    learningResourceNode({
      name: title,
      description,
      url,
      locale,
      learningResourceType: "Exercise",
      educationalLevel: difficulty,
    }),
  ]);
}

export function jsonLdTypes(data) {
  const types = new Set();
  const nodes = data?.["@graph"] || (data ? [data] : []);
  for (const node of nodes) {
    const t = node?.["@type"];
    if (Array.isArray(t)) t.forEach((item) => types.add(item));
    else if (t) types.add(t);
  }
  return types;
}
