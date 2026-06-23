import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const TOUR_TARGETS = {
  dashboard: ['topbar', 'dashboard-sidebar', 'dashboard-main'],
  challenges: ['topbar', 'challenges-sidebar', 'challenges-main'],
  challengeDetail: ['challenge-detail-actions', 'challenge-detail-hero', 'challenge-detail-specs-note'],
  challengeSubmit: ['submit-limits', 'submit-timer', 'submit-zip', 'submit-button'],
};

/** Build localized tour steps from i18n tours namespace. */
export function buildTourSteps(t, tourKey) {
  const steps = t(`${tourKey}.steps`, { returnObjects: true });
  const targets = TOUR_TARGETS[tourKey] || [];
  if (!Array.isArray(steps)) return [];
  return steps.map((step, i) => ({
    target: targets[i],
    title: step?.title || '',
    body: step?.body || '',
  }));
}

export function useTourSteps(tourKey) {
  const { t, i18n } = useTranslation('tours');
  return useMemo(() => buildTourSteps(t, tourKey), [t, tourKey, i18n.language]);
}
