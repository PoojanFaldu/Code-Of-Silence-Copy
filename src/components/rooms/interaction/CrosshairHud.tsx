import type { FocusedInteractable } from "./types";

type CrosshairHudProps = {
  focused: FocusedInteractable;
  hint?: string;
  visible?: boolean;
};

export default function CrosshairHud({
  focused,
  hint = "WASD move · Hold click look · E interact",
  visible = true,
}: CrosshairHudProps) {
  if (!visible) return null;

  return (
    <>
      {/* Center crosshair */}
      <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
        <div className="relative h-5 w-5">
          <div
            className={`absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 ${
              focused ? "bg-cyan-300" : "bg-white/70"
            }`}
          />
          <div
            className={`absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 ${
              focused ? "bg-cyan-300" : "bg-white/70"
            }`}
          />
          <div
            className={`absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              focused ? "bg-cyan-200" : "bg-white/50"
            }`}
          />
        </div>
      </div>

      {/* Focus prompt */}
      {focused && (
        <div className="pointer-events-none absolute bottom-[22%] left-1/2 z-30 -translate-x-1/2">
          <div className="rounded-lg border border-white/25 bg-black/80 px-4 py-2 text-center shadow-lg backdrop-blur-sm">
            <p className="text-sm font-medium text-white">{focused.label}</p>
            <p className="mt-1 font-mono text-xs text-cyan-300">
              Press <span className="rounded border border-cyan-400/50 bg-cyan-500/15 px-1.5 py-0.5">E</span> to
              interact
            </p>
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
        <div className="rounded-lg border border-white/15 bg-black/75 px-5 py-2">
          <p className="font-mono text-xs text-white/80 sm:text-sm">{hint}</p>
        </div>
      </div>
    </>
  );
}
