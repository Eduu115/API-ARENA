import { useTranslation } from "react-i18next";
import Topbar from "../../components/Topbar";
import BottomNav from "../../components/BottomNav";
import CustomCursor from "../../components/CustomCursor";
import SeoBreadcrumb from "../../components/SeoBreadcrumb";
import { usePageMeta } from "../../lib/usePageMeta";
import { aboutGraph } from "../../seo/site";
import { useAppLocale } from "../../routes/LocaleLayout";
import "../challenges/challenges.css";
import "./about.css";

function Copy({ value }) {
  const text = value == null ? "" : String(value);
  if (text.includes("TODO(content)")) {
    return <span className="about-todo">{text}</span>;
  }
  return text;
}

export default function AboutPage() {
  const { t } = useTranslation("about");
  const { locale } = useAppLocale();
  const stack = t("stack.items", { returnObjects: true });
  const timeline = t("timeline.items", { returnObjects: true });
  const links = t("links.items", { returnObjects: true });
  const description = t("meta.description");

  usePageMeta({
    title: t("meta.title"),
    description,
    path: "/about",
    jsonLd: aboutGraph(locale, {
      homeName: t("breadcrumb.home"),
      aboutName: t("meta.title"),
      description,
    }),
  });

  return (
    <div className="challenges-page about-page">
      <CustomCursor />
      <div className="ch-grid-bg" aria-hidden="true" />
      <div className="ch-layout" style={{ gridTemplateColumns: "1fr" }}>
        <Topbar onMenuToggle={() => {}} sidebarOpen={false} showSidebarToggle={false} />
        <main className="ch-main">
          <SeoBreadcrumb
            label={t("breadcrumb.aria")}
            items={[
              { name: t("breadcrumb.home"), to: "/" },
              { name: t("breadcrumb.about") },
            ]}
          />

          <header className="ch-page-header">
            <div>
              <div className="ch-page-eyebrow">{t("eyebrow")}</div>
              <h1 className="ch-page-title">
                {t("titleBefore")}
                <em>{t("titleEm")}</em>
              </h1>
              <p className="about-lede">{t("lede")}</p>
              <p className="about-notice">{t("notice")}</p>
            </div>
          </header>

          <div className="about-identity">
            <figure className="about-portrait">
              <figcaption>
                <Copy value={t("portrait")} />
              </figcaption>
            </figure>
            <dl>
              <dt>{t("nameLabel")}</dt>
              <dd><Copy value={t("name")} /></dd>
              <dt>{t("roleLabel")}</dt>
              <dd><Copy value={t("role")} /></dd>
            </dl>
          </div>

          <section className="about-section">
            <h2>{t("story.heading")}</h2>
            <p className="about-prose"><Copy value={t("story.body")} /></p>
          </section>

          <section className="about-section">
            <h2>{t("motivation.heading")}</h2>
            <p className="about-prose"><Copy value={t("motivation.body")} /></p>
          </section>

          <section className="about-section">
            <h2>{t("background.heading")}</h2>
            <p className="about-prose"><Copy value={t("background.body")} /></p>
          </section>

          <section className="about-section">
            <h2>{t("stack.heading")}</h2>
            <ul className="about-stack">
              {stack.map((item, index) => (
                <li key={index}><Copy value={item} /></li>
              ))}
            </ul>
          </section>

          <section className="about-section">
            <h2>{t("timeline.heading")}</h2>
            <ol className="about-timeline">
              {timeline.map((item, index) => (
                <li key={index}>
                  <time><Copy value={item.when} /></time>
                  <span><Copy value={item.what} /></span>
                </li>
              ))}
            </ol>
          </section>

          <section className="about-section">
            <h2>{t("links.heading")}</h2>
            <dl className="about-links">
              {links.map((item, index) => (
                <div key={index}>
                  <dt><Copy value={item.label} /></dt>
                  <dd><Copy value={item.href} /></dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="about-section">
            <h2>{t("contact.heading")}</h2>
            <p className="about-prose"><Copy value={t("contact.body")} /></p>
          </section>

          <section className="about-section about-company">
            <h2>{t("company.heading")}</h2>
            <p className="about-prose"><Copy value={t("company.body")} /></p>
            <p className="about-url">
              {t("company.urlLabel")} <Copy value={t("company.url")} />
            </p>
          </section>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
