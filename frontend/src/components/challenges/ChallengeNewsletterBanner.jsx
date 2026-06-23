import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LocaleLink from '../LocaleLink';
import * as authApi from '../../lib/authApi';
import { useAuth } from '../../context/AuthContext';

export default function ChallengeNewsletterBanner() {
  const { t } = useTranslation('challenges');
  const { user, isAuthenticated, loadUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const isStudent = isAuthenticated && user?.role === 'STUDENT';
  const subscribed = Boolean(user?.newChallengeEmailAlerts);
  const canToggle = isStudent && user?.emailVerified;

  async function handleToggle(checked) {
    setSaving(true);
    try {
      await authApi.updateProfile({ newChallengeEmailAlerts: checked });
      await loadUser();
    } catch (err) {
      alert(err?.message || t('newsletter.updateError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="ch-newsletter-banner" aria-labelledby="ch-newsletter-heading">
      <div className="ch-newsletter-banner-accent" aria-hidden="true" />
      <div className="ch-newsletter-banner-inner">
        <div className="ch-newsletter-copy">
          <div className="ch-newsletter-eyebrow">{t('newsletter.eyebrow')}</div>
          <h2 id="ch-newsletter-heading" className="ch-newsletter-title">
            {t('newsletter.title')}
          </h2>
          <p className="ch-newsletter-desc">{t('newsletter.desc')}</p>
        </div>

        <div className="ch-newsletter-action">
          {!isAuthenticated ? (
            <LocaleLink to="/login" className="ch-newsletter-cta">
              {t('newsletter.loginCta')}
            </LocaleLink>
          ) : !isStudent ? (
            <p className="ch-newsletter-note">{t('newsletter.studentsOnly')}</p>
          ) : (
            <label className="ch-newsletter-toggle">
              <input
                type="checkbox"
                checked={subscribed}
                disabled={saving || !canToggle}
                onChange={(e) => handleToggle(e.target.checked)}
              />
              <span className="ch-newsletter-toggle-ui" aria-hidden="true" />
              <span className="ch-newsletter-toggle-copy">
                <strong>{t('newsletter.toggleLabel')}</strong>
                <span>{t('newsletter.toggleHint')}</span>
                {!user?.emailVerified ? (
                  <span className="ch-newsletter-verify">{t('newsletter.verifyEmail')}</span>
                ) : subscribed ? (
                  <span className="ch-newsletter-on">{t('newsletter.enabled')}</span>
                ) : null}
              </span>
            </label>
          )}
        </div>
      </div>
    </section>
  );
}
