import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import LocaleLink from "../LocaleLink";
import { Trans, useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { finishTutorial, isTutorialDone } from "../../lib/tutorialStorage";
import "./tutorial.css";

const PAD = 8;

function placeCard(rect, setCardStyle) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(420, vw - 32);
  const cardH = 240;
  let top = rect.bottom + PAD + 12;
  let left = rect.left + rect.width / 2 - cardW / 2;
  left = Math.max(16, Math.min(left, vw - cardW - 16));
  if (top + cardH > vh - 16) {
    top = rect.top - cardH - PAD - 20;
  }
  if (top < 16) {
    top = Math.min(rect.bottom + PAD, vh - cardH - 16);
  }
  setCardStyle({ top, left, width: cardW, transform: "none" });
}

export default function TutorialTour({
  tourKey,
  steps = [],
  docsHref = "/docs",
  when = true,
  requireAuth = true,
}) {
  const { t } = useTranslation("tours");
  const { user, isAuthenticated, isLoading } = useAuth();
  const userId = user?.id ?? null;
  const authReady = !requireAuth || (!isLoading && isAuthenticated && user?.emailVerified !== false);
  const userReady = !requireAuth || userId != null;
  const canRun = when && authReady && userReady;

  const [dismissed, setDismissed] = useState(() => isTutorialDone(tourKey, userId));
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hole, setHole] = useState(null);
  const [cardStyle, setCardStyle] = useState({ top: 80, left: 20, width: 400 });

  const step = steps[stepIndex];
  const last = stepIndex >= steps.length - 1;

  useEffect(() => {
    if (isTutorialDone(tourKey, userId)) {
      setDismissed(true);
      setOpen(false);
    }
  }, [tourKey, userId]);

  const updatePositions = useCallback(() => {
    if (!step?.target) {
      setHole(null);
      setCardStyle({
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: Math.min(420, window.innerWidth - 32),
      });
      return;
    }
    const el = document.querySelector(`[data-tutorial="${step.target}"]`);
    if (!el) {
      setHole(null);
      setCardStyle({
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: Math.min(420, window.innerWidth - 32),
      });
      return;
    }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      setHole({
        top: r.top - PAD,
        left: r.left - PAD,
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      });
      placeCard(
        { top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height },
        setCardStyle
      );
    });
  }, [step]);

  useEffect(() => {
    if (!canRun || steps.length === 0 || dismissed) return;
    if (isTutorialDone(tourKey, userId)) return;
    const t = setTimeout(() => {
      if (isTutorialDone(tourKey, userId)) return;
      setOpen(true);
    }, 500);
    return () => clearTimeout(t);
  }, [canRun, tourKey, userId, steps.length, dismissed]);

  useEffect(() => {
    if (!canRun) setOpen(false);
  }, [canRun]);

  useEffect(() => {
    if (!open) return;
    updatePositions();
    const onResize = () => updatePositions();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, stepIndex, updatePositions]);

  function closeTour(reason) {
    finishTutorial(tourKey, reason, userId);
    setDismissed(true);
    setOpen(false);
  }

  function handleSkip() {
    closeTour("skip");
  }

  function handleNext() {
    if (last) {
      closeTour("done");
      return;
    }
    setStepIndex((i) => i + 1);
  }

  if (!open || steps.length === 0 || dismissed) return null;

  const cardInner = (
    <div className="tutorial-root" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div className="tutorial-backdrop" aria-hidden />
      {hole && (
        <div
          className="tutorial-hole"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
          }}
        />
      )}
      <div
        className="tutorial-card-wrap"
        style={{
          position: "fixed",
          top: cardStyle.top,
          left: cardStyle.left,
          width: cardStyle.width,
          transform: cardStyle.transform,
          zIndex: 13060,
        }}
      >
        <div className="tutorial-card">
          <div className="tutorial-card-eyebrow">{t("chrome.eyebrow")}</div>
          <h2 id="tutorial-title" className="tutorial-card-title">
            {step?.title || t("chrome.welcome")}
          </h2>
          <p className="tutorial-card-body">{step?.body || ""}</p>
          <p className="tutorial-card-hint">
            <Trans i18nKey="chrome.hint" t={t} components={{ 1: <strong /> }} />
          </p>
          <div className="tutorial-card-actions">
            <span className="tutorial-step-pill">
              {t("chrome.stepPill", { current: stepIndex + 1, total: steps.length })}
            </span>
            <button type="button" className="tutorial-btn tutorial-btn-skip" onClick={handleSkip}>
              {t("chrome.skip")}
            </button>
            <LocaleLink
              to={docsHref}
              className="tutorial-btn tutorial-btn-docs"
              onClick={() => closeTour("skip")}
            >
              {t("chrome.openDocs")}
            </LocaleLink>
            <button type="button" className="tutorial-btn tutorial-btn-next" onClick={handleNext}>
              {last ? t("chrome.done") : t("chrome.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(cardInner, document.body);
}
