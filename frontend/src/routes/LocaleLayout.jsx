import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import i18n from '../i18n/index.js';
import { isValidLocale, localePath, parsePathname, resolveEntryLocale } from '../lib/localeRoutes.js';
import { setAppLocale } from '../lib/locale.js';
import LocalePreferenceSync from '../components/LocalePreferenceSync.jsx';

const LocaleContext = createContext({
  locale: 'en',
  path: '/',
});

export function useAppLocale() {
  return useContext(LocaleContext);
}

export function useLocalizedPath() {
  const { locale } = useAppLocale();
  return useCallback((path) => localePath(locale, path), [locale]);
}

/** navigate() wrapper that prefixes logical paths with the active locale. */
export function useNavigateLocalized() {
  const navigate = useNavigate();
  const lp = useLocalizedPath();
  return useCallback(
    (to, options) => {
      if (typeof to === 'number') return navigate(to);
      if (typeof to === 'string') return navigate(lp(to), options);
      if (to && typeof to === 'object' && to.pathname) {
        return navigate({ ...to, pathname: lp(to.pathname) }, options);
      }
      return navigate(to, options);
    },
    [navigate, lp],
  );
}

export function RootLocaleRedirect() {
  const location = useLocation();
  const target = localePath(resolveEntryLocale(), location.pathname === '/' ? '/' : location.pathname);
  const suffix = `${location.search || ''}${location.hash || ''}`;
  return <Navigate to={`${target}${suffix}`} replace />;
}

export default function LocaleLayout() {
  const { locale: localeParam } = useParams();
  const location = useLocation();

  if (!isValidLocale(localeParam)) {
    const logical = location.pathname.startsWith('/') ? location.pathname : `/${location.pathname}`;
    const target = localePath(resolveEntryLocale(), logical);
    const suffix = `${location.search || ''}${location.hash || ''}`;
    return <Navigate to={`${target}${suffix}`} replace />;
  }

  const locale = localeParam;
  const { path } = parsePathname(location.pathname);

  useEffect(() => {
    const next = locale === 'es' ? 'es' : 'en';
    setAppLocale(next);
    if (i18n.language !== next) {
      i18n.changeLanguage(next);
    }
  }, [locale]);

  const value = useMemo(() => ({ locale, path }), [locale, path]);

  return (
    <LocaleContext.Provider value={value}>
      <LocalePreferenceSync />
      <Outlet />
    </LocaleContext.Provider>
  );
}
