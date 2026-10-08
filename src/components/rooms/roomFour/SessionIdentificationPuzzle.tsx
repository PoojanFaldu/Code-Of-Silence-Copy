import { useEffect, useRef, useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { useGame } from "@/contexts/GameContext";

interface SessionIdentificationPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

const TERM_FONT =
  'ui-monospace, "JetBrains Mono", "Fira Code", "Courier New", monospace';

/** Binary bytes for N E H A — not shown as letters anywhere else. */
const BINARY_BYTES = ["01001110", "01000101", "01001000", "01000001"] as const;

const ASCII_REF = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((ch, i) => ({
  ch,
  code: 65 + i,
}));

export default function SessionIdentificationPuzzle({
  onSolved,
  onClose,
}: SessionIdentificationPuzzleProps) {
  const { penalizeWrongAnswer } = useGame();
  const [user, setUser] = useState("");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const [showAscii, setShowAscii] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [done, showAscii]);

  const verify = () => {
    const cleaned = user.trim().toUpperCase().replace(/\s+/g, "");
    if (cleaned === "NEHA") {
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
        <div className="space-y-3 py-2 text-center" style={{ fontFamily: TERM_FONT }}>
          <p className="text-sm font-semibold tracking-[0.2em] text-emerald-300">ACCESS GRANTED</p>
          <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-4 text-xs text-slate-200 space-y-1.5">
            <p className="text-slate-500">ACCOUNT</p>
            <p className="text-emerald-200 tracking-wider">Neha Rao</p>
          </div>
        </div>
      </PuzzleShell>
    );
  }

  return (
    <PuzzleShell title="System Access" accent="slate" onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-3">
        <div
          className="relative overflow-hidden rounded-xl border border-white/10 bg-[#05070b] px-4 py-4 shadow-inner"
          style={{ fontFamily: TERM_FONT }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.35)_3px)]" />
          <div className="relative space-y-3 text-[12px] sm:text-[13px] leading-relaxed text-slate-300">
            <p className="text-slate-100 tracking-[0.25em] text-center">SYSTEM ACCESS</p>
            <p className="text-center text-[11px] text-slate-500 tracking-wider">
              USER IDENTIFICATION REQUIRED
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed border-t border-white/5 pt-3">
              The system stores names as binary. Convert each 8-bit value into a character.
            </p>
            <div className="space-y-1 border border-white/10 bg-black/40 px-3 py-3 text-emerald-300/90">
              {BINARY_BYTES.map((b) => (
                <p key={b} className="tracking-[0.2em]">
                  {b}
                </p>
              ))}
            </div>

            <form
              className="space-y-2 pt-1"
              onSubmit={(e) => {
                e.preventDefault();
                verify();
              }}
            >
              <label className="block space-y-1.5">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">
                  Enter user
                </span>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-3 py-2.5">
                  <span className="text-emerald-400/90">&gt;</span>
                  <input
                    ref={inputRef}
                    value={user}
                    onChange={(e) => {
                      setUser(e.target.value);
                      setError(false);
                    }}
                    className="min-w-0 flex-1 bg-transparent text-emerald-100 caret-emerald-300 outline-none tracking-[0.2em] uppercase"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="····"
                  />
                  <span className="inline-block h-4 w-2 animate-pulse bg-emerald-400/80" aria-hidden />
                </div>
              </label>
              {error && (
                <p className="text-center text-xs text-rose-400 tracking-wider">ACCESS DENIED</p>
              )}
              <PuzzlePrimaryButton accent="slate" type="submit" disabled={!user.trim()}>
                SUBMIT
              </PuzzlePrimaryButton>
            </form>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAscii((v) => !v)}
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-mono tracking-widest text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]"
        >
          {showAscii ? "HIDE ASCII REFERENCE" : "ASCII REFERENCE"}
        </button>

        {showAscii && (
          <div
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-[11px] text-slate-400"
            style={{ fontFamily: TERM_FONT }}
          >
            <p className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">
              Decimal codes (A–Z)
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-x-2 gap-y-1">
              {ASCII_REF.map((row) => (
                <span key={row.ch}>
                  {row.ch}={row.code}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-500 leading-relaxed">
              Tip: convert each binary byte to decimal, then match the letter.
            </p>
          </div>
        )}
      </div>
    </PuzzleShell>
  );
}
