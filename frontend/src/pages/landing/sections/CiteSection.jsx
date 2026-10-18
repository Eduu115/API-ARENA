import { useTranslation } from "react-i18next";

export default function CiteSection() {
  const { t } = useTranslation("landing");
  const faqs = t("cite.faq", { returnObjects: true });
  const items = Array.isArray(faqs) ? faqs : [];

  return (
    <section className="section" id="about-api-arena" aria-labelledby="cite-heading">
      <div className="cite-inner">
        <div className="section-label">{t("cite.label")}</div>
        <h2 id="cite-heading" className="section-title cite-title">{t("cite.title")}</h2>
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
