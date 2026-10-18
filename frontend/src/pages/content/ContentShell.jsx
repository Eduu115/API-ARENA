import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Topbar from "../../components/Topbar";
import BottomNav from "../../components/BottomNav";
import CustomCursor from "../../components/CustomCursor";
import LocaleLink from "../../components/LocaleLink";
import { stripLocalePathname } from "../../lib/localeRoutes";
import { CONTENT_TABS, isContentPath } from "../../lib/contentPaths";
import "../challenges/challenges.css";
import "./content.css";

function ContentTabs() {
  const { t } = useTranslation("content");
  const path = stripLocalePathname(useLocation().pathname);
  return (
    <nav className="content-tabs" aria-label={t("tabs.aria")}>
      {CONTENT_TABS.map((tab) => {
        const active = isContentPath(path) && (path === tab || path.startsWith(`${tab}/`));
        return (
          <LocaleLink
            key={tab}
            to={tab}
            className={`content-tab${active ? " content-tab--active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {t(`tabs.${tab.slice(1)}`)}
          </LocaleLink>
        );
      })}
    </nav>
  );
}

export default function ContentShell({ children, wide = false }) {
  return (
    <div className="challenges-page content-page">
      <CustomCursor />
      <div className="ch-grid-bg" aria-hidden />
      <div className="ch-layout" style={{ gridTemplateColumns: "1fr" }}>
        <Topbar showSidebarToggle={false} />
        <main className="ch-main">
          <div className={`content-wrap${wide ? " content-wrap--wide" : ""}`}>
            <ContentTabs />
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
