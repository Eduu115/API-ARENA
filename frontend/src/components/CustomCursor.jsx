import { useEffect, useRef } from 'react';

const HOVER_SELECTOR =
  'button, a, select, input, textarea, .ch-card, .db-rec-card, .db-activity-row, .db-kpi-card';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    let animId;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = `${mx}px`;
      dot.style.top = `${my}px`;
    };

    const animRing = () => {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
      animId = requestAnimationFrame(animRing);
    };

    animId = requestAnimationFrame(animRing);
    document.addEventListener('mousemove', onMove);

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
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animId);
      hoverEls.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  });

  return (
    <>
      <div className="ch-cursor-dot" ref={dotRef} />
      <div className="ch-cursor-ring" ref={ringRef} />
    </>
  );
}
