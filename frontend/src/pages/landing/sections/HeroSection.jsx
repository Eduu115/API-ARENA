import { Link } from 'react-router-dom';
import TerminalWindow from '../../../components/landing/TerminalWindow';
import ArrowRightIcon from '../../../components/icons/ArrowRightIcon';
import { HERO_STATS } from '../landing.data';

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-grid" />
      <div className="hero-glow" />
      <div className="hero-glow-2" />

      <div className="hero-content">
        <div className="hero-eyebrow">Season 01 · Open Beta Active</div>
        <h1 className="hero-title">
          <span className="line-1">Code</span>
          <span className="line-2">Faster.</span>
          <span className="line-3">Win.</span>
        </h1>
        <p className="hero-sub">
          La primera arena competitiva para <strong>APIs</strong>.<br />
          Envía tu código. Supera los tests.{' '}
          <strong>Domina el leaderboard.</strong><br />
          No simulaciones. No teoría. Código real en producción real.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="btn-primary">▶ Start Competing</Link>
          <Link to="/challenges" className="btn-secondary">
            Ver challenges
            <ArrowRightIcon />
          </Link>
        </div>

        <div className="hero-stats">
          {HERO_STATS.map(({ num, label }) => (
            <div key={label} className="stat-item">
              <span className="stat-num">{num}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hero-visual">
        <TerminalWindow />
      </div>
    </section>
  );
}
