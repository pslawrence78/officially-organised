import { useEffect, useState } from "react";

export function useDocumentHidden() {
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" ? document.hidden : false);

  useEffect(() => {
    const onVisibilityChange = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return hidden;
}

