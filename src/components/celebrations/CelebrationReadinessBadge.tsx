import { CELEBRATION_READYNESS_LEVEL_LABELS, type CelebrationReadinessLevel } from "../../services/celebrationReadinessService";
import { Badge } from "../common/Badge";

function toneForLevel(level: CelebrationReadinessLevel) {
  if (level === "ready") return "success" as const;
  if (level === "on_track") return "accent" as const;
  if (level === "needs_attention") return "warning" as const;
  if (level === "at_risk" || level === "overdue") return "critical" as const;
  return "neutral" as const;
}

export function CelebrationReadinessBadge({ level }: { level: CelebrationReadinessLevel }) {
  const label = CELEBRATION_READYNESS_LEVEL_LABELS[level];
  return <Badge ariaLabel={`Celebration readiness: ${label}`} title={`Celebration readiness: ${label}`} tone={toneForLevel(level)}>{label}</Badge>;
}

export function celebrationReadinessTone(level: CelebrationReadinessLevel) {
  return toneForLevel(level);
}
