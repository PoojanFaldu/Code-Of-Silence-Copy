import React, { useCallback, useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { playKeyClick, playMaskAlignSnap, playPaperSlide } from "./audio";

interface OverlayMaskPuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  onSolved: () => void;
  onProceedToServerRoom?: () => void;
  initialSolved?: boolean;
}

const PAGES = [
  { id: 1, title: "Batch", correct: false, mark: { x: 80, y: 35 } },
  { id: 2, title: "EXP-17", correct: true, mark: { x: 120, y: 70 } },
  { id: 3, title: "Calib", correct: false, mark: { x: 160, y: 110 } },
  { id: 4, title: "Custody", correct: false, mark: { x: 95, y: 140 } },
];

const TARGET_X = 120;
const TARGET_Y = 70;
const TOLERANCE = 18;

export const OverlayMaskPuzzle: React.FC<OverlayMaskPuzzleProps> = ({
  isOpen,
  onClose,
  onSolved,
  onProceedToServerRoom,
  initialSolved = false,
}) => {
  const [pageId, setPageId] = useState(initialSolved ? 2 : 1);
  const [pos, setPos] = useState(initialSolved ? { x: TARGET_X, y: TARGET_Y } : { x: 30, y: 10 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [aligned, setAligned] = useState(initialSolved);
  const [done, setDone] = useState(initialSolved);

  const page = PAGES.find((p) => p.id === pageId) || PAGES[0];

  const check = useCallback(
    (x: number, y: number, pid: number) => {
      if (pid !== 2) return;
      if (Math.hypot(x - TARGET_X, y - TARGET_Y) <= TOLERANCE && !aligned) {
        playMaskAlignSnap();
        setAligned(true);
        setDone(true);
        onSolved();
      }
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
        <div className="text-center space-y-2 py-4">
          <p className="text-indigo-200 font-semibold tracking-widest text-sm">TIMELINE RECOVERED</p>
          <p className="font-mono text-xs text-slate-400">SESSION ARCHIVE</p>
        </div>
      </PuzzleShell>
    );
  }

  return (
    <PuzzleShell
      title="Overlay"
      accent="indigo"
      onClose={onClose}
      maxWidth="max-w-2xl"
      tabs={[
        {
          id: "align",
          label: "Align",
          content: (
            <div
              className="relative w-full h-[280px] rounded-xl border border-white/10 bg-[#0d131f] overflow-hidden touch-none"
              onPointerMove={(e) => {
                if (!dragging) return;
                const nx = Math.max(0, Math.min(240, e.clientX - dragStart.x));
                const ny = Math.max(0, Math.min(140, e.clientY - dragStart.y));
                setPos({ x: nx, y: ny });
                check(nx, ny, pageId);
              }}
              onPointerUp={() => setDragging(false)}
            >
              <div
                className="absolute text-cyan-500/40 font-mono text-sm pointer-events-none"
                style={{ left: page.mark.x + 10, top: page.mark.y + 10 }}
              >
                ⌖
              </div>
              <div
                onPointerDown={(e) => {
                  setDragging(true);
                  setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
                  (e.target as HTMLElement).setPointerCapture(e.pointerId);
                }}
                className={`absolute w-[180px] h-[120px] rounded-lg border-2 cursor-grab active:cursor-grabbing ${
                  aligned && page.correct
                    ? "border-amber-400 bg-amber-500/10"
                    : "border-cyan-400/50 bg-cyan-500/10"
                }`}
                style={{ left: pos.x, top: pos.y }}
              >
                <div className="p-2 font-mono text-[10px] text-cyan-200/70">overlay ⌖</div>
              </div>
            </div>
          ),
        },
        {
          id: "pages",
          label: "Pages",
          content: (
            <div className="grid grid-cols-2 gap-2">
              {PAGES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    playPaperSlide();
                    setPageId(p.id);
                    check(pos.x, pos.y, p.id);
                  }}
                  className={`rounded-xl border px-3 py-4 font-mono text-xs transition ${
                    pageId === p.id
                      ? "border-indigo-400/50 bg-indigo-500/20 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
};
