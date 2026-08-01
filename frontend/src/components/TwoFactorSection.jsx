import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import * as authApi from "../lib/authApi";

/**
 * Account-settings 2FA control: enable (scan QR → confirm code) or disable (confirm code).
 * `enabled` reflects user.twoFactorEnabled; `onChanged` reloads the user after a change.
 */
export default function TwoFactorSection({ enabled, onChanged }) {
  const { t } = useTranslation("profile");
  const [mode, setMode] = useState("idle"); // idle | enroll | disable
  const [enroll, setEnroll] = useState(null); // { secret, otpauthUri }
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function reset() {
    setMode("idle");
    setEnroll(null);
    setCode("");
    setError(null);
    setBusy(false);
  }

  async function startEnroll() {
    setError(null);
    setBusy(true);
    try {
      const data = await authApi.enrollMy2fa();
      setEnroll(data);
      setMode("enroll");
      setBusy(false);
    } catch (e) {
      setError(e?.message || t("twoFactorError"));
      setBusy(false);
    }
  }

  async function submit(e, action) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await action(code.trim());
      await onChanged?.();
      reset();
    } catch (e2) {
      setError(e2?.message || t("twoFactorError"));
      setBusy(false);
    }
  }

  const codeInput = (
    <div>
      <label htmlFor="user-totp-code" className="auth-label">
        {t("twoFactorCode")}
      </label>
      <input
        id="user-totp-code"
        className="auth-input"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        autoFocus
      />
    </div>
  );

  return (
    <section className="profile-block profile-block--meta" aria-labelledby="security-heading">
      <div className="profile-block-head">
        <h2 id="security-heading" className="profile-block-title">
          {t("securityTitle")}
        </h2>
      </div>

      <p className="profile-privacy-text" style={{ marginBottom: 4 }}>
        <strong>{t("twoFactorTitle")}</strong>
      </p>
      <p className="profile-privacy-text">
        {enabled ? t("twoFactorOnDesc") : t("twoFactorOffDesc")}
      </p>

      {error && (
        <div className="auth-alert" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {mode === "idle" && (
        <div className="profile-privacy-actions">
          {enabled ? (
            <button type="button" className="profile-btn-logout" onClick={() => setMode("disable")}>
              {t("twoFactorDisable")}
            </button>
          ) : (
            <button type="button" className="profile-btn-ghost" onClick={startEnroll} disabled={busy}>
              {t("twoFactorEnable")}
            </button>
          )}
        </div>
      )}

      {mode === "enroll" && (
        <form className="auth-fields" onSubmit={(e) => submit(e, authApi.enableMy2fa)}>
          <p className="profile-privacy-text">{t("twoFactorScan")}</p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {enroll?.otpauthUri ? (
              <div style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
                <QRCodeSVG value={enroll.otpauthUri} size={176} />
              </div>
            ) : (
              <span>…</span>
            )}
          </div>
          <details>
            <summary className="auth-link-inline" style={{ cursor: "pointer" }}>
              {t("twoFactorManual")}
            </summary>
            <label className="auth-label" style={{ marginTop: 8 }}>
              {t("twoFactorSetupKey")}
            </label>
            <code
              className="auth-input"
              style={{ display: "block", wordBreak: "break-all", userSelect: "all" }}
            >
              {enroll?.secret || "…"}
            </code>
          </details>
          {codeInput}
          <div className="profile-privacy-actions">
            <button type="submit" className="profile-btn-ghost" disabled={busy || code.length !== 6}>
              {busy ? "…" : t("twoFactorConfirm")}
            </button>
            <button type="button" className="profile-btn-ghost" onClick={reset} disabled={busy}>
              {t("twoFactorCancel")}
            </button>
          </div>
        </form>
      )}

      {mode === "disable" && (
        <form className="auth-fields" onSubmit={(e) => submit(e, authApi.disableMy2fa)}>
          <p className="profile-privacy-text">{t("twoFactorDisablePrompt")}</p>
          {codeInput}
          <div className="profile-privacy-actions">
            <button type="submit" className="profile-btn-logout" disabled={busy || code.length !== 6}>
              {busy ? "…" : t("twoFactorDisable")}
            </button>
            <button type="button" className="profile-btn-ghost" onClick={reset} disabled={busy}>
              {t("twoFactorCancel")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
