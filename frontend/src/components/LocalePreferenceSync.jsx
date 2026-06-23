import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../lib/authApi';
import { useAppLocale } from '../routes/LocaleLayout';

/**
 * Keeps users.preferred_locale aligned with the active URL locale when authenticated.
 * URL remains the source of truth; this only mirrors the choice to the backend.
 */
export default function LocalePreferenceSync() {
  const { user, isAuthenticated } = useAuth();
  const { locale } = useAppLocale();
  const lastSynced = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const preferred = user.preferredLocale === 'es' ? 'es' : user.preferredLocale === 'en' ? 'en' : null;
    if (preferred === locale) {
      lastSynced.current = locale;
      return;
    }
    if (lastSynced.current === locale) return;
    lastSynced.current = locale;
    updateProfile({ preferredLocale: locale }).catch(() => {
      lastSynced.current = null;
    });
  }, [isAuthenticated, user?.id, user?.preferredLocale, locale]);

  return null;
}
