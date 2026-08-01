import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../../context/AuthContext";

/**
 * ADMIN 2FA step. On first login (enrolled=false) it fetches a TOTP secret, renders it as a QR
 * to scan (manual key hidden behind a collapse); then it verifies the 6-digit code and unlocks the bunker.
 * ponytail: qrcode.react renders the QR client-side, so the secret never leaves for a 3rd-party QR service.
 */
export default function AdminTwoFactor({ pendingToken, enrolled, onSuccess }) {
  const { enrollAdmin2fa, verifyAdmin2fa } = useAuth();
  const [secret, setSecret] = useState(null);
  const [otpauthUri, setOtpauthUri] = useState(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!enrolled) {
      enrollAdmin2fa(pendingToken)
        .then((data) => {
          if (cancelled) return;
          setSecret(data?.secret ?? null);
          setOtpauthUri(data?.otpauthUri ?? null);
        })
        .catch((e) => !cancelled && setError(e?.message ?? "Enrolment failed"));
    }
    return () => {
      cancelled = true;
    };
  }, [enrolled, pendingToken, enrollAdmin2fa]);

  async function handleVerify(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await verifyAdmin2fa(pendingToken, code.trim());
      onSuccess();
    } catch (e2) {
      setError(e2?.message ?? "Invalid code");
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleVerify}>
      <div className="auth-form__head">
        <div>
          <div className="ch-page-eyebrow">SECURE ACCESS</div>
          <div className="auth-title-crt auth-title-crt--sm">
            <h2 className="ch-card-title">Two-factor authentication</h2>
          </div>
        </div>
      </div>

      {error && (
        <div className="auth-alert" role="alert">
          {error}
        </div>
      )}

      {!enrolled && (
        <div className="auth-fields">
          <p className="ch-card-desc">
            Scan this QR with your authenticator app (Google Authenticator, Authy…), then enter the 6-digit code.
          </p>
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
              Enter key manually
            </summary>
            <label className="auth-label" style={{ marginTop: 8 }}>
              Setup key (Base32)
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

      <div className="auth-fields">
        <div>
          <label htmlFor="totp-code" className="auth-label">
            Authentication code
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

      <button type="submit" className="auth-submit" disabled={busy || code.length !== 6}>
        {busy ? "Verifying…" : "Verify & enter"}
      </button>
    </form>
  );
}
