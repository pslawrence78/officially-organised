import { registerSW } from "virtual:pwa-register";

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      window.dispatchEvent(
        new CustomEvent("officially-organised:update-available", {
          detail: { updateServiceWorker },
        }),
      );
    },
    onRegisterError(error) {
      console.warn("The offline app shell could not be registered.", error);
    },
  });
}
