import { FEATURES } from '../landing.data';

const BADGE_COLORS = {
  cyan:   'cyan',
  purple: 'purple',
  green:  'green',
};

function BentoCell({ num, title, desc, wide, badges }) {
  return (
    <div className={`bento-cell${wide ? ' bento-wide' : ''} bracket-hover`}>
      <span className="bento-icon" />
      <div className="bento-num">{num}</div>
      <h3 className="bento-title">{title}</h3>
      <p className="bento-desc">{desc}</p>
      {badges?.length > 0 && (
        <div className="bento-extra">
          {badges.map(({ label, color }) => (
            <span key={label} className={`mini-badge ${BADGE_COLORS[color] ?? color}`}>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section className="features-section">
      <div className="features-header">
        <div>
          <div className="section-label">Arsenal</div>
          <h2 className="section-title">Features que<br />importan.</h2>
        </div>
        <p style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: '11px',
          color: 'var(--muted)',
          maxWidth: '280px',
          lineHeight: '1.8',
          letterSpacing: '0.5px',
        }}>
          Evaluación multidimensional. No es solo si tu API funciona —
          es qué tan bien funciona.
        </p>
      </div>

      <div className="bento-grid">
        {FEATURES.map((feature) => (
          <BentoCell key={feature.num} {...feature} />
        ))}
      </div>
    </section>
  );
}
