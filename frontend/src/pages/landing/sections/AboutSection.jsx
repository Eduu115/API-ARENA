import MetricBar from '../../../components/landing/MetricBar';
import { ABOUT_METRICS, ABOUT_TAGS } from '../landing.data';

export default function AboutSection() {
  return (
    <section className="section">
      <div className="about-grid">

        <div className="about-left">
          <div className="section-label">¿Qué es APIArena?</div>
          <h2 className="section-title">
            No es un<br />
            curso.<br />
            <em>Es una guerra.</em>
          </h2>
          <p className="about-desc">
            Crea una API que resuelva el reto. Envía tu código.<br />
            Nuestro sistema la ejecuta en un sandbox aislado y la{' '}
            <strong>destroza con tests automáticos</strong>,
            análisis de rendimiento, validación REST y una revisión de IA.<br /><br />
            Tu puntuación entra al leaderboard.{' '}
            <strong>En tiempo real.</strong><br />
            Mejora, reenvía, escala posiciones.
          </p>
          <div className="about-tags">
            {ABOUT_TAGS.map(({ label, active }) => (
              <span key={label} className={`tag${active ? ' active' : ''}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="about-right">
          <div className="about-corner-text">API</div>
          <div className="metrics-stack">
            {ABOUT_METRICS.map((metric) => (
              <MetricBar key={metric.name} {...metric} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
