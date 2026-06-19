import type { IconName } from "../common/Icon";
import { Icon } from "../common/Icon";

export function PlaceholderPanel({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <section className="placeholder-panel">
      <span className="placeholder-panel__icon"><Icon name={icon} /></span>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </section>
  );
}
