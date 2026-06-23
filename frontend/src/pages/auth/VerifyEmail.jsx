import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import LocaleLink from "../../components/LocaleLink";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../../components/ThemeToggle";
import LocaleSwitch from "../../components/LocaleSwitch";
import ArrowRightIcon from "../../components/icons/ArrowRightIcon";
import * as authApi from "../../lib/authApi";
import { translateAuthError } from "../../lib/authErrorI18n";
import { usePageMeta } from "../../lib/usePageMeta";
import "../challenges/challenges.css";
import "./auth-pages.css";

export default function VerifyEmail() {
  const { t } = useTranslation("auth");
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const token = searchParams.get("token");
  const initialEmail = location.state?.email ?? "";

  const [phase, setPhase] = useState(() => (token ? "loading" : "idle"));
  const [verifyMessage, setVerifyMessage] = useState(null);
  const [email, setEmail] = useState(initialEmail);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendOk, setResendOk] = useState(false);
  const [resendErr, setResendErr] = useState(null);

  usePageMeta({ title: t("verifyEmail.pageTitle"), path: "/verify-email" });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await authApi.verifyEmailWithToken(token);
        if (!cancelled) {
          setPhase(data?.verified ? "ok" : "bad");
          setVerifyMessage(
            translateAuthError(data?.message ?? "Verification completed.", t)
          );
        }
      } catch (e) {
        if (!cancelled) {
          setPhase("bad");
          setVerifyMessage(translateAuthError(e?.message ?? "Verification failed.", t));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  async function handleResend(e) {
    e.preventDefault();
    setResendOk(false);
    setResendErr(null);
    if (!email?.trim()) {
      setResendErr(t("errors.emailRequired"));
      return;
    }
    setResendBusy(true);
    try {
      await authApi.resendVerificationEmail(email.trim());
      setResendOk(true);
    } catch (err) {
      setResendErr(translateAuthError(err?.message ?? "Could not send email.", t));
    } finally {
      setResendBusy(false);
    }
  }

  const showResendForm = phase === "idle" || phase === "bad";

  const formStatus =
    phase === "loading"
      ? t("verifyEmail.statusVerifying")
      : resendBusy
        ? t("verifyEmail.statusSending")
        : t("verifyEmail.statusReady");

  const displayVerifyMessage = verifyMessage
    ? translateAuthError(verifyMessage, t)
    : null;

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

              <div className="ch-page-eyebrow">{t("verifyEmail.eyebrow")}</div>
              <div className="auth-title-crt">
                <h1 className="ch-page-title">
                  {t("verifyEmail.titleBefore")}
                  <em>{t("verifyEmail.titleEm")}</em>
                </h1>
              </div>
              <p className="ch-card-desc auth-copy-lead">
                {t("verifyEmail.lead")}{" "}
                <span className="auth-copy-strong">{t("verifyEmail.leadStrong")}</span>
              </p>

              <div className="auth-actions">
                <LocaleLink to="/login" className="auth-btn-outline">
                  {t("signIn")}
                  <ArrowRightIcon width={16} height={16} />
                </LocaleLink>
                <LocaleLink to="/docs/primeros-pasos" className="auth-link-quiet">
                  {t("firstSteps")}
                </LocaleLink>
              </div>
            </div>

            <div className="auth-page__col-form auth-form-card">
              <div className="auth-form">
                <div className="auth-form__head">
                  <div>
                    <div className="ch-page-eyebrow">{t("verifyEmail.formEyebrow")}</div>
                    <div className="auth-title-crt auth-title-crt--sm">
                      <h2 className="ch-card-title">{t("verifyEmail.formTitle")}</h2>
                    </div>
                  </div>
                  <div className="auth-form__status">{formStatus}</div>
                </div>

                {phase === "loading" && (
                  <p className="ch-card-desc auth-verify-lead">{t("verifyEmail.confirmingLink")}</p>
                )}

                {phase === "ok" && (
                  <>
                    <div className="auth-alert auth-alert--ok" role="status">
                      {displayVerifyMessage}
                    </div>
                    <LocaleLink to="/login" className="auth-submit auth-submit--link">
                      {t("logIn")}
                    </LocaleLink>
                  </>
                )}

                {phase === "bad" && token && (
                  <>
                    <div className="auth-alert" role="alert">
                      {displayVerifyMessage}
                    </div>
                    <p className="ch-card-desc auth-verify-lead">{t("verifyEmail.badTokenHint")}</p>
                  </>
                )}

                {phase === "idle" && (
                  <p className="ch-card-desc auth-verify-lead">{t("verifyEmail.idleLead")}</p>
                )}

                {showResendForm && (
                  <form className="auth-form auth-form--resend" onSubmit={handleResend}>
                    <div className="auth-fields">
                      <div>
                        <label htmlFor="verify-email" className="auth-label">
                          {t("email")}
                        </label>
                        <input
                          id="verify-email"
                          type="email"
                          className="auth-input"
                          placeholder="you@example.com"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    {resendOk && (
                      <div className="auth-alert auth-alert--ok" role="status">
                        {t("verifyEmail.resendOk")}
                      </div>
                    )}
                    {resendErr && (
                      <div className="auth-alert" role="alert">
                        {resendErr}
                      </div>
                    )}
                    <button type="submit" className="auth-submit" disabled={resendBusy}>
                      {resendBusy ? t("verifyEmail.resendSubmitting") : t("verifyEmail.resendSubmit")}
                    </button>
                  </form>
                )}

                <div className="auth-footer-row">
                  <p>{t("verifyEmail.alreadyVerified")}</p>
                  <LocaleLink to="/login">{t("backToSignIn")}</LocaleLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
