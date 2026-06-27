import type { ReactNode } from "react";

export function HubPanel({ eyebrow, title, children, accent = "sand" }: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  accent?: "sand" | "sage" | "sky";
}) {
  return (
    <section className={`hub-panel hub-panel--${accent}`}>
      <header className="hub-panel__header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </header>
      {children}
    </section>
  );
}
