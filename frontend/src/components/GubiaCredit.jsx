import {
  GUBIA_WORDMARK,
  GUBIA_WORDMARK_HEIGHT,
  GUBIA_WORDMARK_WIDTH,
  gubiaHref,
} from "../brand/gubia";
import "./gubia-credit.css";

export default function GubiaCredit() {
  const href = gubiaHref();
  const external = href.startsWith("http://") || href.startsWith("https://");

  return (
    <p className="gubia-credit">
      <span>Developed by</span>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        onClick={external ? undefined : (event) => event.preventDefault()}
      >
        <img
          src={GUBIA_WORDMARK}
          alt="Gubia"
          width={GUBIA_WORDMARK_WIDTH}
          height={GUBIA_WORDMARK_HEIGHT}
        />
      </a>
    </p>
  );
}
