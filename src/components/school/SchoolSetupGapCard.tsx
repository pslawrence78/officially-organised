import type { SchoolHubSetupGap } from "../../services/schoolHubService";
import { Link } from "react-router-dom";
import { Badge } from "../common/Badge";

export function SchoolSetupGapCard({ gap }: { gap: SchoolHubSetupGap }) {
  return (
    <article className={`school-hub-gap school-hub-gap--${gap.severity}`}>
      <div className="school-hub-gap__header">
        <strong>{gap.title}</strong>
        <Badge tone={gap.severity === "warning" ? "warning" : "neutral"}>{gap.severity === "warning" ? "Setup needed" : "Check"}</Badge>
      </div>
      <p>{gap.detail}</p>
      <Link className="back-link" to={gap.link.to}>{gap.link.label}</Link>
    </article>
  );
}
