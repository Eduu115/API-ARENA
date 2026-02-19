export default function CtaSection() {
  return (
    <section className="cta-section">
      <div className="cta-bg-text">ARENA</div>
      <div className="cta-glow" />

      <div className="cta-content">
        <div
          className="section-label"
          style={{ justifyContent: 'center', marginBottom: '24px' }}
        >
          Season 01 · Early Access
        </div>

        <h2 className="cta-title">
          <span className="white">¿Listo para</span>
          <span className="outlined">entrar?</span>
        </h2>

        <p className="cta-sub">Early access abierto · Sin tarjeta de crédito</p>

        <div className="cta-input-row">
          <input
            className="cta-input"
            type="email"
            placeholder="your@email.com"
          />
          <button className="cta-btn">Join Arena</button>
        </div>

        <p className="cta-fine">312 developers ya en la arena · Gratis durante beta</p>
      </div>
    </section>
  );
}
