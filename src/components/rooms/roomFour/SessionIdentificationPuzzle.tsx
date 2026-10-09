import { useEffect, useRef, useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { useGame } from "@/contexts/GameContext";
import { formatMissionTime } from "@/components/common/GlobalTimer";
import {
  AlertTriangle,
  Clock,
  Lock,
  Lightbulb,
  X,
  ShieldAlert,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";

interface SessionIdentificationPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

const TERM_FONT =
  'ui-monospace, "JetBrains Mono", "Fira Code", "Courier New", monospace';

// 6 and a half minutes = 6 mins 30 secs = 390 seconds
const PENALTY_SECONDS = 390;

/** First letter of each word → operator name (N-E-H-A). */
const SIGNAL_WORDS = ["Never", "Ending", "Hostile", "Access"] as const;

export default function SessionIdentificationPuzzle({
  onSolved,
  onClose,
}: SessionIdentificationPuzzleProps) {
  const { deductTime, timeRemaining, penalizeWrongAnswer } = useGame();
  const estimatedNewTime = Math.max(0, timeRemaining - PENALTY_SECONDS);

  const [user, setUser] = useState("");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  // Hint state
  const [hintUnlocked, setHintUnlocked] = useState(false);
  const [showHintConfirm, setShowHintConfirm] = useState(false);
  const [showHintBanner, setShowHintBanner] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.removeItem("room4_session_hint_unlocked");
    } catch {
      /* ignore */
    }
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [done, showHintConfirm]);

  const handleConfirmHint = () => {
    deductTime(PENALTY_SECONDS);
    setHintUnlocked(true);
    setShowHintConfirm(false);
    setShowHintBanner(true);
    toast.error("−6:30 deducted from mission timer for Hint.");
  };

  const verify = () => {
    const cleaned = user.trim().toUpperCase().replace(/[.,_'-]/g, " ").replace(/\s+/g, " ");
    if (cleaned === "NEHA" || cleaned === "NEHA RAO") {
      setError(false);
      setDone(true);
      return;
    }
    setError(true);
    penalizeWrongAnswer();
  };

  if (done) {
    return (
      <PuzzleShell
        title="System Access"
        accent="slate"
        onClose={onClose}
        footer={
          <PuzzlePrimaryButton accent="slate" onClick={onSolved}>
            CONTINUE
          </PuzzlePrimaryButton>
        }
      >
        <div className="space-y-4 py-2 text-center" style={{ fontFamily: TERM_FONT }}>
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5 animate-pulse" />
            <span className="text-sm font-semibold tracking-[0.2em]">ACCESS GRANTED</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/60 px-4 py-4 text-xs text-slate-200 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">AUTHENTICATED OPERATOR</p>
            <p className="text-base text-emerald-300 font-bold tracking-wider">Neha Rao</p>
            <p className="text-[11px] text-slate-400">
              Clearance: Badge B-04 (Archival Audit) · Session Log Verified: 21:14
            </p>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Protected session log decoded. Console records are now accessible.
          </p>
        </div>
      </PuzzleShell>
    );
  }

  return (
    <>
      <PuzzleShell title="System Access" accent="slate" onClose={onClose} maxWidth="max-w-lg">
        <div className="space-y-3">
          {/* Header toolbar with Hint button */}
          <div className="flex items-center justify-between gap-2">
            <div
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-mono tracking-wider text-slate-400 flex-1"
              style={{ fontFamily: TERM_FONT }}
            >
              <Terminal className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>TERMINAL SRV-04 // 21:14:02</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (hintUnlocked) {
                  setShowHintBanner((prev) => !prev);
                } else {
                  setShowHintConfirm(true);
                }
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                hintUnlocked
                  ? "border-amber-400/50 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 shadow-sm shadow-amber-950/40"
              }`}
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              <span>{hintUnlocked ? (showHintBanner ? "Hide Hint" : "Show Hint") : "Hint (-6:30)"}</span>
            </button>
          </div>

          {/* Hint disclosure card when unlocked */}
          {hintUnlocked && showHintBanner && (
            <div
              className="rounded-xl border border-amber-500/30 bg-amber-950/25 p-3 text-xs text-amber-100/90 space-y-1.5 font-mono shadow-inner animate-fade-in"
              style={{ fontFamily: TERM_FONT }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  <span>Session Hint</span>
                </div>
                <span className="text-[10px] text-amber-400/80 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  -6:30 APPLIED
                </span>
              </div>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                Same idea as <span className="text-amber-200 font-semibold">SOS (Secret Outpost Signal)</span> —
                take the <strong className="text-emerald-300">first letter of each word</strong>:
              </p>
              <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                {SIGNAL_WORDS.map((word) => (
                  <span
                    key={word}
                    className="bg-black/50 border border-amber-500/30 px-2 py-0.5 rounded text-amber-200"
                  >
                    <strong className="text-emerald-300">{word[0]}</strong>
                    {word.slice(1)} &rarr; {word[0]}
                  </span>
                ))}
              </div>
              <p className="text-emerald-300/90 text-[11px] pt-0.5">
                Never Ending Hostile Access &rarr; <strong>NEHA</strong>
              </p>
            </div>
          )}

          {/* Terminal Screen */}
          <div
            className="relative overflow-hidden rounded-xl border border-white/10 bg-[#05070b] px-4 py-4 shadow-inner"
            style={{ fontFamily: TERM_FONT }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.35)_3px)]" />

            <div className="relative space-y-3 text-[12px] sm:text-[13px] leading-relaxed text-slate-300">
              <div className="text-center space-y-1">
                <p className="text-slate-100 tracking-[0.25em] text-xs font-bold uppercase">
                  SYSTEM ACCESS
                </p>
                <p className="text-[11px] text-slate-500 tracking-wider">
                  OPERATOR SIGNAL INTERCEPT
                </p>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                An unauthorized session was logged at 21:14. The terminal buffer captured this operator
                tag — coded the same way as{" "}
                <span className="text-emerald-300/90 font-semibold">SOS (Secret Outpost Signal)</span>:
              </p>

              <div className="rounded-lg border border-white/10 bg-black/50 p-3.5 space-y-3">
                <p className="text-center font-mono text-sm sm:text-base font-bold tracking-[0.18em] text-emerald-300">
                  {SIGNAL_WORDS.join(" ")}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SIGNAL_WORDS.map((word, idx) => (
                    <div
                      key={word}
                      className="flex flex-col items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-950/20 py-2 px-1 text-center"
                    >
                      <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">
                        Word 0{idx + 1}
                      </span>
                      <span className="text-xs font-mono font-bold tracking-wider text-emerald-300 pt-0.5">
                        {word}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                  Tip: like SOS → Secret Outpost Signal, take the first letter of each word.
                </p>
              </div>

              {/* Input form */}
              <form
                className="space-y-2 pt-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  verify();
                }}
              >
                <label className="block space-y-1.5">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500">
                    Enter Operator
                  </span>
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 px-3 py-2.5">
                    <span className="text-emerald-400/90">&gt;</span>
                    <input
                      ref={inputRef}
                      value={user}
                      onChange={(e) => {
                        setUser(e.target.value);
                        setError(false);
                      }}
                      className="min-w-0 flex-1 bg-transparent text-emerald-100 caret-emerald-300 outline-none tracking-[0.2em] uppercase font-mono text-sm"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="ENTER OPERATOR"
                    />
                    <span className="inline-block h-4 w-2 animate-pulse bg-emerald-400/80" aria-hidden />
                  </div>
                </label>

                {error && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 tracking-wider pt-0.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>ACCESS DENIED — OPERATOR MISMATCH (−2:00)</span>
                  </div>
                )}

                <PuzzlePrimaryButton accent="slate" type="submit" disabled={!user.trim()}>
                  SUBMIT
                </PuzzlePrimaryButton>
              </form>
            </div>
          </div>
        </div>
      </PuzzleShell>

      {/* 6.5 Minutes Hint Confirmation Modal */}
      {showHintConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-md rounded-2xl border border-amber-500/50 bg-[#0c1017] p-5 sm:p-6 shadow-2xl shadow-amber-950/50"
            style={{ fontFamily: TERM_FONT }}
          >
            <button
              type="button"
              onClick={() => setShowHintConfirm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider text-amber-200">
                  Time Penalty Warning
                </h3>
                <p className="text-xs text-amber-400/80">SESSION RECOVERY HINT</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/60 p-4 mb-4 space-y-2.5">
              <p className="text-sm font-semibold text-white leading-snug">
                6 minutes and 30 seconds will be deducted from your countdown timer for this hint.
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Unlocking this hint shows how to read the operator tag (first letter of each word).
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Current Time:
                </span>
                <span className="text-cyan-300 font-bold">
                  {formatMissionTime(timeRemaining)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-400 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-red-400" /> After -6:30 Penalty:
                </span>
                <span className="text-red-400 font-bold">
                  {formatMissionTime(estimatedNewTime)}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowHintConfirm(false)}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmHint}
                className="flex-1 rounded-xl border border-amber-500/50 bg-amber-500/20 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-500/30 hover:border-amber-400 shadow-lg shadow-amber-950/40 transition cursor-pointer"
              >
                Confirm (-6:30)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
