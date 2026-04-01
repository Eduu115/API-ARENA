import { useLayoutEffect, useRef } from 'react';

const HOVER_SELECTOR =
  'button, a, select, input, textarea, .ch-card, .db-rec-card, .db-activity-row, .db-kpi-card';

// Persist last known cursor position across route changes (component unmount/mount).
let GLOBAL_POS = { x: null, y: null };

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useLayoutEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Avoid 0,0 jump on mount by using last known position.
    const initialX = Number.isFinite(GLOBAL_POS.x) ? GLOBAL_POS.x : window.innerWidth / 2;
    const initialY = Number.isFinite(GLOBAL_POS.y) ? GLOBAL_POS.y : window.innerHeight / 2;

    let mx = initialX;
    let my = initialY;
    let rx = mx, ry = my;
    let lastValidX = mx;
    let lastValidY = my;
    let animId;

    const applyPos = (x, y) => {
      mx = x;
      my = y;
      lastValidX = x;
      lastValidY = y;
      GLOBAL_POS.x = x;
      GLOBAL_POS.y = y;
      dot.style.left = `${mx}px`;
      dot.style.top = `${my}px`;
    };

    const pickCoords = (e) => {
      // Some events can fire without coordinates; ignore them.
      if (!Number.isFinite(e?.clientX) || !Number.isFinite(e?.clientY)) return;
      // Guard against occasional (0,0) reports on click / focus changes.
      if (e.clientX === 0 && e.clientY === 0) return;
      applyPos(e.clientX, e.clientY);
    };

    const animRing = () => {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
      animId = requestAnimationFrame(animRing);
    };

    // Set initial position before first paint.
    dot.style.left = `${mx}px`;
    dot.style.top = `${my}px`;
    ring.style.left = `${rx}px`;
    ring.style.top = `${ry}px`;

    animId = requestAnimationFrame(animRing);
    const onPointerMove = (e) => pickCoords(e);
    const onPointerDown = (e) => pickCoords(e);
    const onBlur = () => {
      // Keep cursor where it was instead of snapping.
      applyPos(lastValidX, lastValidY);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('blur', onBlur);

    const hoverEls = document.querySelectorAll(HOVER_SELECTOR);
    const onEnter = () => {
      ring.style.width = '42px';
      ring.style.height = '42px';
      ring.style.borderColor = 'rgba(0,217,255,0.8)';
      dot.style.background = '#ffffff';
    };
    const onLeave = () => {
      ring.style.width = '28px';
      ring.style.height = '28px';
      ring.style.borderColor = 'rgba(0,217,255,0.5)';
      dot.style.background = 'var(--cyan)';
    };
    hoverEls.forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('blur', onBlur);
      cancelAnimationFrame(animId);
      hoverEls.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);

  return (
    <>
      <div className="ch-cursor-dot" ref={dotRef} />
      <div className="ch-cursor-ring" ref={ringRef} />
    </>
  );
}
