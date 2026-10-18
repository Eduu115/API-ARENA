import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import * as authApi from "../../lib/authApi";
import { translateAuthError } from "../../lib/authErrorI18n";

/**
 * Second step after the password. Asks for the primary method and can switch to email
 * when that method is enabled. The QR stays client-side.
 */
export default function AdminTwoFactor({
  pendingToken,
  enrolled,
  primaryMethod = null,
  methods = [],
  emailAllowed = false,
  onSuccess,
}) {
  const { t } = useTranslation("auth");
  const { enrollAdmin2fa, verifyAdmin2fa, verifyLoginEmail2fa } = useAuth();
  const [mode, setMode] = useState(primaryMethod === "EMAIL" ? "email" : "totp");
  const [secret, setSecret] = useState(null);
  const [otpauthUri, setOtpauthUri] = useState(null);
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const emailOn = emailAllowed && methods.includes("EMAIL");
  const totpOn = enrolled || methods.includes("TOTP") || mode === "totp";

  useEffect(() => {
    let cancelled = false;
    if (mode === "totp" && !enrolled) {
      enrollAdmin2fa(pendingToken)
        .then((data) => {
          if (cancelled) return;
          setSecret(data?.secret ?? null);
          setOtpauthUri(data?.otpauthUri ?? null);
        })
        .catch((e) => !cancelled && setError(translateAuthError(e, t) || t("login.twoFactor.enrolFailed")));
    }
    return () => {
      cancelled = true;
    };
  }, [enrolled, pendingToken, enrollAdmin2fa, mode, t]);

  async function sendEmail() {
    setError(null);
    setBusy(true);
    try {
      await authApi.sendLoginEmail2fa(pendingToken);
      setSent(true);
      setMode("email");
      setCode("");
    } catch (e) {
      setError(translateAuthError(e, t));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "email") {
        await verifyLoginEmail2fa(pendingToken, code.trim());
      } else {
        await verifyAdmin2fa(pendingToken, code.trim());
      }
      onSuccess();
    } catch (e2) {
      setError(translateAuthError(e2, t) || t("login.twoFactor.invalid"));
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleVerify}>
      <div className="auth-form__head">
        <div>
          <div className="ch-page-eyebrow">{t("login.twoFactor.eyebrow")}</div>
          <div className="auth-title-crt auth-title-crt--sm">
            <h2 className="ch-card-title">{t("login.twoFactor.title")}</h2>
          </div>
        </div>
      </div>

      {error && (
        <div className="auth-alert" role="alert">
          {error}
        </div>
      )}

      {mode === "totp" && !enrolled && (
        <div className="auth-fields">
          <p className="ch-card-desc">{t("login.twoFactor.scan")}</p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {otpauthUri ? (
              <div style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
                <QRCodeSVG value={otpauthUri} size={176} />
              </div>
            ) : (
              <span className="ch-card-desc">…</span>
            )}
          </div>
          <details>
            <summary className="auth-link-inline" style={{ cursor: "pointer" }}>
              {t("login.twoFactor.manual")}
            </summary>
            <label className="auth-label" style={{ marginTop: 8 }}>
              {t("login.twoFactor.setupKey")}
            </label>
            <code
              className="auth-input"
              style={{ display: "block", wordBreak: "break-all", userSelect: "all" }}
            >
              {secret || "…"}
            </code>
          </details>
        </div>
      )}

      {mode === "email" && (
        <div className="auth-fields">
          {sent ? (
            <p className="ch-card-desc">{t("login.twoFactor.emailPrompt")}</p>
          ) : (
            <button type="button" className="auth-link-inline" onClick={sendEmail} disabled={busy}>
              {busy ? t("login.twoFactor.sending") : t("login.twoFactor.sendEmail")}
            </button>
          )}
        </div>
      )}

      {(mode === "totp" || sent) && (
        <div className="auth-fields">
          <div>
            <label htmlFor="totp-code" className="auth-label">
              {t("login.twoFactor.code")}
            </label>
            <input
              id="totp-code"
              className="auth-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              autoFocus
            />
          </div>
        </div>
      )}

      {(mode === "totp" || sent) && (
        <button type="submit" className="auth-submit" disabled={busy || code.length !== 6}>
          {busy ? t("login.twoFactor.verifying") : t("login.twoFactor.verify")}
        </button>
      )}

      {mode === "totp" && emailOn && (
        <button type="button" className="auth-link-inline" onClick={sendEmail} disabled={busy} style={{ marginTop: 12 }}>
          {busy ? t("login.twoFactor.sending") : t("login.twoFactor.sendEmail")}
        </button>
      )}

      {mode === "email" && sent && (
        <button type="button" className="auth-link-inline" onClick={sendEmail} disabled={busy} style={{ marginTop: 12 }}>
          {busy ? t("login.twoFactor.sending") : t("login.twoFactor.resend")}
        </button>
      )}

      {mode === "email" && totpOn && (enrolled || methods.includes("TOTP")) && (
        <button
          type="button"
          className="auth-link-inline"
          style={{ marginTop: 12, marginLeft: 12 }}
          onClick={() => {
            setMode("totp");
            setCode("");
            setError(null);
          }}
        >
          {t("login.twoFactor.useAuthenticator")}
        </button>
      )}
    </form>
  );
}
