import { useGame } from "@/contexts/GameContext";
import { Clock, AlertTriangle } from "lucide-react";

export function formatMissionTime(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function GlobalTimer() {
  const { timeRemaining, missionStarted } = useGame();
  const isCritical = timeRemaining < 300; // less than 5 minutes

  if (!missionStarted) return null;

  return (
    <div
      aria-label="Mission Timer"
      className="fixed top-4 right-4 z-[70] pointer-events-none select-none transition-all duration-300 animate-fade-in"
    >
      <div
        className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 ${
          isCritical
            ? "border-red-500/80 bg-red-950/80 text-red-100 shadow-red-900/50 animate-pulse"
            : "border-cyan-500/30 bg-black/85 text-cyan-50 shadow-cyan-950/40 hover:border-cyan-400/60"
        }`}
        style={{
          boxShadow: isCritical
            ? "0 0 25px rgba(239, 68, 68, 0.45), inset 0 0 15px rgba(239, 68, 68, 0.15)"
            : "0 0 20px rgba(6, 182, 212, 0.25), inset 0 0 10px rgba(6, 182, 212, 0.08)",
        }}
      >
        {/* Pulsing indicator dot / icon */}
        <div className="relative flex items-center justify-center">
          <span
            className={`absolute -inset-1 rounded-full opacity-75 blur-sm animate-ping ${
              isCritical ? "bg-red-500" : "bg-cyan-400"
            }`}
          />
          <div
            className={`relative flex h-6 w-6 items-center justify-center rounded-lg border ${
              isCritical
                ? "border-red-400/60 bg-red-900/50 text-red-300"
                : "border-cyan-400/40 bg-cyan-950/60 text-cyan-300"
            }`}
          >
            {isCritical ? (
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 animate-bounce" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-cyan-300" />
            )}
          </div>
        </div>

        {/* Time display & mini label */}
        <div className="flex flex-col items-start leading-none">
          <span
            className={`text-[9px] font-bold tracking-[0.2em] uppercase ${
              isCritical ? "text-red-300" : "text-cyan-400/80"
            }`}
          >
            {isCritical ? "CRITICAL TIME" : "MISSION TIMER"}
          </span>
          <span
            className={`font-mono text-lg sm:text-xl font-black tracking-wider ${
              isCritical ? "text-red-400" : "text-cyan-300"
            }`}
          >
            {formatMissionTime(timeRemaining)}
          </span>
        </div>
      </div>
    </div>
  );
}
