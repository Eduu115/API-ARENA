import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
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
}) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hole, setHole] = useState(null);
  const [cardStyle, setCardStyle] = useState({ top: 80, left: 20, width: 400 });

  const step = steps[stepIndex];
  const last = stepIndex >= steps.length - 1;

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
    if (!when || steps.length === 0) return;
    if (isTutorialDone(tourKey)) return;
    const t = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(t);
  }, [when, tourKey, steps.length]);

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

  function handleSkip() {
    finishTutorial(tourKey, "skip");
    setOpen(false);
  }

  function handleNext() {
    if (last) {
      finishTutorial(tourKey, "done");
      setOpen(false);
      return;
    }
    setStepIndex((i) => i + 1);
  }

  if (!open || steps.length === 0) return null;

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
          <div className="tutorial-card-eyebrow">Quick tour</div>
          <h2 id="tutorial-title" className="tutorial-card-title">
            {step?.title || "Welcome"}
          </h2>
          <p className="tutorial-card-body">{step?.body || ""}</p>
          <p className="tutorial-card-hint">
            You can skip anytime. Full guides live in <strong>Docs</strong> — bookmark what you need.
          </p>
          <div className="tutorial-card-actions">
            <span className="tutorial-step-pill">
              {stepIndex + 1} / {steps.length}
            </span>
            <button type="button" className="tutorial-btn tutorial-btn-skip" onClick={handleSkip}>
              Skip tour
            </button>
            <Link
              to={docsHref}
              className="tutorial-btn tutorial-btn-docs"
              onClick={() => {
                finishTutorial(tourKey, "skip");
                setOpen(false);
              }}
            >
              Open Docs
            </Link>
            <button type="button" className="tutorial-btn tutorial-btn-next" onClick={handleNext}>
              {last ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(cardInner, document.body);
}
