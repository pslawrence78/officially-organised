import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
  title,
  ariaLabel,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "critical";
  title?: string;
  ariaLabel?: string;
}) {
  return <span aria-label={ariaLabel} className={`badge badge--${tone}`} title={title}>{children}</span>;
}
