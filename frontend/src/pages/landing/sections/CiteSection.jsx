import { useTranslation } from "react-i18next";

function splitTitle(title) {
  const parts = String(title || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { lead: title, em: "" };
  return { lead: parts.slice(0, -1).join(" "), em: parts[parts.length - 1] };
}

export default function CiteSection() {
  const { t } = useTranslation("landing");
  const faqs = t("cite.faq", { returnObjects: true });
  const items = Array.isArray(faqs) ? faqs : [];
  const { lead, em } = splitTitle(t("cite.title"));

  return (
    <section className="section cite-section" id="about-api-arena" aria-labelledby="cite-heading">
      <div className="cite-grid">
        <div className="cite-aside">
          <div className="section-label">{t("cite.label")}</div>
          <h2 id="cite-heading" className="section-title cite-title">
            {lead}
            {em ? <em>{em}</em> : null}
          </h2>
        </div>
        <dl className="cite-faq">
          {items.map((item) => (
            <div key={item.q}>
              <dt>{item.q}</dt>
              <dd>{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
