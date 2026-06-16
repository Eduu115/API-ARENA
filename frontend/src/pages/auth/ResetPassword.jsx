import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as authApi from "../../lib/authApi";
import ThemeToggle from "../../components/ThemeToggle";
import LocaleSwitch from "../../components/LocaleSwitch";
import ArrowRightIcon from "../../components/icons/ArrowRightIcon";
import { translateAuthError } from "../../lib/authErrorI18n";
import { usePageMeta } from "../../lib/usePageMeta";
import "../challenges/challenges.css";
import "./auth-pages.css";

export default function ResetPassword() {
  const { t } = useTranslation("auth");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  usePageMeta({ title: t("resetPassword.pageTitle"), path: "/reset-password" });

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError(t("errors.passwordMin"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setError(
        translateAuthError(
          err?.message || "Could not reset password. The link may have expired.",
          t
        )
      );
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
              <div className="ch-page-eyebrow">{t("resetPassword.eyebrow")}</div>
              <div className="auth-title-crt">
                <h1 className="ch-page-title">
                  {t("resetPassword.titleBefore")}
                  <em>{t("resetPassword.titleEm")}</em>
                </h1>
              </div>
              <p className="ch-card-desc auth-copy-lead">{t("resetPassword.lead")}</p>
            </div>

            <div className="auth-form-card">
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-form__head">
                  <div>
                    <div className="ch-page-eyebrow">{t("resetPassword.formEyebrow")}</div>
                    <div className="auth-title-crt auth-title-crt--sm">
                      <h2 className="ch-card-title">{t("resetPassword.formTitle")}</h2>
                    </div>
                  </div>
                  <div className="auth-form__status">
                    {submitting ? t("resetPassword.statusSaving") : t("resetPassword.statusReady")}
                  </div>
                </div>

                {!token && (
                  <div className="auth-alert" role="alert">
                    {t("resetPassword.missingTokenBefore")}{" "}
                    <Link to="/forgot-password">{t("resetPassword.missingTokenLink")}</Link>.
                  </div>
                )}

                {done ? (
                  <div className="auth-alert auth-alert--ok" role="status">
                    {t("resetPassword.done")}
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
                        <label htmlFor="rp-password" className="auth-label">
                          {t("resetPassword.newPassword")}
                        </label>
                        <input
                          id="rp-password"
                          type="password"
                          className="auth-input"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={6}
                          required
                          disabled={!token}
                        />
                      </div>
                      <div>
                        <label htmlFor="rp-confirm" className="auth-label">
                          {t("resetPassword.confirmNewPassword")}
                        </label>
                        <input
                          id="rp-confirm"
                          type="password"
                          className="auth-input"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={!token}
                        />
                      </div>
                    </div>

                    <button type="submit" className="auth-submit" disabled={submitting || !token}>
                      {submitting ? t("resetPassword.submitting") : t("resetPassword.submit")}
                    </button>
                  </>
                )}

                <div className="auth-footer-row">
                  <p>{t("resetPassword.footerPrompt")}</p>
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
