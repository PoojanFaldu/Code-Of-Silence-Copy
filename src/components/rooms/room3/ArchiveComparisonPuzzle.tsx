import React, { useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { useGame } from "@/contexts/GameContext";
import { playKeyClick, playMaskAlignSnap } from "./audio";

interface ArchiveComparisonPuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  onSolved: () => void;
  onProceedToServerRoom?: () => void;
  initialSolved?: boolean;
}

type RowId = "2058" | "2107" | "2117" | "2129" | "2136" | "2142";

const ROWS: {
  id: RowId;
  time: string;
  archive: string;
  current: string;
  changed: boolean;
}[] = [
  { id: "2058", time: "20:58", archive: "VERMA", current: "VERMA", changed: false },
  { id: "2107", time: "21:07", archive: "ARJUN", current: "ARJUN", changed: false },
  { id: "2117", time: "21:17", archive: "EXP-17 BASELINE", current: "[REDACTED]", changed: true },
  { id: "2129", time: "21:29", archive: "NEHA", current: "NEHA", changed: false },
  { id: "2136", time: "21:36", archive: "UNKNOWN SESSION", current: "[REDACTED]", changed: true },
  { id: "2142", time: "21:42", archive: "RECORD END", current: "RECORD END", changed: false },
];

const CORRECT = new Set<RowId>(["2117", "2136"]);

export const ArchiveComparisonPuzzle: React.FC<ArchiveComparisonPuzzleProps> = ({
  isOpen,
  onClose,
  onSolved,
  onProceedToServerRoom,
  initialSolved = false,
}) => {
  const { penalizeWrongAnswer } = useGame();
  const [selected, setSelected] = useState<Set<RowId>>(
    () => (initialSolved ? new Set(CORRECT) : new Set())
  );
  const [error, setError] = useState(false);
  const [done, setDone] = useState(initialSolved);

  if (!isOpen) return null;

  const toggle = (id: RowId) => {
    if (done) return;
    setError(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const recover = () => {
    const ok =
      selected.size === CORRECT.size && [...CORRECT].every((id) => selected.has(id));
    if (!ok) {
      setError(true);
      penalizeWrongAnswer();
      return;
    }
    playMaskAlignSnap();
    setDone(true);
    onSolved();
    try {
      sessionStorage.setItem("room3_puzzle6_solved", "true");
    } catch {
      /* ignore */
    }
  };

  if (done) {
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
              <span className="w-12 shrink-0 text-indigo-300">21:17</span>
              <span>EXP-17 BASELINE MODIFIED</span>
            </div>
            <div className="flex gap-4">
              <span className="w-12 shrink-0 text-indigo-300">21:36</span>
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

  return (
    <PuzzleShell
      title="Archive"
      accent="indigo"
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={
        <div className="space-y-2">
          {error && (
            <p className="text-center text-xs text-rose-400">Select the changed entries.</p>
          )}
          <PuzzlePrimaryButton accent="indigo" onClick={recover}>
            RECOVER
          </PuzzlePrimaryButton>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-center text-xs text-slate-400">Find the changed entries.</p>

        <div className="grid grid-cols-[1fr_1fr] gap-2 text-[10px] uppercase tracking-wider text-slate-500 px-1">
          <span>Archive copy</span>
          <span>Current record</span>
        </div>

        <div className="space-y-1">
          {ROWS.map((row) => {
            const on = selected.has(row.id);
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => toggle(row.id)}
                className={`w-full grid grid-cols-[1fr_1fr] gap-2 rounded-lg border px-2.5 py-2.5 text-left font-mono text-[11px] sm:text-xs transition ${
                  on
                    ? "border-indigo-400/50 bg-indigo-500/15"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <span className="flex gap-2 min-w-0">
                  <span className="w-10 shrink-0 text-slate-500">{row.time}</span>
                  <span className="text-slate-200 truncate">{row.archive}</span>
                </span>
                <span className="flex gap-2 min-w-0">
                  <span className="w-10 shrink-0 text-slate-500">{row.time}</span>
                  <span
                    className={`truncate ${
                      row.current.includes("REDACTED") ? "text-amber-200/80" : "text-slate-200"
                    }`}
                  >
                    {row.current}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </PuzzleShell>
  );
};
