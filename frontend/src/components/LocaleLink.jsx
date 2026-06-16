import { Link } from 'react-router-dom';
import { useLocalizedPath } from '../routes/LocaleLayout.jsx';

/**
 * react-router Link with automatic /:locale prefix.
 */
export default function LocaleLink({ to, ...props }) {
  const lp = useLocalizedPath();

  let target = to;
  if (typeof to === 'string') {
    target = lp(to);
  } else if (to && typeof to === 'object' && to.pathname) {
    target = { ...to, pathname: lp(to.pathname) };
  }

  return <Link to={target} {...props} />;
}
