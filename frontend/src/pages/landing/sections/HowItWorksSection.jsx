import { STEPS } from '../landing.data';

function Step({ num, title, desc }) {
  return (
    <div className="step">
      <div className="step-num">{num}</div>
      <h3 className="step-title">
        {title[0]}<br />{title[1]}
      </h3>
      <p className="step-desc">{desc}</p>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section className="how-section">
      <div className="how-header">
        <div className="section-label">Protocol</div>
        <h2 className="section-title">How it <em>works</em></h2>
      </div>
      <div className="steps-row">
        {STEPS.map((step) => (
          <Step key={step.num} {...step} />
        ))}
      </div>
    </section>
  );
}
