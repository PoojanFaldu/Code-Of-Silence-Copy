import { useEffect, useRef, useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { useGame } from "@/contexts/GameContext";

/** Baseline 84.2% (8, 4) + relay glyph (7). */
export const CCTV_CODE = "847";

interface CctvMonitorProps {
  unlocked: boolean;
  onUnlocked: () => void;
  onAccuse: () => void;
  onClose: () => void;
}

export default function CctvMonitor({
  unlocked,
  onUnlocked,
  onAccuse,
  onClose,
}: CctvMonitorProps) {
  const { penalizeWrongAnswer } = useGame();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    const v = videoRef.current;
    if (!v) return;
    void v.play().catch(() => undefined);
  }, [unlocked]);

  const submitCode = () => {
    const cleaned = code.replace(/\D/g, "").slice(0, 3);
    if (cleaned === CCTV_CODE) {
      setError(false);
      onUnlocked();
      return;
    }
    setError(true);
    penalizeWrongAnswer();
    setCode("");
  };

  const replay = () => {
    setEnded(false);
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    void v.play().catch(() => undefined);
  };

  return (
    <PuzzleShell
      title="CCTV Monitor"
      accent="slate"
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        unlocked ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={replay}
              className="rounded-lg border border-white/15 px-4 py-2.5 text-xs font-mono tracking-wider text-slate-300 hover:text-white hover:bg-white/5"
            >
              REPLAY
            </button>
            <PuzzlePrimaryButton accent="rose" onClick={onAccuse} className="flex-1">
              GUESS THE MURDERER
            </PuzzlePrimaryButton>
          </div>
        ) : (
          <PuzzlePrimaryButton
            accent="slate"
            onClick={submitCode}
            disabled={code.replace(/\D/g, "").length < 3}
          >
            UNLOCK
          </PuzzlePrimaryButton>
        )
      }
    >
      {!unlocked ? (
        <div className="space-y-4 py-2">
          <p className="text-center text-xs text-slate-400">Enter 3-digit access code</p>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              submitCode();
            }}
          >
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              maxLength={3}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 3));
                setError(false);
              }}
              placeholder="•••"
              autoComplete="off"
              className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-4 text-center font-mono text-3xl tracking-[0.6em] text-white placeholder:text-slate-600 focus:border-slate-400/50 focus:outline-none"
            />
          </form>
          {error && <p className="text-center text-xs text-rose-400">Wrong code. −2:00</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
            <video
              ref={videoRef}
              src="/video/CCTV.mp4"
              className="w-full max-h-[52vh] bg-black object-contain"
              controls
              autoPlay
              playsInline
              onEnded={() => setEnded(true)}
              onPlay={() => setEnded(false)}
            />
            {ended && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="font-mono text-xs tracking-widest text-slate-200">END OF RECORDING</p>
              </div>
            )}
          </div>
          <p className="text-center text-[11px] text-slate-500">Lab camera feed recovered.</p>
        </div>
      )}
    </PuzzleShell>
  );
}
