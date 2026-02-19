import { TICKER_ITEMS } from '../landing.data';

export default function TickerSection() {
  /* Duplicamos los items para que el scroll infinito no deje huecos */
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

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
