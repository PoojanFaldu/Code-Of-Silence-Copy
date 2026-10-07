import { useMemo, useState } from "react";

type Dir = "N" | "E" | "S" | "W";
type MirrorKind = "/" | "\\";

interface MirrorCell {
  x: number;
  y: number;
  kind: MirrorKind;
}

interface LaserDeflectionPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

const COLS = 8;
const ROWS = 6;
const CELL = 56;
const SOURCE = { x: 0, y: 2, dir: "E" as Dir };
const TARGET = { x: 7, y: 4 };

// Solution path: (3,2)=\ then (3,4)=\  — third mirror is a red herring off the beam path
const INITIAL_MIRRORS: MirrorCell[] = [
  { x: 3, y: 2, kind: "/" },
  { x: 3, y: 4, kind: "/" },
  { x: 6, y: 1, kind: "\\" },
];

function reflect(dir: Dir, mirror: MirrorKind): Dir {
  if (mirror === "/") {
    const map: Record<Dir, Dir> = { E: "N", N: "E", W: "S", S: "W" };
    return map[dir];
  }
  const map: Record<Dir, Dir> = { E: "S", S: "E", W: "N", N: "W" };
  return map[dir];
}

function step(x: number, y: number, dir: Dir) {
  if (dir === "N") return { x, y: y - 1 };
  if (dir === "S") return { x, y: y + 1 };
  if (dir === "W") return { x: x - 1, y };
  return { x: x + 1, y };
}

function traceBeam(mirrors: MirrorCell[]) {
  const mirrorMap = new Map(mirrors.map((m) => [`${m.x},${m.y}`, m.kind]));
  const path: { x: number; y: number }[] = [{ x: SOURCE.x, y: SOURCE.y }];
  let dir: Dir = SOURCE.dir;
  let x = SOURCE.x;
  let y = SOURCE.y;
  let hitTarget = false;

  for (let i = 0; i < 40; i++) {
    const next = step(x, y, dir);
    if (next.x < 0 || next.y < 0 || next.x >= COLS || next.y >= ROWS) break;

    x = next.x;
    y = next.y;
    path.push({ x, y });

    if (x === TARGET.x && y === TARGET.y) {
      hitTarget = true;
      break;
    }

    const key = `${x},${y}`;
    const mirror = mirrorMap.get(key);
    if (mirror) dir = reflect(dir, mirror);
  }

  return { path, hitTarget };
}

export default function LaserDeflectionPuzzle({ onSolved, onClose }: LaserDeflectionPuzzleProps) {
  const [mirrors, setMirrors] = useState<MirrorCell[]>(INITIAL_MIRRORS);
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState("");

  const { path, hitTarget } = useMemo(() => traceBeam(mirrors), [mirrors]);

  const rotateMirror = (index: number) => {
    if (solved) return;
    setMirrors((prev) =>
      prev.map((m, i) =>
        i === index ? { ...m, kind: m.kind === "/" ? "\\" : "/" } : m
      )
    );
    setHint("");
  };

  const handleCalibrate = () => {
    if (!hitTarget) {
      setHint("Beam missed the target. Rotate the mirrors and try again.");
      return;
    }
    setSolved(true);
    setHint("Calibration complete. A concealed drawer unlocks...");
    setTimeout(onSolved, 1200);
  };

  const width = COLS * CELL;
  const height = ROWS * CELL;

  const pathPoints = path
    .map((p) => `${p.x * CELL + CELL / 2},${p.y * CELL + CELL / 2}`)
    .join(" ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-cyan-500/30 bg-[#0b1220] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-wide text-cyan-300">Laser Deflection</h2>
            <p className="text-xs text-slate-400 mt-1">
              "The answer isn't where you are looking. It's where the light points."
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-3 py-1 text-sm text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-slate-300">
            Click mirrors to flip their angle. Route the laser into the hidden target.
          </p>

          <div className="flex justify-center">
            <svg
              width={width}
              height={height}
              className="rounded-lg border border-white/10 bg-[#071018]"
            >
              {Array.from({ length: ROWS * COLS }).map((_, i) => {
                const x = i % COLS;
                const y = Math.floor(i / COLS);
                return (
                  <rect
                    key={`cell-${x}-${y}`}
                    x={x * CELL}
                    y={y * CELL}
                    width={CELL}
                    height={CELL}
                    fill="transparent"
                    stroke="rgba(148,163,184,0.12)"
                  />
                );
              })}

              {pathPoints && (
                <polyline
                  points={pathPoints}
                  fill="none"
                  stroke={hitTarget ? "#34d399" : "#f87171"}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.95}
                />
              )}

              <circle
                cx={SOURCE.x * CELL + CELL / 2}
                cy={SOURCE.y * CELL + CELL / 2}
                r={10}
                fill="#fbbf24"
              />
              <text
                x={SOURCE.x * CELL + CELL / 2}
                y={SOURCE.y * CELL + CELL / 2 + 22}
                textAnchor="middle"
                fill="#fde68a"
                fontSize="10"
              >
                SRC
              </text>

              <rect
                x={TARGET.x * CELL + 12}
                y={TARGET.y * CELL + 12}
                width={CELL - 24}
                height={CELL - 24}
                rx={4}
                fill={hitTarget ? "#34d399" : "#1e293b"}
                stroke={hitTarget ? "#6ee7b7" : "#64748b"}
                strokeWidth={2}
              />
              <text
                x={TARGET.x * CELL + CELL / 2}
                y={TARGET.y * CELL + CELL / 2 + 4}
                textAnchor="middle"
                fill={hitTarget ? "#052e1b" : "#94a3b8"}
                fontSize="10"
                fontWeight="700"
              >
                TGT
              </text>

              {mirrors.map((m, index) => (
                <g
                  key={`mirror-${m.x}-${m.y}`}
                  onClick={() => rotateMirror(index)}
                  style={{ cursor: solved ? "default" : "pointer" }}
                >
                  <rect
                    x={m.x * CELL + 8}
                    y={m.y * CELL + 8}
                    width={CELL - 16}
                    height={CELL - 16}
                    rx={6}
                    fill="rgba(56,189,248,0.12)"
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                  />
                  <line
                    x1={m.kind === "/" ? m.x * CELL + 16 : m.x * CELL + CELL - 16}
                    y1={m.y * CELL + CELL - 16}
                    x2={m.kind === "/" ? m.x * CELL + CELL - 16 : m.x * CELL + 16}
                    y2={m.y * CELL + 16}
                    stroke="#e2e8f0"
                    strokeWidth={4}
                    strokeLinecap="round"
                  />
                </g>
              ))}
            </svg>
          </div>

          {hint && (
            <p className={`text-sm ${solved ? "text-emerald-400" : "text-amber-300"}`}>{hint}</p>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setMirrors(INITIAL_MIRRORS);
                setHint("");
                setSolved(false);
              }}
              className="rounded-md border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              Reset
            </button>
            <button
              onClick={handleCalibrate}
              disabled={solved}
              className="rounded-md bg-cyan-500/20 border border-cyan-400/40 px-4 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-50"
            >
              {solved ? "Unlocked" : "Calibrate Device"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
