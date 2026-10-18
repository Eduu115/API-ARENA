export const CONTENT_TABS = ["/news", "/changelog", "/roadmap"];

export const isContentPath = (path) =>
  CONTENT_TABS.some((tab) => path === tab || path.startsWith(`${tab}/`));
