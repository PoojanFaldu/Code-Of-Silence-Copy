import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";

interface ResearchReportProps {
  onClose: () => void;
  onContinue: () => void;
}

const LINES = [
  ["20:56", "VERMA"],
  ["21:03", "ARJUN"],
  ["21:17", "FILE CHANGE"],
  ["21:29", "NEHA"],
  ["21:36", "UNKNOWN"],
  ["21:41", "INTERRUPT"],
  ["21:42", "UNAVAILABLE"],
];

export default function ResearchReport({ onClose, onContinue }: ResearchReportProps) {
  return (
    <PuzzleShell
      title="Experiment 17"
      accent="lime"
      onClose={onClose}
      tabs={[
        {
          id: "log",
          label: "Log",
          content: (
            <div className="space-y-1">
              {LINES.map(([t, n]) => (
                <div
                  key={t}
                  className="flex justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5 font-mono text-sm"
                >
                  <span className="text-lime-300/80">{t}</span>
                  <span className={n === "UNAVAILABLE" ? "text-rose-300" : "text-slate-200"}>{n}</span>
                </div>
              ))}
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
