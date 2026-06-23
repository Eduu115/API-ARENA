import i18n from '../i18n/index.js';
import { localePath } from './localeRoutes.js';

function currentLocale() {
  return i18n.language?.startsWith('es') ? 'es' : 'en';
}

/**
 * Primary in-app link for a notification row or push toast.
 */
export function notificationActionPath(notification) {
  const loc = currentLocale();
  if (!notification) return localePath(loc, '/notifications');
  if (notification.type === 'ACHIEVEMENT_UNLOCKED') {
    return localePath(loc, '/perfil/achievements');
  }
  if (notification.type === 'NEW_CHALLENGE_PUBLISHED') {
    const cid = notification.metadata?.challengeId;
    if (cid != null) {
      return localePath(loc, `/challenges/${cid}`);
    }
    return localePath(loc, '/challenges');
  }
  const sid = notification.metadata?.submissionId;
  if (sid != null) {
    return localePath(loc, `/submissions/${sid}`);
  }
  return localePath(loc, '/notifications');
}

export function notificationActionLabel(notification) {
  const t = i18n.getFixedT(null, 'notifications');
  if (!notification) return t('actions.open');
  if (notification.type === 'ACHIEVEMENT_UNLOCKED') {
    return t('actions.seeMore');
  }
  if (notification.type === 'NEW_CHALLENGE_PUBLISHED') {
    return t('actions.viewChallenge');
  }
  const sid = notification.metadata?.submissionId;
  if (sid != null) {
    return t('actions.viewSubmission');
  }
  return t('actions.openInbox');
}
