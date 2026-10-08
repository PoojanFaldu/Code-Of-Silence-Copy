import React, { useCallback, useRef, useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { playKeyClick, playMaskAlignSnap } from "./audio";

interface OverlayMaskPuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  onSolved: () => void;
  onProceedToServerRoom?: () => void;
  initialSolved?: boolean;
}

/** Fixed row height — recovered sheet uses the same grid */
const ROW_H = 40;
const PAD_Y = 12;
/** Overlay top aligns to row index 2 (21:17); second entry then hits row 4 (21:36) */
const TARGET_Y = PAD_Y + 2 * ROW_H;
const TOLERANCE = 14;

const BASE_ROWS: { time: string; text: string; missing?: boolean }[] = [
  { time: "20:58", text: "VERMA — SESSION OPENED" },
  { time: "21:07", text: "ARJUN — RESEARCH ACCESS" },
  { time: "21:17", text: "[ MISSING ]", missing: true },
  { time: "21:29", text: "NEHA — RECORD ACCESS" },
  { time: "21:36", text: "[ MISSING ]", missing: true },
  { time: "21:42", text: "RECORD ENDS" },
];

const RECOVERED = [
  { time: "21:17", text: "EXP-17 BASELINE MODIFIED" },
  { time: "21:36", text: "UNKNOWN SESSION" },
];

export const OverlayMaskPuzzle: React.FC<OverlayMaskPuzzleProps> = ({
  isOpen,
  onClose,
  onSolved,
  onProceedToServerRoom,
  initialSolved = false,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 8, y: initialSolved ? TARGET_Y : PAD_Y + ROW_H * 0.3 });
  const [pos, setPos] = useState(posRef.current);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [aligned, setAligned] = useState(initialSolved);
  const [done, setDone] = useState(initialSolved);
  const [snapping, setSnapping] = useState(false);

  const tryAlign = useCallback(
    (y: number) => {
      if (aligned) return false;
      if (Math.abs(y - TARGET_Y) <= TOLERANCE) {
        setSnapping(true);
        const snapped = { x: 8, y: TARGET_Y };
        posRef.current = snapped;
        setPos(snapped);
        playMaskAlignSnap();
        setAligned(true);
        setDone(true);
        onSolved();
        try {
          sessionStorage.setItem("room3_puzzle6_solved", "true");
        } catch {
          /* ignore */
        }
        setTimeout(() => setSnapping(false), 280);
        return true;
      }
      return false;
    },
    [aligned, onSolved]
  );

  if (!isOpen) return null;

  if (done && aligned) {
    return (
      <PuzzleShell
        title="Archive"
        accent="indigo"
        onClose={onClose}
        footer={
          <PuzzlePrimaryButton
            accent="indigo"
            onClick={() => {
              playKeyClick();
              onClose();
              onProceedToServerRoom?.();
            }}
          >
            CONTINUE
          </PuzzlePrimaryButton>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-center text-sm font-semibold tracking-[0.2em] text-indigo-200">
            ARCHIVE RECOVERED
          </p>
          <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-xs text-slate-200 space-y-2">
            <div className="flex gap-4">
              <span className="text-indigo-300 w-12 shrink-0">21:17</span>
              <span>EXP-17 BASELINE MODIFIED</span>
            </div>
            <div className="flex gap-4">
              <span className="text-indigo-300 w-12 shrink-0">21:36</span>
              <span>UNKNOWN SESSION</span>
            </div>
          </div>
          <p className="text-center font-mono text-[10px] tracking-[0.25em] text-slate-500">
            SESSION ARCHIVE
          </p>
        </div>
      </PuzzleShell>
    );
  }

  const overlayH = ROW_H * 3; // spans 21:17 → gap → 21:36 (two entries with one blank between)

  return (
    <PuzzleShell title="Archive" accent="indigo" onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-3">
        <p className="text-center text-xs text-slate-400">Align the recovered record.</p>

        <div
          ref={boardRef}
          className="relative w-full select-none touch-none overflow-hidden rounded-xl border border-white/10 bg-[#0a0e16]"
          style={{ height: PAD_Y * 2 + BASE_ROWS.length * ROW_H }}
          onPointerMove={(e) => {
            if (!dragging || aligned) return;
            const board = boardRef.current;
            if (!board) return;
            const maxY = board.clientHeight - overlayH - 4;
            const nx = Math.max(4, Math.min(40, e.clientX - dragStart.x));
            const ny = Math.max(4, Math.min(maxY, e.clientY - dragStart.y));
            posRef.current = { x: nx, y: ny };
            setPos({ x: nx, y: ny });
          }}
          onPointerUp={() => {
            if (!dragging) return;
            setDragging(false);
            tryAlign(posRef.current.y);
          }}
        >
          {/* Base timeline */}
          <div className="absolute inset-x-0 pointer-events-none" style={{ top: PAD_Y }}>
            {BASE_ROWS.map((row, i) => (
              <div
                key={row.time + i}
                className={`flex items-center gap-3 border-b border-white/[0.06] px-3 font-mono text-[11px] sm:text-xs ${
                  row.missing ? "bg-amber-500/[0.06]" : ""
                }`}
                style={{ height: ROW_H }}
              >
                <span className="w-12 shrink-0 text-slate-500">{row.time}</span>
                <span className={row.missing ? "text-amber-200/70 tracking-wide" : "text-slate-300"}>
                  {row.text}
                </span>
              </div>
            ))}
          </div>

          {/* Draggable recovered record — same row height as base */}
          <div
            onPointerDown={(e) => {
              if (aligned) return;
              e.preventDefault();
              setDragging(true);
              setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }}
            className={`absolute left-0 right-2 cursor-grab active:cursor-grabbing rounded-lg border backdrop-blur-[2px] transition-[box-shadow,border-color] ${
              aligned || snapping
                ? "border-emerald-400/70 bg-emerald-500/10 shadow-[0_0_20px_rgba(52,211,153,0.25)]"
                : "border-cyan-400/50 bg-cyan-500/[0.08] hover:border-cyan-300/70"
            }`}
            style={{
              top: pos.y,
              left: pos.x,
              height: overlayH,
              width: `calc(100% - ${pos.x + 8}px)`,
            }}
          >
            {/* Entry at row 0 of overlay (= first missing when aligned) */}
            <div className="flex items-center gap-3 px-3 font-mono text-[11px] sm:text-xs" style={{ height: ROW_H }}>
              <span className="w-12 shrink-0 text-cyan-300">{RECOVERED[0].time}</span>
              <span className="text-cyan-100">{RECOVERED[0].text}</span>
            </div>
            {/* Spacer = one base row (21:29) */}
            <div style={{ height: ROW_H }} className="border-y border-cyan-400/10" />
            {/* Entry at row 2 of overlay (= second missing when aligned) */}
            <div className="flex items-center gap-3 px-3 font-mono text-[11px] sm:text-xs" style={{ height: ROW_H }}>
              <span className="w-12 shrink-0 text-cyan-300">{RECOVERED[1].time}</span>
              <span className="text-cyan-100">{RECOVERED[1].text}</span>
            </div>
          </div>
        </div>
      </div>
    </PuzzleShell>
  );
};
