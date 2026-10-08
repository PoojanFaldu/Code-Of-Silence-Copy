import { useMemo, useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { useGame } from "@/contexts/GameContext";

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

/**
 * Soft "7" after solve — stacked strokes, readable if you look, not a billboard.
 */
function sevenPath(i: number) {
  const paths = [
    "M 118 58 L 282 58",
    "M 275 60 L 168 248",
    "M 125 62 L 278 62",
    "M 268 64 L 175 242",
    "M 132 56 L 270 56",
    "M 260 68 L 182 238",
    "M 140 64 L 265 64",
    "M 255 72 L 188 232",
  ];
  return paths[i] ?? paths[0];
}

export default function TangledWiresPuzzle({ onSolved, onClose }: TangledWiresPuzzleProps) {
  const { penalizeWrongAnswer } = useGame();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [pickLeft, setPickLeft] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [solved, setSolved] = useState(false);

  const usedLeft = useMemo(() => new Set(pairs.map((p) => p.from)), [pairs]);
  const usedRight = useMemo(() => new Set(pairs.map((p) => p.to)), [pairs]);
  const pairMap = useMemo(() => {
    const m = new Map<number, string>();
    pairs.forEach((p) => m.set(p.from, p.to));
    return m;
  }, [pairs]);

  const clickLeft = (n: number) => {
    if (solved || usedLeft.has(n)) return;
    setError(false);
    setPickLeft(n);
  };

  const clickRight = (letter: string) => {
    if (solved || usedRight.has(letter) || pickLeft == null) return;
    setError(false);
    setPairs((prev) => [...prev, { from: pickLeft, to: letter }]);
    setPickLeft(null);
  };

  const undoLast = () => {
    if (solved || pairs.length === 0) return;
    setPairs((prev) => prev.slice(0, -1));
    setPickLeft(null);
    setError(false);
  };

  const submit = () => {
    if (pairs.length < LEFT.length) {
      setError(true);
      return;
    }
    const ok = pairs.every((p) => SOLUTION[p.from] === p.to);
    if (!ok) {
      setError(true);
      penalizeWrongAnswer();
      setPairs([]);
      setPickLeft(null);
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
              className="rounded-lg border border-white/15 px-3 py-2.5 text-xs font-mono text-slate-400 hover:text-white disabled:opacity-30"
            >
              UNDO
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
        <p className="text-center text-xs text-slate-400">
          {solved
            ? "Circuit locked. Look at the path."
            : "Trace each grey wire — number to letter."}
        </p>

        <div className="relative rounded-xl border border-cyan-500/20 bg-black/50 px-2 py-3">
          <svg viewBox="0 0 400 290" className="w-full h-auto">
            {LEFT.map((n, i) => {
              const matched = pairMap.get(n) === SOLUTION[n];
              const active = pairMap.has(n);
              return (
                <path
                  key={`w-${n}`}
                  d={solved ? sevenPath(i) : tangledPath(n)}
                  fill="none"
                  stroke={
                    solved
                      ? "rgb(34 211 238)"
                      : matched
                        ? "rgb(34 211 238)"
                        : active
                          ? "rgb(251 146 60)"
                          : "rgb(148 163 184 / 0.55)"
                  }
                  strokeWidth={solved ? 2.1 : matched ? 2.3 : 1.7}
                  strokeLinecap="round"
                  opacity={solved ? 0.5 + i * 0.05 : 1}
                  style={{ transition: "d 0.8s ease, stroke 0.4s ease, opacity 0.5s ease" }}
                />
              );
            })}

            {LEFT.map((n) => {
              const used = usedLeft.has(n);
              const picking = pickLeft === n;
              return (
                <g key={`L${n}`} onClick={() => clickLeft(n)} className="cursor-pointer">
                  <circle
                    cx={26}
                    cy={leftY(n)}
                    r={12}
                    fill={picking ? "rgb(8 51 68)" : used ? "rgb(22 78 99)" : "rgb(15 23 42)"}
                    stroke={picking ? "rgb(34 211 238)" : "rgb(100 116 139)"}
                    strokeWidth={2}
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
              const used = usedRight.has(letter);
              const lit = pickLeft != null && !used;
              return (
                <g key={`R${letter}`} onClick={() => clickRight(letter)} className="cursor-pointer">
                  <rect
                    x={360}
                    y={rightY(letter) - 12}
                    width={26}
                    height={24}
                    rx={5}
                    fill={used ? "rgb(22 78 99)" : lit ? "rgb(8 51 68)" : "rgb(15 23 42)"}
                    stroke={
                      used ? "rgb(34 211 238)" : lit ? "rgb(103 232 249)" : "rgb(100 116 139)"
                    }
                    strokeWidth={2}
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
          <p className="text-center text-xs text-rose-400">Mismatch. Trace again.</p>
        )}
        {!solved && pickLeft != null && (
          <p className="text-center text-[11px] font-mono text-cyan-300/80">
            {pickLeft} → pick a letter
          </p>
        )}
      </div>
    </PuzzleShell>
  );
}
