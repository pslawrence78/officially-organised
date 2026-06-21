import { Badge } from "../common/Badge";

export function HubStatusFooter({ generatedAt, isOffline, weatherStale, weatherUnavailable, weatherConfigured, privacyMode }: {
  generatedAt: string;
  isOffline: boolean;
  weatherStale: boolean;
  weatherUnavailable: boolean;
  weatherConfigured: boolean;
  privacyMode: boolean;
}) {
  return (
    <footer className="hub-status-footer">
      <div className="hub-inline-badges">
        <Badge tone="accent">Read-only Hub</Badge>
        <Badge tone={isOffline ? "warning" : "success"}>{isOffline ? "Offline" : "Online"}</Badge>
        <Badge tone={privacyMode ? "warning" : "neutral"}>{privacyMode ? "Privacy on" : "Privacy off"}</Badge>
        <Badge tone={weatherStale ? "warning" : weatherUnavailable ? "neutral" : weatherConfigured ? "success" : "neutral"}>
          {weatherStale ? "Weather stale" : weatherUnavailable ? "Weather unavailable" : weatherConfigured ? "Weather ready" : "Weather off"}
        </Badge>
      </div>
      <small>Last refreshed {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(generatedAt))}</small>
    </footer>
  );
}
