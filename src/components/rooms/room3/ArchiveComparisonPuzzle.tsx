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

type RowId = "2056" | "2103" | "2117" | "2129" | "2136" | "2142" | "2107";

type Row = {
  id: RowId;
  time: string;
  archive: string;
  current: string;
  /** True only for story-critical redactionsactions / replaced entries */
  material: boolean;
  hint?: string;
};

/**
 * Harder compare: several rows "look" different (case, spacing, labels),
 * but only two are material integrity failures that match the story.
 */
const ROWS: Row[] = [
  {
    id: "2056",
    time: "20:56",
    archive: "VERMA",
    current: "Verma",
    material: false,
    hint: "case only",
  },
  {
    id: "2103",
    time: "21:03",
    archive: "ARJUN",
    current: "A. MEHTA",
    material: false,
    hint: "same person, display format",
  },
  {
    id: "2107",
    time: "21:07",
    archive: "SYSTEM PING",
    current: "SYSTEM  PING",
    material: false,
    hint: "spacing only",
  },
  {
    id: "2117",
    time: "21:17",
    archive: "EXP-17 BASELINE",
    current: "[CONTENT REMOVED]",
    material: true,
  },
  {
    id: "2129",
    time: "21:29",
    archive: "NEHA — REVIEW",
    current: "N. RAO",
    material: false,
    hint: "same access, shortened label",
  },
  {
    id: "2136",
    time: "21:36",
    archive: "UNKNOWN SESSION",
    current: "[CONTENT REMOVED]",
    material: true,
  },
  {
    id: "2142",
    time: "21:42",
    archive: "RECORD END",
    current: "RECORD_END",
    material: false,
    hint: "underscore formatting",
  },
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
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(initialSolved);

  if (!isOpen) return null;

  const toggle = (id: RowId) => {
    if (done) return;
    setError(null);
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
      setError(
        selected.size === 0
          ? "Mark the entries that were actually altered."
          : "Include only material integrity failures — ignore formatting / label variants."
      );
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
          <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/[0.06] px-4 py-3 font-mono text-[11px] text-slate-200 space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-indigo-300/80">Original change</p>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Time</span>
              <span>21:17</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Entry</span>
              <span>EXP-17 BASELINE</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Authorized researcher</span>
              <span className="text-indigo-200">A. MEHTA</span>
            </div>
            <p className="pt-1 text-[10px] text-slate-500 leading-relaxed">
              Baseline changes normally require the assigned researcher.
            </p>
          </div>
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
      tabs={[
        {
          id: "rules",
          label: "Rules",
          content: (
            <div className="space-y-3 font-mono text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              <p className="text-[10px] uppercase tracking-widest text-indigo-300/80">
                Integrity recovery protocol
              </p>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 space-y-2">
                <p>
                  Mark only <span className="text-indigo-200">material</span> failures — where the
                  current record replaced or hid the original content.
                </p>
                <p className="text-slate-500">Ignore cosmetic drift:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-400">
                  <li>Letter case / spacing</li>
                  <li>Name display variants (same person)</li>
                  <li>Punctuation or underscores</li>
                </ul>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2.5 text-amber-100/85">
                Story check: the original Experiment 17 rewrite and a later obscured session are
                the two failures that matter.
              </div>
            </div>
          ),
        },
        {
          id: "compare",
          label: "Compare",
          content: (
            <div className="space-y-3">
              <p className="text-center text-xs text-slate-400">
                Select the material integrity failures, then Recover.
              </p>

              <div className="grid grid-cols-[1fr_1fr] gap-2 text-[10px] uppercase tracking-wider text-slate-500 px-1">
                <span>Archive copy</span>
                <span>Current record</span>
              </div>

              <div className="space-y-1">
                {ROWS.map((row) => {
                  const on = selected.has(row.id);
                  const looksDifferent = row.archive !== row.current;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => toggle(row.id)}
                      className={`w-full grid grid-cols-[1fr_1fr] gap-2 rounded-lg border px-2.5 py-2.5 text-left font-mono text-[11px] sm:text-xs transition ${
                        on
                          ? "border-indigo-400/50 bg-indigo-500/15"
                          : looksDifferent
                            ? "border-white/15 bg-white/[0.04] hover:bg-white/[0.07]"
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
                            row.current.includes("REMOVED")
                              ? "text-amber-200/80"
                              : looksDifferent
                                ? "text-slate-100"
                                : "text-slate-200"
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
          ),
        },
      ]}
      footer={
        <div className="space-y-2">
          {error && <p className="text-center text-xs text-rose-400">{error}</p>}
          <PuzzlePrimaryButton accent="indigo" onClick={recover} disabled={selected.size === 0}>
            RECOVER
          </PuzzlePrimaryButton>
        </div>
      }
    />
  );
};
