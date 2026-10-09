import { useMemo, useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";

interface TangledWiresPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

const LEFT = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const RIGHT = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

/** True endpoints — grey wires always run here; player traces them. */
const SOLUTION: Record<number, string> = {
  1: "C",
  2: "E",
  3: "A",
  4: "G",
  5: "B",
  6: "H",
  7: "D",
  8: "F",
};

type Pair = { from: number; to: string };

function leftY(n: number) {
  return 22 + (n - 1) * 34;
}

function rightY(letter: string) {
  const i = RIGHT.indexOf(letter as (typeof RIGHT)[number]);
  return 22 + i * 34;
}

/** Fixed tangled bezier from number → correct letter (traceable). */
function tangledPath(from: number) {
  const to = SOLUTION[from];
  const y1 = leftY(from);
  const y2 = rightY(to);
  // Deterministic wiggles so paths cross without reading as a digit
  const seeds: Record<number, [number, number, number, number]> = {
    1: [120, -40, 260, 55],
    2: [95, 70, 240, -50],
    3: [140, 30, 220, 80],
    4: [110, -55, 280, 40],
    5: [155, 60, 200, -35],
    6: [100, -20, 270, 70],
    7: [130, 85, 230, -60],
    8: [145, -70, 250, 25],
  };
  const [cx1, cy1, cx2, cy2] = seeds[from];
  return `M 44 ${y1} C ${cx1} ${y1 + cy1}, ${cx2} ${y2 + cy2}, 356 ${y2}`;
}

const TERM_FONT =
  'ui-monospace, "JetBrains Mono", "Fira Code", "Courier New", monospace';

export default function TangledWiresPuzzle({ onSolved, onClose }: TangledWiresPuzzleProps) {
  const { deductTime } = useGame();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [pickLeft, setPickLeft] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [solved, setSolved] = useState(false);

  const pairMap = useMemo(() => {
    const m = new Map<number, string>();
    pairs.forEach((p) => m.set(p.from, p.to));
    return m;
  }, [pairs]);

  const clickLeft = (n: number) => {
    if (solved) return;
    setError(false);
    setErrorMessage("");
    // Clicking the already selected number toggles it off
    if (pickLeft === n) {
      setPickLeft(null);
    } else {
      setPickLeft(n);
    }
  };

  const clickRight = (letter: string) => {
    if (solved) return;

    if (pickLeft != null) {
      const isMismatch = SOLUTION[pickLeft] !== letter;
      const wireFrom = pickLeft;

      // Connect pickLeft to letter.
      // Cleanly replace any previous connection for pickLeft OR letter so no wires are locked!
      setPairs((prev) => [
        ...prev.filter((p) => p.from !== wireFrom && p.to !== letter),
        { from: wireFrom, to: letter },
      ]);
      setPickLeft(null);

      if (isMismatch) {
        // Directly deduct 1 minute upon making an incorrect connection
        deductTime(60);
        setError(true);
        const msg = `Wire ${wireFrom} → ${letter} is incorrect (−1:00 deducted).`;
        setErrorMessage(msg);
        toast.error(`−1:00 deducted from mission timer (Wire ${wireFrom} → ${letter} incorrect).`);
      } else {
        setError(false);
        setErrorMessage("");
      }
    } else {
      // If no number is selected, clicking an already connected letter selects its number so player can re-route it
      const existing = pairs.find((p) => p.to === letter);
      if (existing) {
        setPickLeft(existing.from);
      }
    }
  };

  const undoLast = () => {
    if (solved || pairs.length === 0) return;
    setPairs((prev) => prev.slice(0, -1));
    setPickLeft(null);
    setError(false);
    setErrorMessage("");
  };

  const resetAll = () => {
    if (solved || pairs.length === 0) return;
    setPairs([]);
    setPickLeft(null);
    setError(false);
    setErrorMessage("");
  };

  const submit = () => {
    if (pairs.length < LEFT.length) {
      setError(true);
      setErrorMessage(`Connect all ${LEFT.length} pairs before submitting.`);
      return;
    }

    const wrongCount = pairs.filter((p) => SOLUTION[p.from] !== p.to).length;
    if (wrongCount > 0) {
      setError(true);
      const msg = `${wrongCount} connection${wrongCount > 1 ? "s are" : " is"} incorrect (orange). Re-route them before submitting.`;
      setErrorMessage(msg);
      toast.error(`${wrongCount} connection${wrongCount > 1 ? "s are" : " is"} incorrect.`);
      return;
    }

    setSolved(true);
  };

  return (
    <PuzzleShell
      title="Tangled Wires"
      accent="cyan"
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={
        solved ? (
          <PuzzlePrimaryButton accent="cyan" onClick={onSolved}>
            CONTINUE
          </PuzzlePrimaryButton>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={undoLast}
              disabled={pairs.length === 0}
              className="rounded-lg border border-white/15 px-3 py-2.5 text-xs font-mono text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              UNDO
            </button>
            <button
              type="button"
              onClick={resetAll}
              disabled={pairs.length === 0}
              className="rounded-lg border border-white/15 px-3 py-2.5 text-xs font-mono text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              RESET
            </button>
            <PuzzlePrimaryButton
              accent="cyan"
              onClick={submit}
              disabled={pairs.length < LEFT.length}
              className="flex-1"
            >
              SUBMIT
            </PuzzlePrimaryButton>
          </div>
        )
      }
    >
      <div className="space-y-3">
        {solved ? (
          <div
            className="relative overflow-hidden rounded-xl border border-cyan-500/25 bg-[#05070b] px-4 py-4 shadow-inner"
            style={{ fontFamily: TERM_FONT }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.35)_3px)]" />
            <div className="relative space-y-3 text-[12px] sm:text-[13px] leading-relaxed text-slate-300">
              <p className="tracking-[0.2em] text-cyan-200">RELAY DIAGNOSTIC</p>
              <p className="text-emerald-300/90">Connection restored.</p>
              <div className="border-t border-white/10 pt-3 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Camera system</p>
                <p>BASELINE LEVEL: 84.2%</p>
                <p>RELAY CHANNEL: 7</p>
                <p>CAMERA NODE: 4</p>
              </div>
              <div className="border-t border-white/10 pt-3 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Access format</p>
                <p className="text-cyan-100/90">BASELINE → RELAY → CAMERA</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-400">
                Trace each grey wire — number to letter.
              </p>
              <p className="text-[11px] font-mono text-rose-400/90">
                Wrong connection penalty: −1:00 per incorrect connection
              </p>
            </div>

            <div className="relative rounded-xl border border-cyan-500/20 bg-black/50 px-2 py-3">
              <svg viewBox="0 0 400 290" className="w-full h-auto">
                {LEFT.map((n) => {
                  const matched = pairMap.get(n) === SOLUTION[n];
                  const active = pairMap.has(n);
                  return (
                    <path
                      key={`w-${n}`}
                      d={tangledPath(n)}
                      fill="none"
                      stroke={
                        matched
                          ? "rgb(34 211 238)"
                          : active
                            ? "rgb(251 146 60)"
                            : "rgb(148 163 184 / 0.55)"
                      }
                      strokeWidth={matched ? 2.4 : active ? 2.0 : 1.7}
                      strokeLinecap="round"
                    />
                  );
                })}

                {LEFT.map((n) => {
                  const pairedLetter = pairMap.get(n);
                  const isPaired = pairedLetter !== undefined;
                  const isMatched = isPaired && pairedLetter === SOLUTION[n];
                  const picking = pickLeft === n;
                  return (
                    <g key={`L${n}`} onClick={() => clickLeft(n)} className="cursor-pointer">
                      <circle
                        cx={26}
                        cy={leftY(n)}
                        r={12}
                        fill={
                          picking
                            ? "rgb(8 51 68)"
                            : isMatched
                              ? "rgb(22 78 99)"
                              : isPaired
                                ? "rgb(67 36 21)"
                                : "rgb(15 23 42)"
                        }
                        stroke={
                          picking
                            ? "rgb(34 211 238)"
                            : isMatched
                              ? "rgb(34 211 238)"
                              : isPaired
                                ? "rgb(251 146 60)"
                                : "rgb(100 116 139)"
                        }
                        strokeWidth={picking || isPaired ? 2.2 : 1.8}
                      />
                      <text
                        x={26}
                        y={leftY(n) + 4}
                        textAnchor="middle"
                        className="fill-cyan-100 text-[10px] font-mono font-bold pointer-events-none"
                      >
                        {n}
                      </text>
                    </g>
                  );
                })}

                {RIGHT.map((letter) => {
                  const connected = pairs.find((p) => p.to === letter);
                  const isConnected = connected !== undefined;
                  const isMatched = isConnected && SOLUTION[connected.from] === letter;
                  const isHoverable = pickLeft != null;
                  return (
                    <g
                      key={`R${letter}`}
                      onClick={() => clickRight(letter)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={360}
                        y={rightY(letter) - 12}
                        width={26}
                        height={24}
                        rx={5}
                        fill={
                          isMatched
                            ? "rgb(22 78 99)"
                            : isConnected
                              ? "rgb(67 36 21)"
                              : isHoverable
                                ? "rgb(8 51 68)"
                                : "rgb(15 23 42)"
                        }
                        stroke={
                          isMatched
                            ? "rgb(34 211 238)"
                            : isConnected
                              ? "rgb(251 146 60)"
                              : isHoverable
                                ? "rgb(103 232 249)"
                                : "rgb(100 116 139)"
                        }
                        strokeWidth={isConnected || isHoverable ? 2 : 1.5}
                      />
                      <text
                        x={373}
                        y={rightY(letter) + 4}
                        textAnchor="middle"
                        className="fill-cyan-100 text-[10px] font-mono font-bold pointer-events-none"
                      >
                        {letter}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {error && (
              <p className="text-center text-xs text-rose-400 font-mono">
                {errorMessage || "Mismatch. Trace again."}
              </p>
            )}
            {pickLeft != null ? (
              <p className="text-center text-[11px] font-mono text-cyan-300">
                Wire {pickLeft} selected → pick letter (A–H)
              </p>
            ) : pairs.length < LEFT.length ? (
              <p className="text-center text-[11px] font-mono text-slate-400">
                Click a number (1–8) on the left, then click its destination letter
              </p>
            ) : (
              <p className="text-center text-[11px] font-mono text-emerald-300">
                All {LEFT.length} wires connected. Click SUBMIT to test relay.
              </p>
            )}
          </>
        )}
      </div>
    </PuzzleShell>
  );
}
