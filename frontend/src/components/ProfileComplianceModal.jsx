import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LocaleLink from "./LocaleLink";
import { translateAuthError } from "../lib/authErrorI18n";
import { getAgeFromIsoDate, MIN_PROFILE_AGE, TODAY_ISO } from "../lib/profileCompliance";
import "../pages/challenges/challenges.css";
import "../pages/auth/auth-pages.css";
import "./ProfileComplianceModal.css";

/**
 * Blocking modal for legacy accounts missing date of birth / privacy consent.
 */
export default function ProfileComplianceModal({ open, onSubmit, onLogout, submitting }) {
  const { t } = useTranslation("auth");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [fieldError, setFieldError] = useState(null);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setDateOfBirth("");
    setAcceptTerms(false);
    setFieldError(null);
    setApiError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldError(null);
    setApiError(null);

    if (!dateOfBirth) {
      setFieldError(t("errors.dobRequired"));
      return;
    }
    if (getAgeFromIsoDate(dateOfBirth) < MIN_PROFILE_AGE) {
      setFieldError(t("errors.dobMinAge"));
      return;
    }
    if (!acceptTerms) {
      setFieldError(t("errors.termsRequired"));
      return;
    }

    try {
      await onSubmit({ dateOfBirth, acceptTerms });
    } catch (err) {
      setApiError(translateAuthError(err, t));
    }
  }

  const displayError = fieldError || apiError;

  return (
    <div className="profile-compliance-overlay" role="presentation">
      <div
        className="profile-compliance-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-compliance-title"
      >
        <p className="profile-compliance-eyebrow">{t("profileCompliance.eyebrow")}</p>
        <h2 id="profile-compliance-title" className="profile-compliance-title">
          {t("profileCompliance.title")}
        </h2>
        <p className="profile-compliance-lead">{t("profileCompliance.lead")}</p>

        <form className="profile-compliance-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="profile-compliance-dob" className="auth-label">
              {t("dateOfBirth")}
            </label>
            <input
              id="profile-compliance-dob"
              type="date"
              className="auth-input"
              autoComplete="bday"
              value={dateOfBirth}
              max={TODAY_ISO}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
            <p className="auth-help-text">{t("register.dobHint")}</p>
          </div>

          <label className="auth-consent">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              required
            />
            <span>
              {t("register.consentBefore")}{" "}
              <LocaleLink to="/privacidad" target="_blank" rel="noopener noreferrer">
                {t("register.privacyPolicy")}
              </LocaleLink>{" "}
              {t("register.consentMiddle")}{" "}
              <LocaleLink to="/terminos" target="_blank" rel="noopener noreferrer">
                {t("register.termsOfUse")}
              </LocaleLink>
              .
            </span>
          </label>

          {displayError && (
            <p className="profile-compliance-error" role="alert">
              {displayError}
            </p>
          )}

          <div className="profile-compliance-actions">
            <button
              type="submit"
              className="profile-compliance-btn profile-compliance-btn-primary"
              disabled={submitting}
            >
              {submitting ? t("profileCompliance.submitting") : t("profileCompliance.submit")}
            </button>
            <button
              type="button"
              className="profile-compliance-btn profile-compliance-btn-ghost"
              onClick={onLogout}
              disabled={submitting}
            >
              {t("profileCompliance.logout")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
