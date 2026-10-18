/** English search snippets for legal routes. The page body stays the Spanish legal text. */
export const LEGAL_META_EN = {
  "aviso-legal": {
    title: "Legal notice",
    description:
      "Legal notice for the API Arena website: who operates the site, how to make contact, and the information required by Spanish LSSI-CE.",
  },
  privacidad: {
    title: "Privacy policy",
    description:
      "Privacy policy for API Arena: account, submission, and usage data, plus how to export your data or ask for deletion.",
  },
  cookies: {
    title: "Cookie policy",
    description:
      "Cookie policy for API Arena: cookies that are always on, optional preferences, and how to change your choice.",
  },
  terminos: {
    title: "Terms of use",
    description:
      "Terms of use for API Arena accounts, challenge submissions, and acceptable use of the platform.",
  },
};

export function legalHead(slug, locale, doc) {
  if (locale === "es" && doc) {
    return { title: doc.title, description: doc.intro || "" };
  }
  return LEGAL_META_EN[slug] || {
    title: doc?.title || "Legal",
    description: doc?.intro || "",
  };
}
