import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { CONSENT_CHANGED_EVENT } from '../lib/cookieConsent';
import { APP_LOCALE_CHANGED, detectBrowserLocale, readStoredAppLocale, setAppLocale } from '../lib/locale';
import { localePath, parsePathname } from '../lib/localeRoutes';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../lib/authApi';
import './LocaleSwitch.css';

export default function LocaleSwitch({ className = '' }) {
  const { i18n, t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const locale = i18n.language?.startsWith('es') ? 'es' : 'en';

  useEffect(() => {
    const syncFromStorage = () => {
      const stored = readStoredAppLocale();
      const next = stored ?? detectBrowserLocale();
      if (next !== (i18n.language?.startsWith('es') ? 'es' : 'en')) {
        i18n.changeLanguage(next);
        document.documentElement.lang = next;
      }
    };

    const onLocaleChanged = (event) => {
      const next = event.detail === 'es' ? 'es' : 'en';
      if (next !== locale) {
        i18n.changeLanguage(next);
      }
    };

    window.addEventListener(APP_LOCALE_CHANGED, onLocaleChanged);
    window.addEventListener(CONSENT_CHANGED_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener(APP_LOCALE_CHANGED, onLocaleChanged);
      window.removeEventListener(CONSENT_CHANGED_EVENT, syncFromStorage);
    };
  }, [i18n, locale]);

  function handleChange(next) {
    const normalized = next === 'es' ? 'es' : 'en';
    setAppLocale(normalized);
    i18n.changeLanguage(normalized);

    const { path } = parsePathname(location.pathname);
    const target = localePath(normalized, path);
    const suffix = `${location.search || ''}${location.hash || ''}`;
    navigate(`${target}${suffix}`, { replace: true });

    if (isAuthenticated) {
      updateProfile({ preferredLocale: normalized }).catch(() => {});
    }
  }

  return (
    <div
      className={`arena-locale-switch${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={t('locale.switchLabel')}
    >
      <button
        type="button"
        className={`arena-locale-switch__btn${locale === 'en' ? ' is-active' : ''}`}
        aria-pressed={locale === 'en'}
        onClick={() => handleChange('en')}
      >
        {t('locale.en')}
      </button>
      <span className="arena-locale-switch__divider" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        className={`arena-locale-switch__btn${locale === 'es' ? ' is-active' : ''}`}
        aria-pressed={locale === 'es'}
        onClick={() => handleChange('es')}
      >
        {t('locale.es')}
      </button>
    </div>
  );
}
