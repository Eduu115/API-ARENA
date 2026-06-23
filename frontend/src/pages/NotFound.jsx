import LocaleLink from "../components/LocaleLink";
import { useTranslation } from "react-i18next";
import Topbar from "../components/Topbar";
import BottomNav from "../components/BottomNav";
import CustomCursor from "../components/CustomCursor";
import { usePageMeta } from "../lib/usePageMeta";
import "./challenges/challenges.css";

export default function NotFound() {
  const { t } = useTranslation("common");

  usePageMeta({ title: t("notFound.pageTitle"), path: "/404" });

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: "1fr" }}>
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
        <main className="ch-main">
          <div className="ch-page-header">
            <div>
              <div className="ch-page-eyebrow">{t("notFound.eyebrow")}</div>
              <h1 className="ch-page-title">
                {t("notFound.titleBefore")}
                <em>{t("notFound.titleEm")}</em>
              </h1>
              <p className="ch-card-desc" style={{ marginTop: 12, maxWidth: 520 }}>
                {t("notFound.description")}
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                <LocaleLink to="/" className="auth-btn-outline" style={{ textDecoration: "none" }}>
                  {t("notFound.backHome")}
                </LocaleLink>
                <LocaleLink to="/challenges" className="auth-link-quiet">
                  {t("notFound.browseChallenges")} →
                </LocaleLink>
              </div>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
