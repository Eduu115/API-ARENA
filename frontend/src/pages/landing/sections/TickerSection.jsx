import { useTranslation } from 'react-i18next';

export default function TickerSection() {
  const { t } = useTranslation('landing');
  const tickerItems = t('ticker.items', { returnObjects: true });
  const items = Array.isArray(tickerItems) ? [...tickerItems, ...tickerItems] : [];

  return (
    <div className="ticker">
      <div className="ticker-inner">
        {items.map((item, i) => (
          <span key={i} className="ticker-item">{item}</span>
        ))}
      </div>
    </div>
  );
}
