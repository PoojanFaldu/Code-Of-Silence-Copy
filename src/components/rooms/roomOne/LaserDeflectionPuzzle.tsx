import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { useGame } from "@/contexts/GameContext";
import { RotateCw, RotateCcw, Zap, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";

interface LaserDeflectionPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface MirrorCell {
  id: string;
  name: string;
  x: number;
  y: number;
  angle: number; // in degrees
  isDecoy?: boolean;
}

const COLS = 9;
const ROWS = 7;
const CELL = 52;

const SOURCE = { x: 0, y: 1 };
const TARGET = { x: 8, y: 1 };

const SENSORS = [
  { id: "1", x: 3, y: 1, label: "Sensor 1" },
  { id: "2", x: 3, y: 5, label: "Sensor 2" },
  { id: "3", x: 7, y: 5, label: "Sensor 3" },
  { id: "4", x: 7, y: 1, label: "Sensor 4" },
];

/**
 * Initial mirrors with 30° rotation capabilities.
 * Correct solution alignments:
 * M1 (3,1): 45° (or 225°) → reflects East beam South
 * M2 (3,5): 45° (or 225°) → reflects South beam East
 * M3 (7,5): 135° (or 315°) → reflects East beam North
 * M4 (7,1): 135° (or 315°) → reflects North beam East to LOCK
 * M5 (5,3): Decoy reflector, must not intercept beam
 */
const INITIAL_MIRRORS: MirrorCell[] = [
  { id: "M1", name: "Prism M-1", x: 3, y: 1, angle: 135 },
  { id: "M2", name: "Prism M-2", x: 3, y: 5, angle: 135 },
  { id: "M3", name: "Prism M-3", x: 7, y: 5, angle: 45 },
  { id: "M4", name: "Prism M-4", x: 7, y: 1, angle: 45 },
  { id: "M5", name: "Decoy M-5", x: 5, y: 3, angle: 135, isDecoy: true },
];

const INITIAL_ANGLES_MAP: Record<string, number> = {
  M1: 135,
  M2: 135,
  M3: 45,
  M4: 45,
  M5: 135,
};

/** Synthesize high-tech mechanical ratchet and optical lock sounds */
function playAudioFeedback(type: "rotate" | "success") {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "rotate") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(540, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.055);
    } else {
      // Harmonic chord for lock success
      [587.33, 739.99, 880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.38);
      });
    }
  } catch {
    // Ignore audio context constraints
  }
}

/** Distance from point P to segment AB */
function distPointToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

