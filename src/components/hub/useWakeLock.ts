import { useEffect, useState } from "react";

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  addEventListener?: (type: "release", listener: () => void) => void;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

export function useWakeLock(enabled: boolean, documentHidden: boolean) {
  const [sentinel, setSentinel] = useState<WakeLockSentinelLike | null>(null);
  const [message, setMessage] = useState("");
  const supported = typeof navigator !== "undefined" && Boolean((navigator as NavigatorWithWakeLock).wakeLock);
  const active = Boolean(sentinel);

  const release = async () => {
    if (!sentinel) return;
    try {
      await sentinel.release();
    } finally {
      setSentinel(null);
    }
  };

  const request = async () => {
    if (!enabled) {
      setMessage("Enable wake lock in settings first.");
      return;
    }
    if (!supported) {
      setMessage("Wake lock is not supported here.");
      return;
    }
    if (documentHidden) {
      setMessage("Wake lock will wait until this screen is visible.");
      return;
    }
    try {
      const lock = await (navigator as NavigatorWithWakeLock).wakeLock?.request("screen");
      if (!lock) return;
      lock.addEventListener?.("release", () => setSentinel(null));
      setSentinel(lock);
      setMessage("");
    } catch {
      setMessage("Wake lock was not allowed.");
    }
  };

  useEffect(() => {
    if (documentHidden) void release();
  }, [documentHidden]);

  useEffect(() => () => {
    if (sentinel) void sentinel.release();
  }, [sentinel]);

  return { supported, active, message, request, release };
}

