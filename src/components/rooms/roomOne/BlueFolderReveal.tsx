import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";

interface BlueFolderRevealProps {
  onClose: () => void;
  onComplete: () => void;
}

const LINES = [
  ["20:58", "VERMA"],
  ["21:07", "ARJUN"],
  ["21:18", "UNKNOWN"],
  ["21:26", "NEHA"],
  ["21:34", "UNKNOWN"],
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
      ]}
      footer={
        <PuzzlePrimaryButton accent="sky" onClick={onComplete}>
          CONTINUE
        </PuzzlePrimaryButton>
      }
    />
  );
}
