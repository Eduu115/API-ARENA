import { useTranslation } from 'react-i18next';
import { SCORE_RUBRIC_HTTP, SCORE_RUBRIC_REVIEW } from '../../pages/landing/landing.data';

function RubricRow({ label, points, max, pct, color, gradient }) {
  return (
    <div className="score-rubric-row bracket-hover">
      <span className="score-rubric-label">{label}</span>
      <div className="score-rubric-track">
        <div
          className="score-rubric-fill"
          style={{ width: `${pct}%`, background: gradient }}
        />
      </div>
      <span className="score-rubric-pts" style={{ color }}>
        <span className="score-rubric-pts-val">{points}</span>
        <span className="score-rubric-pts-max">/{max}</span>
      </span>
    </div>
  );
}

export default function AboutScoreRubric() {
  const { t } = useTranslation('landing');
  const httpLabels = t('about.scoreHttpItems', { returnObjects: true });

  return (
    <div className="score-rubric" aria-label={t('about.metricsHeading')}>
      <p className="about-metrics-heading">{t('about.metricsHeading')}</p>
      <p className="about-metrics-note">{t('about.metricsExampleNote')}</p>

      <div className="score-rubric-group score-rubric-group--http">
        <div className="score-rubric-group-head">
          <span className="score-rubric-group-title">{t('about.scoreHttpGroup')}</span>
          <span className="score-rubric-group-cap">{t('about.scoreHttpCap')}</span>
        </div>
        {SCORE_RUBRIC_HTTP.map((row, i) => (
          <RubricRow
            key={row.key}
            {...row}
            label={Array.isArray(httpLabels) ? httpLabels[i] : row.key}
          />
        ))}
      </div>

      <div className="score-rubric-group score-rubric-group--review">
        <div className="score-rubric-group-head">
          <span className="score-rubric-group-title">{t('about.scoreReviewGroup')}</span>
          <span className="score-rubric-group-cap">{t('about.scoreReviewCap')}</span>
        </div>
        <RubricRow
          label={t('about.scoreReviewItem')}
          points={SCORE_RUBRIC_REVIEW.points}
          max={SCORE_RUBRIC_REVIEW.max}
          pct={SCORE_RUBRIC_REVIEW.pct}
          color={SCORE_RUBRIC_REVIEW.color}
          gradient={SCORE_RUBRIC_REVIEW.gradient}
        />
        <p className="score-rubric-review-note">{t('about.scoreReviewMode')}</p>
      </div>

      <div className="score-rubric-total">
        <span className="score-rubric-total-eq">{t('about.scoreEquation')}</span>
        <span className="score-rubric-total-val">1,000</span>
      </div>
    </div>
  );
}
