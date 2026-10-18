import { Fragment } from "react";
import LocaleLink from "./LocaleLink";

export default function SeoBreadcrumb({ items, label = "Breadcrumb" }) {
  return (
    <nav className="seo-breadcrumb" aria-label={label}>
      {items.map((item, index) => (
        <Fragment key={`${item.name}-${index}`}>
          {index > 0 ? <span aria-hidden="true">/</span> : null}
          {item.to ? (
            <LocaleLink to={item.to}>{item.name}</LocaleLink>
          ) : (
            <span aria-current="page">{item.name}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
