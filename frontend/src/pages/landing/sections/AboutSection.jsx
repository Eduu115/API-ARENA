import { Trans, useTranslation } from 'react-i18next';
import MetricBar from '../../../components/landing/MetricBar';
import { ABOUT_METRICS } from '../landing.data';

export default function AboutSection() {
  const { t } = useTranslation('landing');
  const metricNames = t('about.metrics', { returnObjects: true });
  const tags = t('about.tags', { returnObjects: true });

  return (
    <section className="section">
      <div className="about-grid">
        <div className="about-left">
          <div className="section-label">{t('about.label')}</div>
          <h2 className="section-title">
            {t('about.title1')}<br />
            {t('about.title2')}<br />
            <em>{t('about.titleEm')}</em>
          </h2>
          <p className="about-desc">
            <Trans i18nKey="about.desc" t={t} components={{ 1: <strong />, 2: <strong /> }} />
          </p>
          <div className="about-tags">
            {(Array.isArray(tags) ? tags : []).map(({ label, active }) => (
              <span key={label} className={`tag${active ? ' active' : ''}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="about-right">
          <div className="about-corner-text">API</div>
          <div className="metrics-stack">
            {ABOUT_METRICS.map((metric, i) => (
              <MetricBar
                key={metric.name}
                {...metric}
                name={Array.isArray(metricNames) ? metricNames[i] : metric.name}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
