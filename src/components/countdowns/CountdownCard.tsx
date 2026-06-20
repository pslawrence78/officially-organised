import type { CountdownDisplay } from "../../domain/types";
import { Icon } from "../common/Icon";

export function CountdownCard({ countdown, primary = false }: { countdown: CountdownDisplay; primary?: boolean }) {
  return <article className={`countdown-card${primary ? " countdown-card--primary" : ""}`}><span className="countdown-card__icon"><Icon name="clock" /></span><div><p>{countdown.isToday ? "Today" : countdown.showSleeps ? `${countdown.sleepsUntil} ${countdown.sleepsUntil === 1 ? "sleep" : "sleeps"}` : `${countdown.daysUntil} ${countdown.daysUntil === 1 ? "day" : "days"}`}</p><h3>{countdown.title}</h3><span>{countdown.targetDate}</span></div></article>;
}
