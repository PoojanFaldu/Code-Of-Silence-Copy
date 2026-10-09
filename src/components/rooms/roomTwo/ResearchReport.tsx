import { useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";

interface ResearchReportProps {
  onClose: () => void;
  onContinue: () => void;
}

type EntryId = "2056" | "2103" | "2117" | "2129" | "2136" | "2141" | "2142";

const ENTRIES: {
  id: EntryId;
  time: string;
  label: string;
  detail?: { commit: string; author: string; file: string; action: string; note: string };
}[] = [
  { id: "2056", time: "20:56", label: "Professor Dev Verma" },
  { id: "2103", time: "21:03", label: "Dr. Arjun Mehta" },
  {
    id: "2117",
    time: "21:17",
    label: "Dr. Arjun Mehta",
    detail: {
      commit: "7F3A",
      author: "Dr. Arjun Mehta",
      file: "EXP17_BASELINE",
      action: "MODIFY",
      note: "PREVIOUS RESULT: 84.2%\nCURRENT RESULT:  91.7%\n\nKeep the original figures. They matter later.",
    },
  },
  { id: "2129", time: "21:29", label: "Neha Rao" },
  { id: "2136", time: "21:36", label: "Unknown User" },
  { id: "2141", time: "21:41", label: "Record Interrupted" },
  { id: "2142", time: "21:42", label: "Unavailable" },
];

/**
 * Simple fake version-history UI — not real Git.
 * Same room progression hooks as before (onContinue).
 */
export default function ResearchReport({ onClose, onContinue }: ResearchReportProps) {
  const [selected, setSelected] = useState<EntryId | null>(null);
  const active = ENTRIES.find((e) => e.id === selected);

  return (
    <PuzzleShell
      title="Experiment 17"
      accent="lime"
      onClose={onClose}
      maxWidth="max-w-lg"
      tabs={[
        {
          id: "history",
          label: "History",
          content: (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-lime-400/70">
                EXP-17 Version History
              </p>
              <div className="space-y-1">
                {ENTRIES.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelected(row.id)}
                    className={`w-full flex justify-between rounded-lg border px-3 py-2.5 font-mono text-sm text-left transition ${
                      selected === row.id
                        ? "border-lime-400/50 bg-lime-500/15 text-lime-50"
                        : "border-white/5 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="text-lime-300/80">{row.time}</span>
                    <span className={row.label === "Unavailable" ? "text-rose-300" : undefined}>
                      {row.label}
                    </span>
                  </button>
                ))}
              </div>

              {active?.detail ? (
                <div className="rounded-xl border border-lime-500/25 bg-lime-950/30 px-3 py-3 font-mono text-[11px] text-slate-200 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-lime-300/80">Commit detail</p>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">COMMIT</span>
                    <span>{active.detail.commit}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">AUTHOR</span>
                    <span className="text-lime-200">{active.detail.author}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">FILE</span>
                    <span>{active.detail.file}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">ACTION</span>
                    <span className="text-amber-200">{active.detail.action}</span>
                  </div>
                  <pre className="pt-1 whitespace-pre-wrap text-slate-400">{active.detail.note}</pre>
                </div>
              ) : selected ? (
                <p className="text-center text-[11px] text-slate-500 font-mono">
                  No detailed diff for this entry.
                </p>
              ) : (
                <p className="text-center text-[11px] text-slate-500 font-mono">
                  Select an entry to inspect.
                </p>
              )}
            </div>
          ),
        },
      ]}
      footer={
        <PuzzlePrimaryButton accent="lime" onClick={onContinue}>
          CONTINUE
        </PuzzlePrimaryButton>
      }
    />
  );
}
