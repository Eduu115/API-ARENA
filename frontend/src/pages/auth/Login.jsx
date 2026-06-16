import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";
import LocaleSwitch from "../../components/LocaleSwitch";
import TurnstileWidget from "../../components/TurnstileWidget";
import ArrowRightIcon from "../../components/icons/ArrowRightIcon";
import { translateAuthError } from "../../lib/authErrorI18n";
import { isTurnstileEnabled } from "../../lib/turnstile";
import "../challenges/challenges.css";
import "./auth-pages.css";

export default function Login() {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);
  const turnstileOn = isTurnstileEnabled();
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleTurnstileToken = useCallback((token) => {
    setTurnstileToken(token);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    clearError();
    if (turnstileOn && !turnstileToken) {
      return;
    }
    setSubmitting(true);
    const result = await login(email, password, turnstileToken);
    setSubmitting(false);
    if (result?.success) {
      navigate(redirectTo, { replace: true });
      return;
    }
    if (turnstileOn) {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    }
  }

  const displayError = error ? translateAuthError(error, t) : null;

  return (
    <div className="auth-page-root challenges-page">
      <div className="auth-page__glow" aria-hidden />
      <div className="ch-grid-bg" aria-hidden />

      <div className="auth-page__shell">
        <div className="auth-page__toolbar">
          <Link to="/" className="auth-page__back" title={t("backHome")} aria-label={t("backHome")}>
            <ArrowRightIcon width={20} height={20} style={{ transform: "rotate(180deg)" }} />
          </Link>
          <div className="auth-page__toolbar-actions">
            <LocaleSwitch />
            <ThemeToggle />
          </div>
        </div>

        <div className="auth-page__inner">
          <div className="auth-page__grid">
            <div className="auth-copy-block">
              <Link to="/" className="auth-brand-row">
                <img src="/icons/logo-hex-lg.svg" alt="API Arena" width="36" height="36" />
                <span className="ch-logo-text">
                  <span className="ch-api">API</span>
                  <span className="ch-arena">Arena</span>
                </span>
              </Link>

              <div className="ch-page-eyebrow">{t("login.eyebrow")}</div>
              <div className="auth-title-crt">
                <h1 className="ch-page-title">
                  {t("login.titleBefore")}
                  <em>{t("login.titleEm")}</em>
                </h1>
              </div>
              <p className="ch-card-desc auth-copy-lead">
                {t("login.lead")}{" "}
                <span className="auth-copy-strong">{t("login.leadStrong")}</span>
              </p>

              <div className="auth-actions">
                <Link to="/register" className="auth-btn-outline">
                  {t("login.createAccount")}
                  <ArrowRightIcon width={16} height={16} />
                </Link>
                <Link to="/challenges" className="auth-link-quiet">
                  {t("login.viewChallenges")}
                </Link>
              </div>
            </div>

            <div className="auth-form-card">
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-form__head">
                  <div>
                    <div className="ch-page-eyebrow">{t("login.formEyebrow")}</div>
                    <div className="auth-title-crt auth-title-crt--sm">
                      <h2 className="ch-card-title">{t("login.formTitle")}</h2>
                    </div>
                  </div>
                  <div className="auth-form__status">
                    {submitting ? t("login.statusSubmitting") : t("login.statusReady")}
                  </div>
                </div>

                {displayError && (
                  <div className="auth-alert" role="alert">
                    {displayError}
                  </div>
                )}

                <div className="auth-fields">
                  <div>
                    <label htmlFor="login-email" className="auth-label">
                      {t("email")}
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      className="auth-input"
                      placeholder="you@email.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="login-password" className="auth-label">
                      {t("password")}
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      className="auth-input"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <div className="auth-forgot-wrap">
                      <Link to="/forgot-password" className="auth-link-inline">
                        {t("login.forgotPassword")}
                      </Link>
                      <Link to="/verify-email" className="auth-link-inline" style={{ marginLeft: 12 }}>
                        {t("login.verifyEmail")}
                      </Link>
                    </div>
                  </div>
                </div>

                <TurnstileWidget ref={turnstileRef} onToken={handleTurnstileToken} />

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={submitting || (turnstileOn && !turnstileToken)}
                >
                  {submitting ? t("login.submitting") : t("login.submit")}
                </button>

                <div className="auth-footer-row">
                  <p>{t("teacherPrompt")}</p>
                  <Link to="/login?mode=edu">{t("teacherSignIn")}</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
