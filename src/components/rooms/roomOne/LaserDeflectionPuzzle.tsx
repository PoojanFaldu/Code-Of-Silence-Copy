import { useMemo, useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";

type Dir = "N" | "E" | "S" | "W";
type MirrorKind = "/" | "\\";

interface MirrorCell {
  id: string;
  x: number;
  y: number;
  kind: MirrorKind;
}

interface LaserDeflectionPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

const COLS = 9;
const ROWS = 7;
const CELL = 48;

const SOURCE = { x: 0, y: 1, dir: "E" as Dir };
const TARGET = { x: 8, y: 1 };

/** Sensors the beam must strike in order before the lock. */
const SENSORS = [
  { id: "1", x: 3, y: 1 },
  { id: "2", x: 3, y: 5 },
  { id: "3", x: 7, y: 5 },
  { id: "4", x: 7, y: 1 },
];

/**
 * Required path (deduced from constraints):
 * SRC(0,1)E → M1(3,1)\ → M2(3,5)\ → M3(7,5)/ → M4(7,1)/ → LOCK(8,1)
 * M5 is a decoy and must not intercept the beam.
 */
const INITIAL_MIRRORS: MirrorCell[] = [
  { id: "M1", x: 3, y: 1, kind: "/" },
  { id: "M2", x: 3, y: 5, kind: "/" },
  { id: "M3", x: 7, y: 5, kind: "\\" },
  { id: "M4", x: 7, y: 1, kind: "\\" },
  { id: "M5", x: 5, y: 3, kind: "/" },
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
  const mirrorMap = new Map(mirrors.map((m) => [`${m.x},${m.y}`, m]));
  const path: { x: number; y: number }[] = [{ x: SOURCE.x, y: SOURCE.y }];
  const hitSensors: string[] = [];
  const usedMirrors: string[] = [];
  let dir: Dir = SOURCE.dir;
  let x = SOURCE.x;
  let y = SOURCE.y;
  let hitTarget = false;

  for (let i = 0; i < 50; i++) {
    const next = step(x, y, dir);
    if (next.x < 0 || next.y < 0 || next.x >= COLS || next.y >= ROWS) break;

    x = next.x;
    y = next.y;
    path.push({ x, y });

    const sensor = SENSORS.find((s) => s.x === x && s.y === y);
    if (sensor && !hitSensors.includes(sensor.id)) hitSensors.push(sensor.id);

    if (x === TARGET.x && y === TARGET.y) {
      hitTarget = true;
      break;
    }

    const mirror = mirrorMap.get(`${x},${y}`);
    if (mirror) {
      usedMirrors.push(mirror.id);
      dir = reflect(dir, mirror.kind);
    }
  }

  const sensorOrderOk =
    hitSensors.length === SENSORS.length &&
    hitSensors.every((id, idx) => id === SENSORS[idx].id);

  const requiredMirrors = ["M1", "M2", "M3", "M4"];
  const mirrorsOk =
    requiredMirrors.every((id) => usedMirrors.includes(id)) && !usedMirrors.includes("M5");

  return {
    path,
    hitTarget,
    hitSensors,
    usedMirrors,
    success: hitTarget && sensorOrderOk && mirrorsOk,
  };
}

export default function LaserDeflectionPuzzle({ onSolved, onClose }: LaserDeflectionPuzzleProps) {
  const [mirrors, setMirrors] = useState<MirrorCell[]>(INITIAL_MIRRORS);
  const [tested, setTested] = useState(false);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState("");

  const result = useMemo(() => traceBeam(mirrors), [mirrors]);

  const rotateMirror = (index: number) => {
    if (solved) return;
    setTested(false);
    setFeedback("");
    setMirrors((prev) =>
      prev.map((m, i) => (i === index ? { ...m, kind: m.kind === "/" ? "\\" : "/" } : m))
    );
  };

  const handleTest = () => {
    setTested(true);
    if (result.success) {
      setSolved(true);
      setFeedback("Path valid.");
      setTimeout(onSolved, 800);
      return;
    }
    setFeedback("Invalid path.");
  };

  const width = COLS * CELL;
  const height = ROWS * CELL;
  const pathPoints = result.path
    .map((p) => `${p.x * CELL + CELL / 2},${p.y * CELL + CELL / 2}`)
    .join(" ");

  const grid = (
    <div className="flex justify-center overflow-x-auto">
      <svg width={width} height={height} className="rounded-xl border border-white/10 bg-[#071018] max-w-full">
        {Array.from({ length: ROWS * COLS }).map((_, i) => {
          const x = i % COLS;
          const y = Math.floor(i / COLS);
          return (
            <rect
              key={`c-${x}-${y}`}
              x={x * CELL}
              y={y * CELL}
              width={CELL}
              height={CELL}
              fill="transparent"
              stroke="rgba(148,163,184,0.12)"
            />
          );
        })}
        {tested && pathPoints && (
          <polyline
            points={pathPoints}
            fill="none"
            stroke={result.success ? "#34d399" : "#f87171"}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          />
        )}
        <circle cx={SOURCE.x * CELL + CELL / 2} cy={SOURCE.y * CELL + CELL / 2} r={9} fill="#fbbf24" />
        <text x={SOURCE.x * CELL + CELL / 2} y={SOURCE.y * CELL + CELL / 2 + 20} textAnchor="middle" fill="#fde68a" fontSize="9">
          SRC
        </text>
        {SENSORS.map((s) => (
          <g key={s.id}>
            <circle cx={s.x * CELL + CELL / 2} cy={s.y * CELL + CELL / 2} r={11} fill="#0f172a" stroke="#38bdf8" strokeWidth={2} />
            <text x={s.x * CELL + CELL / 2} y={s.y * CELL + CELL / 2 + 4} textAnchor="middle" fill="#7dd3fc" fontSize="11" fontWeight="700">
              {s.id}
            </text>
          </g>
        ))}
        <rect
          x={TARGET.x * CELL + 10}
          y={TARGET.y * CELL + 10}
          width={CELL - 20}
          height={CELL - 20}
          rx={4}
          fill={solved ? "#34d399" : "#1e293b"}
          stroke={solved ? "#6ee7b7" : "#94a3b8"}
          strokeWidth={2}
        />
        <text x={TARGET.x * CELL + CELL / 2} y={TARGET.y * CELL + CELL / 2 + 4} textAnchor="middle" fill={solved ? "#052e1b" : "#cbd5e1"} fontSize="9" fontWeight="700">
          LOCK
        </text>
        {mirrors.map((m, index) => (
          <g key={m.id} onClick={() => rotateMirror(index)} style={{ cursor: solved ? "default" : "pointer" }}>
            <rect
              x={m.x * CELL + 6}
              y={m.y * CELL + 6}
              width={CELL - 12}
              height={CELL - 12}
              rx={5}
              fill={m.id === "M5" ? "rgba(251,191,36,0.12)" : "rgba(56,189,248,0.12)"}
              stroke={m.id === "M5" ? "#fbbf24" : "#38bdf8"}
              strokeWidth={1.5}
            />
            <line
              x1={m.kind === "/" ? m.x * CELL + 14 : m.x * CELL + CELL - 14}
              y1={m.y * CELL + CELL - 14}
              x2={m.kind === "/" ? m.x * CELL + CELL - 14 : m.x * CELL + 14}
              y2={m.y * CELL + 14}
              stroke="#e2e8f0"
              strokeWidth={3.5}
              strokeLinecap="round"
            />
          </g>
        ))}
      </svg>
    </div>
  );

  return (
    <PuzzleShell
      title="Laser"
      accent="cyan"
      onClose={onClose}
      maxWidth="max-w-3xl"
      tabs={[
        { id: "grid", label: "Grid", content: grid },
        {
          id: "ref",
          label: "Ref",
          content: (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center hover:border-cyan-400/40 transition"
              >
                <div className="font-mono text-3xl text-cyan-200 mb-2">/</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Reflect</div>
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center hover:border-cyan-400/40 transition"
              >
                <div className="font-mono text-3xl text-cyan-200 mb-2">\</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Reflect</div>
              </button>
              <p className="col-span-2 text-center text-xs text-slate-500">Tap mirrors on the grid to flip</p>
            </div>
          ),
        },
      ]}
      footer={
        <div className="space-y-2">
          {feedback && (
            <p className={`text-center text-xs ${solved ? "text-emerald-400" : "text-rose-400"}`}>{feedback}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMirrors(INITIAL_MIRRORS);
                setTested(false);
                setSolved(false);
                setFeedback("");
              }}
              className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5"
            >
              Reset
            </button>
            <div className="flex-1">
              <PuzzlePrimaryButton accent="cyan" onClick={handleTest} disabled={solved}>
                SUBMIT
              </PuzzlePrimaryButton>
            </div>
          </div>
        </div>
      }
    />
  );
}
