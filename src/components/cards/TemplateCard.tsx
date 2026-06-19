import { CATEGORY_LABELS } from "../../domain/constants";
import type { StarterTemplate } from "../../domain/types";
import { Badge } from "../common/Badge";

export function TemplateCard({ template }: { template: StarterTemplate }) {
  return (
    <article className="template-card">
      <div className="template-card__heading">
        <div>
          <Badge tone="accent">{CATEGORY_LABELS[template.category]}</Badge>
          <h2>{template.name}</h2>
        </div>
        <span className="duration">{template.defaultDurationMinutes} min</span>
      </div>
      <p className="template-card__label">Usual prep</p>
      <ul className="compact-list">
        {template.defaultPrepTasks.map((task) => <li key={task}>{task}</li>)}
      </ul>
      <p className="template-card__footer">
        Car: <strong>{template.defaultCarNeed.replace("_", " ")}</strong>
      </p>
    </article>
  );
}
