import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";

interface BlueFolderRevealProps {
  onClose: () => void;
  onComplete: () => void;
}

/** Canonical night log — partial / incomplete office copy */
const LINES = [
  ["20:56", "VERMA"],
  ["21:03", "ARJUN"],
  ["21:17", "FILE CHANGE"],
  ["21:29", "NEHA"],
  ["21:36", "UNKNOWN"],
  ["21:42", "RECORD UNAVAILABLE"],
];

export default function BlueFolderReveal({ onClose, onComplete }: BlueFolderRevealProps) {
  return (
    <PuzzleShell
      title="File"
      accent="sky"
      onClose={onClose}
      tabs={[
        {
          id: "log",
          label: "Log",
          content: (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.25em] text-sky-400/70 mb-3">Experiment 17</p>
              {LINES.map(([t, n]) => (
                <div
                  key={t + n}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5 font-mono text-sm hover:bg-white/[0.06] transition"
                >
                  <span className="text-sky-300/80">{t}</span>
                  <span className={n.includes("UNAVAILABLE") ? "text-rose-300" : "text-slate-200"}>{n}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          id: "protocol",
          label: "Protocol",
          content: (
            <div className="space-y-3 font-mono text-xs sm:text-sm">
              <p className="text-[10px] uppercase tracking-[0.25em] text-sky-400/70">EXP-17 Baseline Control</p>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-2 text-slate-300 leading-relaxed">
                <p>Baseline revisions require authorization from the assigned researcher.</p>
                <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                  <span className="text-slate-500">Assigned researcher</span>
                  <span className="text-sky-200">A. Mehta</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Protocol note only. Does not record who performed any specific write.
              </p>
            </div>
          ),
        },
      ]}
      footer={
        <PuzzlePrimaryButton accent="sky" onClick={onComplete}>
          CONTINUE
        </PuzzlePrimaryButton>
      }
    />
  );
}
