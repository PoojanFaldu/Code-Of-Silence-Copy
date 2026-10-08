import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { GameProvider } from "./contexts/GameContext";
import { hydrateEventDbFromServer } from "./lib/eventDb";

async function boot() {
  await hydrateEventDbFromServer();
  createRoot(document.getElementById("root")!).render(
    <GameProvider>
      <App />
    </GameProvider>
  );
}

void boot();
