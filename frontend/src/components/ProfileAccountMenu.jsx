import { useEffect } from "react";
import LocaleLink from "./LocaleLink";
import { useTranslation } from "react-i18next";
import "./ProfileAccountMenu.css";

const AVATAR_BG = [
  "linear-gradient(135deg, var(--cyan), var(--purple))",
  "linear-gradient(135deg, var(--green), var(--cyan))",
  "linear-gradient(135deg, var(--warn), var(--red))",
  "linear-gradient(135deg, var(--purple), var(--red))",
  "linear-gradient(135deg, var(--cyan), var(--green))",
];

const MIN_RANKED = 3;

export default function ProfileAccountMenu({
  id = "profile-account-menu",
  open,
  onClose,
  user,
  onLogout,
  onSwitchAccount,
}) {
  const { t } = useTranslation("common");

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const rating = user?.rating ?? 1000;
  const level = user?.level ?? 1;
  const xp = user?.experiencePoints ?? 0;
  const solved = user?.totalChallengesCompleted ?? 0;
  const tests = user?.totalTestsPassed ?? 0;
  const unranked = solved < MIN_RANKED;
  const initials = user?.username?.slice(0, 2).toUpperCase() || "??";
  const bg = AVATAR_BG[(user?.id ?? 0) % AVATAR_BG.length];
  const roleLabel = String(user?.role || "USER").toUpperCase();

  return (
    <>
      <button
        type="button"
        className="pam-backdrop"
        aria-label={t("accountMenu.closeBackdrop")}
        onClick={onClose}
      />

      <aside
        id={id}
        className="pam-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pam-sr-title"
      >
        <h2 id="pam-sr-title" className="pam-sr-only">
          {t("accountMenu.title")}
        </h2>

        <div className="pam-panel-accent" />

        <div className="pam-panel-body">
          <div className="pam-scroll">
            <header className="pam-topbar">
              <div className="pam-brand">
                <div className="pam-brand-hex">
                  <img src="/icons/logo-hex-sm.svg" alt="" width="26" height="26" />
                </div>
                <span className="pam-brand-text">
                  <span className="pam-brand-api">API</span>
                  <span className="pam-brand-arena">Arena</span>
                </span>
              </div>
              <button type="button" className="pam-close" onClick={onClose} aria-label={t("accountMenu.close")}>
                ×
              </button>
            </header>

            <div className="pam-hero">
              <div className="pam-hex-outer">
                <div
                  className="pam-hex"
                  style={{ background: user?.avatarUrl ? "transparent" : bg }}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="pam-hex-img" />
                  ) : (
                    <span className="pam-hex-initials">{initials}</span>
                  )}
                </div>
              </div>
              <p className="pam-display-name">{user?.username?.toUpperCase()}</p>
              <p className="pam-status-line">
                {roleLabel}
                <span className="pam-status-dot"> · </span>
                {t("accountMenu.active")}
              </p>
              <div className="pam-elo-strip">
                <span className="pam-elo-text">
                  {unranked ? t("accountMenu.eloDash") : t("accountMenu.eloRating", { rating })}
                </span>
              </div>
            </div>

            <p className="pam-combat-label">{t("accountMenu.combatStats")}</p>
            <div className="pam-combat-grid" role="group" aria-label={t("accountMenu.combatStatsAria")}>
              <div className="pam-combat-cell">
                <span className="pam-combat-val pam-v-level">{level}</span>
                <span className="pam-combat-key">{t("accountMenu.level")}</span>
              </div>
              <div className="pam-combat-cell">
                <span className="pam-combat-val pam-v-solved">{solved}</span>
                <span className="pam-combat-key">{t("accountMenu.solved")}</span>
              </div>
              <div className="pam-combat-cell">
                <span className="pam-combat-val pam-v-xp">{xp.toLocaleString()}</span>
                <span className="pam-combat-key">{t("accountMenu.xp")}</span>
              </div>
              <div className="pam-combat-cell">
                <span className="pam-combat-val pam-v-tests">{tests}</span>
                <span className="pam-combat-key">{t("accountMenu.tests")}</span>
              </div>
            </div>
          </div>

          <nav className="pam-footer" aria-label={t("accountMenu.title")}>
            <LocaleLink to="/perfil" className="pam-btn pam-btn-primary" onClick={onClose}>
              {t("accountMenu.goToProfile")}
            </LocaleLink>
            <button
              type="button"
              className="pam-btn pam-btn-muted"
              onClick={() => {
                onClose();
                onSwitchAccount();
              }}
            >
              {t("accountMenu.switchAccount")}
            </button>
            <button
              type="button"
              className="pam-btn pam-btn-danger"
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              {t("accountMenu.logOut")}
            </button>
          </nav>
        </div>
      </aside>
    </>
  );
}
