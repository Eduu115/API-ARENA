import { useEffect } from 'react';
import Header from '../../components/Header';
import SlashDivider from './components/SlashDivider';
import HeroSection from './sections/HeroSection';
import TickerSection from './sections/TickerSection';
import AboutSection from './sections/AboutSection';
import HowItWorksSection from './sections/HowItWorksSection';
import FeaturesSection from './sections/FeaturesSection';
import LeaderboardSection from './sections/LeaderboardSection';
import CtaSection from './sections/CtaSection';
import LandingFooter from './sections/LandingFooter';
import './landing.css';

function useLandingCursor() {
  useEffect(() => {
    const cursor = document.getElementById('cursor');
    const ring   = document.getElementById('cursorRing');
    if (!cursor || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    let animId;

    const onMouseMove = (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top  = my + 'px';
    };

    const animateRing = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      animId = requestAnimationFrame(animateRing);
    };
    animId = requestAnimationFrame(animateRing);
    document.addEventListener('mousemove', onMouseMove);

    const hoverEls = document.querySelectorAll(
      'button, a, .bento-cell, .lb-row, .metric-bar-item',
    );
    const onEnter = () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(2)';
      ring.style.transform   = 'translate(-50%, -50%) scale(1.5)';
      ring.style.opacity     = '0.8';
    };
    const onLeave = () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      ring.style.transform   = 'translate(-50%, -50%) scale(1)';
      ring.style.opacity     = '0.4';
    };
    hoverEls.forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animId);
      hoverEls.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);
}

export default function Landing() {
  useLandingCursor();

  return (
    <div className="landing-page">
      <div className="cursor"      id="cursor"     />
      <div className="cursor-ring" id="cursorRing" />

      <Header />
      <HeroSection />
      <TickerSection />
      <AboutSection />
      <SlashDivider />
      <HowItWorksSection />
      <FeaturesSection />
      <SlashDivider />
      <LeaderboardSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
