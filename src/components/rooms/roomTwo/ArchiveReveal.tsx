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
                ["Account", "Neha Rao"],
                ["Action", "REVIEW"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5"
                >
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-200">{v}</span>
                </div>
              ))}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-amber-200/90 text-xs leading-relaxed">
                Neha Rao opened Professor Dev Verma&apos;s research records on her own.
                <br />
                At first glance, it looks like she was hiding something.
                <br />
                A review action does not change a recorded result.
              </div>
            </div>
          ),
        },
        {
          id: "conflict",
          label: "Conflict",
          content: (
            <div className="space-y-3 font-mono text-xs sm:text-sm">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                Research collaboration note
              </p>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-2 text-slate-300 leading-relaxed">
                <p>
                  Professor Dev Verma and Dr. Sameer Shah were collaborating on related research.
                </p>
                <div className="border-t border-white/10 pt-2 space-y-1">
                  <p className="text-slate-500">Recent disagreement</p>
                  <p className="text-slate-200">Publication ownership / research credit</p>
                </div>
                <div className="border-t border-white/10 pt-2 space-y-1">
                  <p className="text-slate-500">Status</p>
                  <p className="text-amber-200/90">Unresolved</p>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Verma was preparing a publication that would undermine part of Dr. Sameer
                  Shah&apos;s work.
                </p>
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
