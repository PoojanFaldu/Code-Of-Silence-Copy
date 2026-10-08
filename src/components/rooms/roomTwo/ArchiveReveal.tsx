import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";

interface ArchiveRevealProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function ArchiveReveal({ onClose, onComplete }: ArchiveRevealProps) {
  return (
    <PuzzleShell
      title="Archive"
      accent="slate"
      onClose={onClose}
      tabs={[
        {
          id: "access",
          label: "Access",
          content: (
            <div className="space-y-2 font-mono text-sm">
              {[
                ["File", "EXP-17_RESULTS"],
                ["Write", "21:17"],
                ["Account", "N. RAO"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5"
                >
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-200">{v}</span>
                </div>
              ))}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-amber-200/90 text-xs">
                Previous version unavailable
              </div>
            </div>
          ),
        },
      ]}
      footer={
        <PuzzlePrimaryButton accent="slate" onClick={onComplete}>
          CONTINUE
        </PuzzlePrimaryButton>
      }
    />
  );
}