/** Trace continuous 2D ray reflection with live physical angles */
function traceBeam(mirrors: MirrorCell[]) {
  const width = COLS * CELL;
  const height = ROWS * CELL;

  const startPoint: Point = {
    x: SOURCE.x * CELL + CELL / 2,
    y: SOURCE.y * CELL + CELL / 2,
  };

  const path: Point[] = [startPoint];
  const hitSensors: string[] = [];
  const usedMirrors: string[] = [];
  let hitTarget = false;

  let currentPos: Point = { ...startPoint };
  let currentDir: Point = { x: 1, y: 0 }; // Start firing East

  const maxBounces = 24;

  for (let bounce = 0; bounce < maxBounces; bounce++) {
    let closestT = Infinity;
    let hitMirror: MirrorCell | null = null;
    let hitNormal: Point = { x: 0, y: 0 };

    // 1. Test intersection against all mirror segments
    for (const m of mirrors) {
      const cx = m.x * CELL + CELL / 2;
      const cy = m.y * CELL + CELL / 2;
      const rad = (m.angle * Math.PI) / 180;
      const bladeLen = CELL * 0.74; // mirror segment length

      const ux = Math.cos(rad);
      const uy = Math.sin(rad);

      const ax = cx - (bladeLen / 2) * ux;
      const ay = cy - (bladeLen / 2) * uy;

      // 2D ray intersection with segment A + s * (bladeLen * u)
      const denom = currentDir.x * uy - currentDir.y * ux;
      if (Math.abs(denom) > 1e-5) {
        const t = ((ax - currentPos.x) * uy - (ay - currentPos.y) * ux) / denom;
        const sDist =
          ((ax - currentPos.x) * currentDir.y - (ay - currentPos.y) * currentDir.x) / denom;
        const s = sDist / bladeLen;

        // Tolerance for clean ray-mirror collision
        if (t > 1.5 && s >= -0.15 && s <= 1.15 && t < closestT) {
          closestT = t;
          hitMirror = m;
          // Normal perpendicular to blade
          hitNormal = { x: -uy, y: ux };
        }
      }
    }

    // 2. Test intersection with boundaries if no mirror is closer
    let wallT = Infinity;
    if (currentDir.x > 0) wallT = Math.min(wallT, (width - currentPos.x) / currentDir.x);
    if (currentDir.x < 0) wallT = Math.min(wallT, -currentPos.x / currentDir.x);
    if (currentDir.y > 0) wallT = Math.min(wallT, (height - currentPos.y) / currentDir.y);
    if (currentDir.y < 0) wallT = Math.min(wallT, -currentPos.y / currentDir.y);

    if (wallT < closestT) {
      // Ray stops at wall boundary
      const hitWallPoint: Point = {
        x: Math.max(0, Math.min(width, currentPos.x + wallT * currentDir.x)),
        y: Math.max(0, Math.min(height, currentPos.y + wallT * currentDir.y)),
      };

      // Check sensors and target along this final segment
      for (const s of SENSORS) {
        const sc: Point = { x: s.x * CELL + CELL / 2, y: s.y * CELL + CELL / 2 };
        if (distPointToSegment(sc, currentPos, hitWallPoint) <= CELL * 0.45) {
          if (!hitSensors.includes(s.id)) hitSensors.push(s.id);
        }
      }

      const tc: Point = { x: TARGET.x * CELL + CELL / 2, y: TARGET.y * CELL + CELL / 2 };
      if (distPointToSegment(tc, currentPos, hitWallPoint) <= CELL * 0.45) {
        hitTarget = true;
      }

      path.push(hitWallPoint);
      break;
    }

    // Mirror hit!
    const hitPoint: Point = {
      x: currentPos.x + closestT * currentDir.x,
      y: currentPos.y + closestT * currentDir.y,
    };

    // Check sensors & target along this segment
    for (const s of SENSORS) {
      const sc: Point = { x: s.x * CELL + CELL / 2, y: s.y * CELL + CELL / 2 };
      if (distPointToSegment(sc, currentPos, hitPoint) <= CELL * 0.45) {
        if (!hitSensors.includes(s.id)) hitSensors.push(s.id);
      }
    }

    const tc: Point = { x: TARGET.x * CELL + CELL / 2, y: TARGET.y * CELL + CELL / 2 };
    if (distPointToSegment(tc, currentPos, hitPoint) <= CELL * 0.45) {
      hitTarget = true;
    }

    path.push(hitPoint);

    if (hitMirror) {
      if (!usedMirrors.includes(hitMirror.id)) usedMirrors.push(hitMirror.id);

      // Compute specular reflection vector: v - 2(v·n)n
      let dot = currentDir.x * hitNormal.x + currentDir.y * hitNormal.y;
      if (dot > 0) {
        hitNormal = { x: -hitNormal.x, y: -hitNormal.y };
        dot = -dot;
      }

      const rx = currentDir.x - 2 * dot * hitNormal.x;
      const ry = currentDir.y - 2 * dot * hitNormal.y;
      const rLen = Math.hypot(rx, ry) || 1;

      currentDir = { x: rx / rLen, y: ry / rLen };
      currentPos = { x: hitPoint.x + currentDir.x * 0.5, y: hitPoint.y + currentDir.y * 0.5 };
    } else {
      break;
    }
  }

  // Verification requirements:
  // 1. All 4 sensors hit in order: 1 -> 2 -> 3 -> 4
  const sensorOrderOk =
    hitSensors.length >= 4 &&
    hitSensors[0] === "1" &&
    hitSensors[1] === "2" &&
    hitSensors[2] === "3" &&
    hitSensors[3] === "4";

  // 2. M1, M2, M3, M4 utilized, and M5 decoy is NOT hit
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
  const { penalizeWrongAnswer } = useGame();
  // Target angles (logical state set by user interaction)
  const targetAnglesRef = useRef<Record<string, number>>({ ...INITIAL_ANGLES_MAP });
  // Current smoothly interpolated angles (frame-by-frame)
  const currentAnglesRef = useRef<Record<string, number>>({ ...INITIAL_ANGLES_MAP });

  // React state that triggers re-render on each animation frame
  const [animatedAngles, setAnimatedAngles] = useState<Record<string, number>>({
    ...INITIAL_ANGLES_MAP,
  });

  const [selectedMirrorId, setSelectedMirrorId] = useState<string>("M1");
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<string>("");

  const animFrameRef = useRef<number | null>(null);

  // Smooth animation loop using requestAnimationFrame
  const startAnimation = useCallback(() => {
    if (animFrameRef.current !== null) return;

    const step = () => {
      let isMoving = false;
      const updated: Record<string, number> = { ...currentAnglesRef.current };

      for (const id of Object.keys(targetAnglesRef.current)) {
        const target = targetAnglesRef.current[id];
        const current = currentAnglesRef.current[id];
        const diff = target - current;

        // Smooth ease-out lerp (0.16 gives ~280ms duration at 60fps)
        if (Math.abs(diff) > 0.08) {
          currentAnglesRef.current[id] = current + diff * 0.16;
          updated[id] = currentAnglesRef.current[id];
          isMoving = true;
        } else if (current !== target) {
          currentAnglesRef.current[id] = target;
          updated[id] = target;
          isMoving = true;
        }
      }

      if (isMoving) {
        setAnimatedAngles(updated);
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Build the live mirrors array with animated angles
  const liveMirrors = useMemo(() => {
    return INITIAL_MIRRORS.map((m) => ({
      ...m,
      angle: animatedAngles[m.id] ?? m.angle,
    }));
  }, [animatedAngles]);

  // Live ray reflection trace: Re-computed every animation frame so the laser smoothly sweeps
  const result = useMemo(() => traceBeam(liveMirrors), [liveMirrors]);

  const selectedMirror = liveMirrors.find((m) => m.id === selectedMirrorId) ?? liveMirrors[0];

  // Rotate a specific mirror by exactly delta degrees (+30° or -30°) with smooth animation
  const rotateMirrorDelta = useCallback(
    (mirrorId: string, delta: number) => {
      if (solved) return;
      playAudioFeedback("rotate");
      setFeedback("");

      // Update target angle (continuous, not wrapping immediately so it animates forward)
      targetAnglesRef.current[mirrorId] = (targetAnglesRef.current[mirrorId] ?? 0) + delta;

      // Start smooth animation loop
      startAnimation();
    },
    [solved, startAnimation]
  );

  const isStillAnimating = useMemo(() => {
    return Object.keys(targetAnglesRef.current).some(
      (id) => Math.abs(targetAnglesRef.current[id] - currentAnglesRef.current[id]) > 0.8
    );
  }, [animatedAngles]);

  const handleTestOrSubmit = () => {
    if (isStillAnimating) {
      setFeedback("Prism alignment in progress... please wait.");
      return;
    }

    if (result.success) {
      setSolved(true);
      playAudioFeedback("success");
      setFeedback("OPTICAL LOCK DECRYPTED — TERMINAL UNLOCKED!");
      setTimeout(onSolved, 950);
    } else {
      playAudioFeedback("rotate");
      penalizeWrongAnswer();
      if (result.usedMirrors.includes("M5")) {
        setFeedback("Decoy prism M5 intercepted the beam! Reroute path.");
      } else if (!result.hitSensors.includes("1")) {
        setFeedback("Align Prism M1 to route beam to Sensor 1.");
      } else if (result.hitSensors.length < 4) {
        setFeedback(`Beam hit ${result.hitSensors.length}/4 sensors. Route through 1 → 2 → 3 → 4.`);
      } else if (!result.hitTarget) {
        setFeedback("All sensors illuminated, but beam has not reached the Lock terminal.");
      } else {
        setFeedback("Sensors must be illuminated in sequential order (1 → 2 → 3 → 4).");
      }
    }
  };

  const width = COLS * CELL;
  const height = ROWS * CELL;

  const pathPoints = result.path.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const lastPoint = result.path[result.path.length - 1] ?? { x: 0, y: 0 };

  const gridContent = (
    <div className="flex flex-col items-center gap-3">
      {/* HUD Status Bar above Grid */}
      <div className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg border border-cyan-500/20 bg-black/50 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-cyan-300 font-semibold tracking-wider uppercase">
            LASER BEAM: ACTIVE (ALWAYS ON & SWEEPING)
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>STEP CALIBRATION:</span>
          <span className="text-cyan-400 font-bold">30° DYNAMIC ROTATION</span>
        </div>
      </div>

      {/* Main SVG Grid with Laser Simulator */}
      <div className="relative rounded-2xl border border-cyan-500/30 bg-[#060c14] p-2 shadow-2xl overflow-x-auto max-w-full">
        <svg
          width={width}
          height={height}
          className="rounded-xl bg-[#03070d] block select-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.05) 0%, transparent 80%)",
          }}
        >
          <defs>
            {/* Glowing neon laser filter */}
            <filter id="laser-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur1" />
              <feGaussianBlur stdDeviation="6" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Success green glow filter */}
            <filter id="success-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines and coordinate dots */}
          {Array.from({ length: ROWS * COLS }).map((_, i) => {
            const gx = i % COLS;
            const gy = Math.floor(i / COLS);
            return (
              <g key={`cell-${gx}-${gy}`}>
                <rect
                  x={gx * CELL}
                  y={gy * CELL}
                  width={CELL}
                  height={CELL}
                  fill="transparent"
                  stroke="rgba(14, 165, 233, 0.07)"
                  strokeWidth={1}
                />
                <circle
                  cx={gx * CELL + CELL / 2}
                  cy={gy * CELL + CELL / 2}
                  r={1}
                  fill="rgba(148, 163, 184, 0.2)"
                />
              </g>
            );
          })}

          {/* SENSORS (1 to 4) */}
          {SENSORS.map((s) => {
            const isHit = result.hitSensors.includes(s.id);
            const cx = s.x * CELL + CELL / 2;
            const cy = s.y * CELL + CELL / 2;
            return (
              <g key={`sensor-${s.id}`} className="transition-all duration-300">
                {/* Outer Sensor Ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={15}
                  fill={isHit ? "rgba(6, 182, 212, 0.18)" : "#09121d"}
                  stroke={isHit ? "#38bdf8" : "rgba(56, 189, 248, 0.35)"}
                  strokeWidth={isHit ? 2.5 : 1.5}
                  filter={isHit ? "url(#laser-glow)" : undefined}
                />
                {isHit && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={18}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth={1}
                    opacity={0.6}
                    strokeDasharray="4 4"
                  />
                )}
                {/* Sensor ID */}
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fill={isHit ? "#f0fdf4" : "#7dd3fc"}
                  fontSize="12"
                  fontWeight="800"
                  fontFamily="monospace"
                >
                  {s.id}
                </text>
                <text
                  x={cx}
                  y={cy + 22}
                  textAnchor="middle"
                  fill={isHit ? "#38bdf8" : "#64748b"}
                  fontSize="8"
                  fontWeight="600"
                >
                  S{s.id}
                </text>
              </g>
            );
          })}

          {/* TARGET LOCK TERMINAL */}
          <g>
            <rect
              x={TARGET.x * CELL + 8}
              y={TARGET.y * CELL + 8}
              width={CELL - 16}
              height={CELL - 16}
              rx={6}
              fill={result.success ? "rgba(16, 185, 129, 0.25)" : "#0e1726"}
              stroke={result.success ? "#10b981" : result.hitTarget ? "#f59e0b" : "#475569"}
              strokeWidth={result.success ? 2.5 : 1.8}
              filter={result.success ? "url(#success-glow)" : undefined}
            />
            <text
              x={TARGET.x * CELL + CELL / 2}
              y={TARGET.y * CELL + CELL / 2 + 4}
              textAnchor="middle"
              fill={result.success ? "#6ee7b7" : result.hitTarget ? "#fbbf24" : "#94a3b8"}
              fontSize="10"
              fontWeight="800"
              fontFamily="monospace"
            >
              {result.success ? "OPEN" : "LOCK"}
            </text>
          </g>

          {/* ALWAYS-ON & SMOOTHLY SWEEPING LASER BEAM */}
          {pathPoints && (
            <g>
              {/* Outer soft ambient laser glow */}
              <polyline
                points={pathPoints}
                fill="none"
                stroke={result.success ? "#059669" : "#0284c7"}
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.4}
                filter="url(#laser-glow)"
              />
              {/* Mid vibrant beam */}
              <polyline
                points={pathPoints}
                fill="none"
                stroke={result.success ? "#34d399" : "#38bdf8"}
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
              {/* Intense white laser core */}
              <polyline
                points={pathPoints}
                fill="none"
                stroke="#ffffff"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.95}
              />
              {/* Dynamic beam termination spark tracking the moving beam */}
              <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r={4.5}
                fill={result.success ? "#34d399" : "#38bdf8"}
                filter="url(#laser-glow)"
              />
            </g>
          )}

          {/* LASER EMITTER SOURCE (SRC) */}
          <g>
            <circle
              cx={SOURCE.x * CELL + CELL / 2}
              cy={SOURCE.y * CELL + CELL / 2}
              r={13}
              fill="#1e1b10"
              stroke="#f59e0b"
              strokeWidth={2}
            />
            <circle
              cx={SOURCE.x * CELL + CELL / 2}
              cy={SOURCE.y * CELL + CELL / 2}
              r={7}
              fill="#fbbf24"
              filter="url(#laser-glow)"
            />
            <text
              x={SOURCE.x * CELL + CELL / 2}
              y={SOURCE.y * CELL + CELL / 2 + 22}
              textAnchor="middle"
              fill="#fde68a"
              fontSize="8"
              fontWeight="700"
            >
              LASER SRC
            </text>
          </g>

          {/* REFLECTORS (Smoothly animated in lockstep with the laser beam) */}
          {liveMirrors.map((m) => {
            const isSelected = m.id === selectedMirrorId;
            const cx = m.x * CELL + CELL / 2;
            const cy = m.y * CELL + CELL / 2;
            const isUsedInPath = result.usedMirrors.includes(m.id);
            const targetAngle = targetAnglesRef.current[m.id] ?? m.angle;
            const displayAngle = ((Math.round(targetAngle) % 360) + 360) % 360;

            return (
              <g
                key={m.id}
                onClick={() => {
                  setSelectedMirrorId(m.id);
                  rotateMirrorDelta(m.id, 30);
                }}
                className="cursor-pointer group"
                style={{ cursor: solved ? "default" : "pointer" }}
              >
                {/* Reflector Base Housing */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={CELL * 0.42}
                  fill={
                    m.isDecoy
                      ? "rgba(245, 158, 11, 0.08)"
                      : isSelected
                      ? "rgba(6, 182, 212, 0.22)"
                      : "rgba(15, 23, 42, 0.75)"
                  }
                  stroke={
                    m.isDecoy
                      ? "#f59e0b"
                      : isSelected
                      ? "#22d3ee"
                      : isUsedInPath
                      ? "#38bdf8"
                      : "rgba(148, 163, 184, 0.3)"
                  }
                  strokeWidth={isSelected ? 2 : 1.2}
                  className="transition-all duration-200"
                />

                {/* 30-degree tick marks on the rim */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((tick) => {
                  const tickRad = (tick * Math.PI) / 180;
                  const r1 = CELL * 0.38;
                  const r2 = CELL * 0.42;
                  return (
                    <line
                      key={`tick-${tick}`}
                      x1={cx + r1 * Math.cos(tickRad)}
                      y1={cy + r1 * Math.sin(tickRad)}
                      x2={cx + r2 * Math.cos(tickRad)}
                      y2={cy + r2 * Math.sin(tickRad)}
                      stroke="rgba(148, 163, 184, 0.35)"
                      strokeWidth={tick % 90 === 0 ? 1.5 : 0.8}
                    />
                  );
                })}

                {/* Rotatable Mirror Blade (Frame-accurate synchronized rotation) */}
                <g
                  style={{
                    transform: `rotate(${m.angle}deg)`,
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                >
                  {/* Mirror backing bar */}
                  <line
                    x1={cx - 18}
                    y1={cy}
                    x2={cx + 18}
                    y2={cy}
                    stroke="#0284c7"
                    strokeWidth={5}
                    strokeLinecap="round"
                  />
                  {/* Reflective mirror surface */}
                  <line
                    x1={cx - 17}
                    y1={cy}
                    x2={cx + 17}
                    y2={cy}
                    stroke="#f8fafc"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                  {/* Center pivot bolt */}
                  <circle cx={cx} cy={cy} r={3} fill="#0ea5e9" stroke="#ffffff" strokeWidth={1} />
                </g>

                {/* Reflector Label and Angle Badge */}
                <text
                  x={cx}
                  y={cy - 21}
                  textAnchor="middle"
                  fill={m.isDecoy ? "#f59e0b" : isSelected ? "#38bdf8" : "#94a3b8"}
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {m.id}
                </text>
                <text
                  x={cx}
                  y={cy + 27}
                  textAnchor="middle"
                  fill={isSelected ? "#22d3ee" : "#64748b"}
                  fontSize="8.5"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {displayAngle}°
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Reflector Interactive 30° Control Panel */}
      <div className="w-full rounded-xl border border-white/10 bg-black/60 p-3 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 font-mono font-bold text-sm">
            {selectedMirror.id}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200">
              {selectedMirror.name} {selectedMirror.isDecoy && "(DECOY)"}
            </span>
            <span className="font-mono text-xs text-cyan-400">
              Target Step:{" "}
              <strong className="text-white">
                {((Math.round(targetAnglesRef.current[selectedMirror.id] ?? 0) % 360) + 360) % 360}°
              </strong>{" "}
              {isStillAnimating && <span className="text-amber-400 text-[10px] animate-pulse">(Rotating...)</span>}
            </span>
          </div>
        </div>

        {/* 30° Step Rotation Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => rotateMirrorDelta(selectedMirror.id, -30)}
            disabled={solved}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-cyan-500/15 hover:border-cyan-400/50 hover:text-cyan-200 transition disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            -30°
          </button>

          <button
            type="button"
            onClick={() => rotateMirrorDelta(selectedMirror.id, 30)}
            disabled={solved}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25 hover:border-cyan-400 transition disabled:opacity-40"
          >
            <RotateCw className="h-3.5 w-3.5" />
            +30° (Rotate)
          </button>
        </div>
      </div>

      {/* Sensor Sequence Indicator */}
      <div className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] font-mono">
        <span className="text-slate-400">Path Sequence:</span>
        <span className="text-amber-400 font-semibold">SRC</span>
        <span className="text-slate-600">→</span>
        {SENSORS.map((s, idx) => {
          const isHit = result.hitSensors.includes(s.id);
          return (
            <span key={s.id} className="flex items-center gap-1">
              <span
                className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${
                  isHit
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                    : "border-slate-800 bg-slate-900 text-slate-500"
                }`}
              >
                S{s.id}
              </span>
              {idx < SENSORS.length - 1 && <span className="text-slate-600">→</span>}
            </span>
          );
        })}
        <span className="text-slate-600">→</span>
        <span
          className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${
            result.hitTarget
              ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
              : "border-slate-800 bg-slate-900 text-slate-500"
          }`}
        >
          LOCK
        </span>
      </div>
    </div>
  );

  const opticsGuideTab = (
    <div className="space-y-4 p-2 text-sm text-slate-300">
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-2">
        <h3 className="font-bold text-cyan-200 flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          Always-On Optical Laser Routing
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The optical laser is <strong>always active and powered</strong>. Real-time beam tracing
          shows exactly how photon rays deflect across the optical array as prisms smoothly rotate.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1.5">
          <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <RotateCw className="h-3.5 w-3.5" /> 30° Smooth Rotation
          </div>
          <p className="text-slate-400">
            Each reflector rotates smoothly in calibrated increments of <strong>30 degrees</strong>.
            The laser beam smoothly sweeps and deflects in real time as the mirror turns.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1.5">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" /> Decoy Prism M5
          </div>
          <p className="text-slate-400">
            Decoy prism M5 is a counter-measure. The active laser beam must <strong>bypass M5</strong>{" "}
            completely.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-1.5 text-xs">
        <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" /> Solution Trajectory
        </div>
        <p className="text-slate-300">
          Source (0,1) → <strong>M1 (45°)</strong> down to <strong>M2 (45°)</strong> right to{" "}
          <strong>M3 (135°)</strong> up to <strong>M4 (135°)</strong> right into{" "}
          <strong>Target Lock</strong>.
        </p>
      </div>
    </div>
  );

  return (
    <PuzzleShell
      title="Optical Laser Matrix"
      accent="cyan"
      onClose={onClose}
      maxWidth="max-w-3xl"
      tabs={[
        { id: "grid", label: "Optical Grid", content: gridContent },
        { id: "guide", label: "Optics Manual", content: opticsGuideTab },
      ]}
      footer={
        <div className="space-y-2.5">
          {feedback && (
            <div
              className={`text-center text-xs font-mono font-semibold py-1 px-3 rounded-lg border ${
                solved || (result.success && !isStillAnimating)
                  ? "border-emerald-500/40 bg-emerald-950/50 text-emerald-300"
                  : "border-rose-500/40 bg-rose-950/50 text-rose-300"
              }`}
            >
              {feedback}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                targetAnglesRef.current = { ...INITIAL_ANGLES_MAP };
                startAnimation();
                setSelectedMirrorId("M1");
                setSolved(false);
                setFeedback("");
              }}
              disabled={solved}
              className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 transition disabled:opacity-40"
            >
              Reset Array
            </button>

            <div className="flex-1">
              <PuzzlePrimaryButton
                accent="cyan"
                onClick={handleTestOrSubmit}
                disabled={solved}
                className={
                  result.success && !isStillAnimating
                    ? "!bg-emerald-500/30 !border-emerald-400 !text-emerald-100 shadow-lg shadow-emerald-950/50"
                    : ""
                }
              >
                {result.success && !isStillAnimating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-300 animate-spin" />
                    CONFIRM OPTICAL LOCK
                  </span>
                ) : isStillAnimating ? (
                  "SWEEPING OPTICAL BEAM..."
                ) : (
                  "ENGAGE / VERIFY PATH"
                )}
              </PuzzlePrimaryButton>
            </div>
          </div>
        </div>
      }
    />
  );
}
