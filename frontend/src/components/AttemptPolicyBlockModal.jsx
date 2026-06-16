import { useTranslation } from "react-i18next";
import { useMsUntilIso, formatCountdownMs } from "../lib/challengeAttemptUtils";
import "./AttemptPolicyBlockModal.css";

function formatUtcLine(iso, locale) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const loc = locale?.startsWith("es") ? "es-ES" : "en-GB";
    return `${d.toLocaleString(loc, { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })} UTC`;
  } catch {
    return iso;
  }
}

/**
 * Cooldown / daily-limit gate with live countdown.
 */
export default function AttemptPolicyBlockModal({
  open,
  blockReason,
  cooldownUntilIso,
  dailyLimitResetsAtIso,
  challengeTitle,
  onDismiss,
  primaryLabelKey = "backToChallenge",
}) {
  const { t, i18n } = useTranslation("common");
  const targetIso = blockReason === "DAILY_LIMIT" ? dailyLimitResetsAtIso : cooldownUntilIso;
  const msLeft = useMsUntilIso(open ? targetIso : null);

  if (!open || !blockReason) return null;

  const isDaily = blockReason === "DAILY_LIMIT";
  const title = isDaily ? t("modals.attemptBlock.dailyTitle") : t("modals.attemptBlock.cooldownTitle");
  const eyebrow = isDaily ? t("modals.attemptBlock.fairPlay") : t("modals.attemptBlock.challengePolicy");
  const copy = isDaily ? t("modals.attemptBlock.dailyCopy") : t("modals.attemptBlock.cooldownCopy");
  const primaryLabel = t(`modals.attemptBlock.${primaryLabelKey}`);

  return (
    <div className="attempt-block-overlay" role="presentation" onClick={onDismiss}>
      <div
        className="attempt-block-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attempt-block-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="attempt-block-eyebrow">{eyebrow}</p>
        <h2 id="attempt-block-title" className="attempt-block-title">
          {title}
        </h2>
        {challengeTitle && (
          <p className="attempt-block-challenge">
            <span style={{ color: "var(--dim)" }}>{t("modals.attemptBlock.challengeLabel")}</span> {challengeTitle}
          </p>
        )}
        {msLeft != null && (
          <>
            <div className="attempt-block-countdown" aria-live="polite">
              {formatCountdownMs(msLeft)}
            </div>
            <p className="attempt-block-countdown-label">
              {isDaily ? t("modals.attemptBlock.timeUntilReset") : t("modals.attemptBlock.timeRemaining")}
            </p>
          </>
        )}
        <p className="attempt-block-copy">{copy}</p>
        {targetIso && (
          <p className="attempt-block-utc">
            {t("modals.attemptBlock.exactUtc")} {formatUtcLine(targetIso, i18n.language)}
          </p>
        )}
        <div className="attempt-block-actions">
          <button type="button" className="attempt-block-btn attempt-block-btn-primary" onClick={onDismiss}>
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
