import { useTranslation } from 'react-i18next';

function Step({ num, title1, title2, desc }) {
  return (
    <div className="step">
      <div className="step-num">{num}</div>
      <h3 className="step-title">
        {title1}<br />{title2}
      </h3>
      <p className="step-desc">{desc}</p>
    </div>
  );
}

export default function HowItWorksSection() {
  const { t } = useTranslation('landing');
  const steps = t('how.steps', { returnObjects: true });

  return (
    <section className="how-section">
      <div className="how-header">
        <div className="section-label">{t('how.label')}</div>
        <h2 className="section-title">{t('how.title')} <em>{t('how.titleEm')}</em></h2>
      </div>
      <div className="steps-row">
        {(Array.isArray(steps) ? steps : []).map((step) => (
          <Step key={step.num} {...step} />
        ))}
      </div>
    </section>
  );
}
