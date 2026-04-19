import { formatCountdownMs, useMsUntilIso } from "../../lib/challengeAttemptUtils";

export default function SubmissionZipDownloadBlock({ zipDownloadExpiresAt, downloading, onDownload }) {
  const ms = useMsUntilIso(zipDownloadExpiresAt);
  const expired = Boolean(zipDownloadExpiresAt && ms !== null && ms <= 0);
  const hint =
    !zipDownloadExpiresAt || ms === null
      ? null
      : expired
        ? "ZIP retention · expired"
        : `ZIP retention · expires in ${formatCountdownMs(ms)}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button
        type="button"
        onClick={onDownload}
        disabled={downloading || expired}
        title={expired ? "Past the configured ZIP retention window" : undefined}
        style={{
          background: "rgba(0,217,255,0.1)",
          border: "1px solid rgba(0,217,255,0.3)",
          color: "var(--cyan)",
          borderRadius: 4,
          padding: "3px 10px",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          cursor: expired ? "not-allowed" : "pointer",
          opacity: downloading || expired ? 0.55 : 1,
        }}
      >
        {downloading ? "Downloading..." : "Download ZIP"}
      </button>
      {hint ? (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: expired ? "var(--red)" : "var(--muted)",
            textAlign: "right",
            maxWidth: 240,
            lineHeight: 1.35,
          }}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}
