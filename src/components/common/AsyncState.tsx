import type { ReactNode } from "react";

export function LoadingState({ label = "Loading your plans…" }: { label?: string }) {
  return <p className="status-message">{label}</p>;
}

export function ErrorState({ children }: { children?: ReactNode }) {
  return (
    <div className="notice notice--error" role="alert">
      <strong>Something went awry.</strong>
      <span>{children ?? "Local data could not be read. Please reload and try again."}</span>
    </div>
  );
}
