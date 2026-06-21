import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function HubPanel({ eyebrow, title, children, actionLabel, actionTo, accent = "sand" }: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  actionLabel?: string;
  actionTo?: string;
  accent?: "sand" | "sage" | "sky";
}) {
  return (
    <section className={`hub-panel hub-panel--${accent}`}>
      <header className="hub-panel__header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {actionLabel && actionTo ? <Link className="back-link" to={actionTo}>{actionLabel}</Link> : null}
      </header>
      {children}
    </section>
  );
}
