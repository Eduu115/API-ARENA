import LocaleLink from "../components/LocaleLink";
import { useTranslation } from "react-i18next";
import Topbar from "../components/Topbar";
import BottomNav from "../components/BottomNav";
import CustomCursor from "../components/CustomCursor";
import { usePageMeta } from "../lib/usePageMeta";
import "./challenges/challenges.css";

export default function MultiplayerHub() {
  const { t } = useTranslation("common");

  usePageMeta({ title: t("multiplayer.pageTitle"), path: "/multiplayer" });

  return (
    <div className="challenges-page">
      <CustomCursor />
      <div className="ch-grid-bg" />
      <div className="ch-layout" style={{ gridTemplateColumns: "1fr" }}>
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
        <main className="ch-main">
          <div className="ch-page-header">
            <div>
              <div className="ch-page-eyebrow">{t("multiplayer.eyebrow")}</div>
              <h1 className="ch-page-title">
                {t("multiplayer.titleBefore")}
                <em>{t("multiplayer.titleEm")}</em>
              </h1>
              <p className="ch-card-desc" style={{ marginTop: 12, maxWidth: 520 }}>
                {t("multiplayer.description")}
              </p>
              <div style={{ marginTop: 24 }}>
                <LocaleLink to="/challenges" className="auth-btn-outline" style={{ textDecoration: "none" }}>
                  {t("multiplayer.browseChallenges")} →
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
