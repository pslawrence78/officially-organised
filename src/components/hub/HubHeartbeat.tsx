import { useEffect, useState } from "react";
import { Badge } from "../common/Badge";
import { getHubRotationStatus } from "../../services/hubRotationService";
import type { HubViewModel } from "../../services/hubService";
import type { HubWallboardSettings } from "../../types/hubRotation";

function timeLabel(isoOrDate: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(isoOrDate));
}

export function HubHeartbeat({
  viewModel,
  settings,
  manuallyPaused,
  hidden,
  reducedMotion,
}: {
  viewModel: HubViewModel;
  settings: HubWallboardSettings;
  manuallyPaused: boolean;
  hidden: boolean;
  reducedMotion: boolean;
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const rotationStatus = getHubRotationStatus(settings, manuallyPaused, hidden, reducedMotion, viewModel.statuses.isOffline);

  return (
    <footer className="hub-heartbeat">
      <div className="hub-inline-badges">
        <Badge tone="accent">Read-only</Badge>
        <Badge tone={rotationStatus.includes("running") ? "success" : "warning"}>{rotationStatus}</Badge>
        <Badge tone={viewModel.statuses.isOffline ? "warning" : "success"}>{viewModel.statuses.isOffline ? "Offline" : "Online"}</Badge>
        <Badge tone={viewModel.statuses.privacyMode ? "warning" : "neutral"}>{viewModel.statuses.privacyMode ? "Privacy mode on" : "Privacy off"}</Badge>
        <Badge tone={viewModel.statuses.weatherStale ? "warning" : viewModel.statuses.weatherUnavailable ? "neutral" : "success"}>
          {viewModel.statuses.weatherStale ? "Weather stale" : viewModel.statuses.weatherUnavailable ? "Weather unavailable" : "Weather checked"}
        </Badge>
      </div>
      <small>Now {timeLabel(now)} · Updated {timeLabel(viewModel.generatedAt)}</small>
    </footer>
  );
}

