import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as authApi from "../../lib/authApi";
import ThemeToggle from "../../components/ThemeToggle";
import LocaleSwitch from "../../components/LocaleSwitch";
import ArrowRightIcon from "../../components/icons/ArrowRightIcon";
import { usePageMeta } from "../../lib/usePageMeta";
import "../challenges/challenges.css";
import "./auth-pages.css";

export default function ForgotPassword() {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  usePageMeta({ title: t("forgotPassword.pageTitle"), path: "/forgot-password" });

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page-root challenges-page">
      <div className="auth-page__glow" aria-hidden />
      <div className="ch-grid-bg" aria-hidden />

      <div className="auth-page__shell">
        <div className="auth-page__toolbar">
          <Link to="/login" className="auth-page__back" title={t("backToLogin")} aria-label={t("backToLogin")}>
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
              <div className="ch-page-eyebrow">{t("forgotPassword.eyebrow")}</div>
              <div className="auth-title-crt">
                <h1 className="ch-page-title">
                  {t("forgotPassword.titleBefore")}
                  <em>{t("forgotPassword.titleEm")}</em>
                </h1>
              </div>
              <p className="ch-card-desc auth-copy-lead">{t("forgotPassword.lead")}</p>
            </div>

            <div className="auth-form-card">
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-form__head">
                  <div>
                    <div className="ch-page-eyebrow">{t("forgotPassword.formEyebrow")}</div>
                    <div className="auth-title-crt auth-title-crt--sm">
                      <h2 className="ch-card-title">{t("forgotPassword.formTitle")}</h2>
                    </div>
                  </div>
                  <div className="auth-form__status">
                    {submitting ? t("forgotPassword.statusSending") : t("forgotPassword.statusReady")}
                  </div>
                </div>

                {sent ? (
                  <div className="auth-alert auth-alert--ok" role="status">
                    {t("forgotPassword.sentOk")}
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="auth-alert" role="alert">
                        {error}
                      </div>
                    )}
                    <div className="auth-fields">
                      <div>
                        <label htmlFor="fp-email" className="auth-label">
                          {t("email")}
                        </label>
                        <input
                          id="fp-email"
                          type="email"
                          className="auth-input"
                          placeholder="you@email.com"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="auth-submit" disabled={submitting}>
                      {submitting ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
                    </button>
                  </>
                )}

                <div className="auth-footer-row">
                  <p>{t("forgotPassword.remembered")}</p>
                  <Link to="/login">{t("backToSignIn")}</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
