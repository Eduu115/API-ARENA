import { useEffect, useState } from "react";
import LocaleLink from "../components/LocaleLink";
import { useTranslation } from "react-i18next";
import {
  acceptAll,
  getConsent,
  hasDecision,
  rejectNonEssential,
  setConsent,
  OPEN_CONSENT_EVENT,
} from "../lib/cookieConsent";
import "./cookie-consent.css";

export default function CookieConsent() {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [prefs, setPrefs] = useState({ preferences: true, analytics: false });

  useEffect(() => {
    if (!hasDecision()) {
      setOpen(true);
    }
    const reopen = () => {
      const current = getConsent();
      setPrefs({
        preferences: current ? !!current.preferences : true,
        analytics: current ? !!current.analytics : false,
      });
      setCustomizing(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    setCustomizing(false);
  };

  const handleAcceptAll = () => {
    acceptAll();
    close();
  };

  const handleRejectNonEssential = () => {
    rejectNonEssential();
    close();
  };

  const handleSavePrefs = () => {
    setConsent({ preferences: prefs.preferences, analytics: prefs.analytics });
    close();
  };

  return (
    <div className="cc-root" role="dialog" aria-modal="false" aria-label={t("cookieConsent.dialogLabel")}>
      <div className="cc-panel">
        <div className="cc-eyebrow">{t("cookieConsent.eyebrow")}</div>
        <h2 className="cc-title">{t("cookieConsent.title")}</h2>

        {!customizing ? (
          <p className="cc-text">
            {t("cookieConsent.intro")}{" "}
            <LocaleLink to="/cookies">{t("cookieConsent.cookiePolicy")}</LocaleLink>.
          </p>
        ) : (
          <div className="cc-options">
            <label className="cc-option cc-option--locked">
              <span className="cc-option-info">
                <span className="cc-option-name">{t("cookieConsent.necessaryName")}</span>
                <span className="cc-option-desc">{t("cookieConsent.necessaryDesc")}</span>
              </span>
              <input type="checkbox" checked readOnly disabled />
            </label>

            <label className="cc-option">
              <span className="cc-option-info">
                <span className="cc-option-name">{t("cookieConsent.preferencesName")}</span>
                <span className="cc-option-desc">{t("cookieConsent.preferencesDesc")}</span>
              </span>
              <input
                type="checkbox"
                checked={prefs.preferences}
                onChange={(e) => setPrefs((p) => ({ ...p, preferences: e.target.checked }))}
              />
            </label>

            <label className="cc-option">
              <span className="cc-option-info">
                <span className="cc-option-name">{t("cookieConsent.analyticsName")}</span>
                <span className="cc-option-desc">{t("cookieConsent.analyticsDesc")}</span>
              </span>
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))}
              />
            </label>
          </div>
        )}

        <div className="cc-actions">
          {!customizing ? (
            <>
              <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setCustomizing(true)}>
                {t("cookieConsent.customize")}
              </button>
              <button type="button" className="cc-btn cc-btn--ghost" onClick={handleRejectNonEssential}>
                {t("cookieConsent.essentialOnly")}
              </button>
              <button type="button" className="cc-btn cc-btn--primary" onClick={handleAcceptAll}>
                {t("cookieConsent.acceptAll")}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="cc-btn cc-btn--ghost" onClick={handleRejectNonEssential}>
                {t("cookieConsent.essentialOnly")}
              </button>
              <button type="button" className="cc-btn cc-btn--ghost" onClick={handleSavePrefs}>
                {t("cookieConsent.saveChoices")}
              </button>
              <button type="button" className="cc-btn cc-btn--primary" onClick={handleAcceptAll}>
                {t("cookieConsent.acceptAll")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
