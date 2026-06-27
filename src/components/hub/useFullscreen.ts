import { useEffect, useState } from "react";
import type { RefObject } from "react";

export function useFullscreen(targetRef: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(() => typeof document !== "undefined" ? Boolean(document.fullscreenElement) : false);
  const [message, setMessage] = useState("");
  const supported = typeof document !== "undefined" && "fullscreenEnabled" in document ? document.fullscreenEnabled : false;

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enter = async () => {
    if (!supported || !targetRef.current?.requestFullscreen) {
      setMessage("Full screen is not supported here.");
      return;
    }
    try {
      await targetRef.current.requestFullscreen();
      setMessage("");
    } catch {
      setMessage("Full screen was not allowed.");
    }
  };

  const exit = async () => {
    if (!document.fullscreenElement) return;
    try {
      await document.exitFullscreen();
      setMessage("");
    } catch {
      setMessage("Full screen could not be closed here.");
    }
  };

  return { supported, isFullscreen, message, enter, exit };
}
