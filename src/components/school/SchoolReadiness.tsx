import type { SchoolReadinessForDate } from "../../domain/types";
import { Badge } from "../common/Badge";

export function SchoolReadiness({ readiness, compact = false, heading }: { readiness: SchoolReadinessForDate; compact?: boolean; heading?: string }) {
  if (readiness.schoolStatus === "closed") return null;
  const forest = readiness.forestSchool;
  return <article className={`school-readiness${compact ? " school-readiness--compact" : ""}`}>
    {heading ? <strong className="school-readiness__heading">{heading}</strong> : null}
    <div className="school-readiness__badges">
      <Badge tone={readiness.schoolStatus === "open" ? "success" : "neutral"}>{readiness.schoolStatus === "open" ? "School open" : "School unknown"}</Badge>
      {readiness.hasConfiguration ? <><Badge>{readiness.lunch.label}</Badge><Badge>{readiness.attire.label}</Badge>{forest.required ? <Badge tone="warning">Forest School</Badge> : null}</> : null}
    </div>
    {!compact && readiness.lunch.choice ? <p><strong>Dinner choice:</strong> {readiness.lunch.choice}</p> : null}
    {forest.required && !compact ? <p>Bring: {[forest.wellingtonBoots && "wellies", forest.longTrousers && "long trousers", forest.waterproofs && "waterproofs"].filter(Boolean).join(", ") || "check Forest School notes"}</p> : null}
    {readiness.readinessItems.filter((item) => item.category !== "forest_school").map((item) => <p className="school-readiness__warning" key={item.id}>⚠ {item.label}</p>)}
  </article>;
}
