import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";
import LocaleSwitch from "../../components/LocaleSwitch";
import TurnstileWidget from "../../components/TurnstileWidget";
import ArrowRightIcon from "../../components/icons/ArrowRightIcon";
import LocaleLink from "../../components/LocaleLink";
import { translateAuthError } from "../../lib/authErrorI18n";
import { isTurnstileEnabled } from "../../lib/turnstile";
import { useLocalizedPath } from "../../routes/LocaleLayout";
import "../challenges/challenges.css";
import "./auth-pages.css";

function getAge(isoDate) {
  const dob = new Date(isoDate);
  if (Number.isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

const TODAY_ISO = new Date().toISOString().slice(0, 10);

export default function Register() {
  const { t, i18n } = useTranslation("auth");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);
  const turnstileOn = isTurnstileEnabled();
  const { register: doRegister, error, clearError } = useAuth();
  const navigate = useNavigate();
  const lp = useLocalizedPath();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || lp("/dashboard");

  useEffect(() => {
    clearError();
    setFieldError(null);
  }, [clearError]);

  const handleTurnstileToken = useCallback((token) => {
    setTurnstileToken(token);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    clearError();
    setFieldError(null);
    if (turnstileOn && !turnstileToken) {
      setFieldError(t("errors.turnstile"));
      return;
    }
    if (password !== confirmPassword) {
      setFieldError(t("errors.passwordMismatch"));
      return;
    }
    if (password.length < 6) {
      setFieldError(t("errors.passwordMin"));
      return;
    }
    if (!dateOfBirth) {
      setFieldError(t("errors.dobRequired"));
      return;
    }
    if (getAge(dateOfBirth) < 14) {
      setFieldError(t("errors.dobMinAge"));
      return;
    }
    if (!acceptTerms) {
      setFieldError(t("errors.termsRequired"));
      return;
    }
    setSubmitting(true);
    const preferredLocale = i18n.language?.startsWith("es") ? "es" : "en";
    const result = await doRegister(username, email, password, null, {
      dateOfBirth,
      acceptTerms,
      turnstileToken,
      preferredLocale,
    });
    setSubmitting(false);
    if (result?.needsVerification) {
      navigate(lp("/verify-email"), { replace: true, state: { email: email.trim() } });
      return;
    }
    if (result?.success) {
      navigate(redirectTo, { replace: true });
      return;
    }
    if (turnstileOn) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    }
  }

  const displayError = fieldError || (error ? translateAuthError(error, t) : null);

  return (
    <div className="auth-page-root challenges-page">
      <div className="auth-page__glow auth-page__glow--register" aria-hidden />
      <div className="ch-grid-bg" aria-hidden />

      <div className="auth-page__shell">
        <div className="auth-page__toolbar">
          <LocaleLink to="/" className="auth-page__back" title={t("backHome")} aria-label={t("backHome")}>
            <ArrowRightIcon width={20} height={20} style={{ transform: "rotate(180deg)" }} />
          </LocaleLink>
          <div className="auth-page__toolbar-actions">
            <LocaleSwitch />
            <ThemeToggle />
          </div>
        </div>

        <div className="auth-page__inner">
          <div className="auth-page__grid auth-page__grid--register">
            <div className="auth-page__col-copy auth-copy-block">
              <LocaleLink to="/" className="auth-brand-row">
                <img src="/icons/logo-hex-lg.svg" alt="API Arena" width="36" height="36" />
                <span className="ch-logo-text">
                  <span className="ch-api">API</span>
                  <span className="ch-arena">Arena</span>
                </span>
              </LocaleLink>

              <div className="ch-page-eyebrow">{t("register.eyebrow")}</div>
              <div className="auth-title-crt">
                <h1 className="ch-page-title">
                  {t("register.titleBefore")}
                  <em>{t("register.titleEm")}</em>
                </h1>
              </div>
              <p className="ch-card-desc auth-copy-lead">{t("register.lead")}</p>

              <div className="auth-actions">
                <LocaleLink to="/login" className="auth-btn-outline">
                  {t("register.hasAccount")}
                  <ArrowRightIcon width={16} height={16} />
                </LocaleLink>
                <LocaleLink to="/leaderboard" className="auth-link-quiet">
                  {t("register.viewLeaderboard")}
                </LocaleLink>
              </div>
            </div>

            <div className="auth-page__col-form auth-form-card">
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-form__head">
                  <div>
                    <div className="ch-page-eyebrow">{t("register.formEyebrow")}</div>
                    <div className="auth-title-crt auth-title-crt--sm">
                      <h2 className="ch-card-title">{t("register.formTitle")}</h2>
                    </div>
                  </div>
                  <div className="auth-form__status">
                    {submitting ? t("register.statusSubmitting") : t("register.statusReady")}
                  </div>
                </div>

                {displayError && (
                  <div className="auth-alert" role="alert">
                    {displayError}
                  </div>
                )}

                <div className="auth-fields">
                  <div>
                    <label htmlFor="register-username" className="auth-label">
                      {t("username")}
                    </label>
                    <input
                      id="register-username"
                      type="text"
                      className="auth-input"
                      placeholder="yourNick"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      minLength={3}
                      maxLength={50}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="register-email" className="auth-label">
                      {t("email")}
                    </label>
                    <input
                      id="register-email"
                      type="email"
                      className="auth-input"
                      placeholder="you@email.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="auth-field-grid">
                    <div>
                      <label htmlFor="register-password" className="auth-label">
                        {t("password")}
                      </label>
                      <input
                        id="register-password"
                        type="password"
                        className="auth-input"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="register-confirm" className="auth-label">
                        {t("confirm")}
                      </label>
                      <input
                        id="register-confirm"
                        type="password"
                        className="auth-input"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="register-dob" className="auth-label">
                      {t("dateOfBirth")}
                    </label>
                    <input
                      id="register-dob"
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
                </div>

                <TurnstileWidget ref={turnstileRef} onToken={handleTurnstileToken} />

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={submitting || (turnstileOn && !turnstileToken)}
                >
                  {submitting ? t("register.submitting") : t("register.submit")}
                </button>

                <div className="auth-footer-row">
                  <p>{t("teacherPrompt")}</p>
                  <LocaleLink to="/login">{t("teacherSignIn")}</LocaleLink>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
