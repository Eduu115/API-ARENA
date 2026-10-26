export const CONTENT_TABS = ["/roadmap", "/news", "/changelog"];

export const isContentPath = (path) =>
  CONTENT_TABS.some((tab) => path === tab || path.startsWith(`${tab}/`));
