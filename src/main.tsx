import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { seedInitialDataIfNeeded } from "./data/repositories";
import { registerServiceWorker } from "./pwa/registerServiceWorker";
import "./styles/tokens.css";
import "./styles/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("The app root element is missing.");
}

const root = createRoot(rootElement);

async function startApplication() {
  try {
    await seedInitialDataIfNeeded();
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    registerServiceWorker();
  } catch (error) {
    console.error("The Lawrence Loop could not start.", error);
    root.render(
      <main className="startup-error" role="alert">
        <p className="eyebrow">The Lawrence Loop</p>
        <h1>We couldn’t open the family loop.</h1>
        <p>Your local data has not been changed. Please reload the app and try again.</p>
        <button onClick={() => window.location.reload()} type="button">Reload app</button>
      </main>,
    );
  }
}

void startApplication();
