interface EvidenceTrailModalProps {
  title?: string;
  findings: string[];
  nextRoomLabel: string;
  onProceed: () => void;
  onStay?: () => void;
}

/** Story-driven room transition after completing a room's investigation. */
export default function EvidenceTrailModal({
  title = "EVIDENCE TRAIL UPDATED",
  findings,
  nextRoomLabel,
  onProceed,
  onStay,
}: EvidenceTrailModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-cyan-500/35 bg-[#070d14] shadow-2xl overflow-hidden">
        <div className="border-b border-cyan-500/20 px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-400/80">The Last Session</p>
          <h2 className="mt-1 text-lg font-semibold text-cyan-100">{title}</h2>
        </div>

        <div className="px-5 py-5 space-y-4">
          <ul className="space-y-2">
            {findings.map((line) => (
              <li
                key={line}
                className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300"
              >
                {line}
              </li>
            ))}
          </ul>

          <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            Proceed to <strong className="text-white">{nextRoomLabel}</strong>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {onStay && (
              <button
                onClick={onStay}
                className="flex-1 rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-300 hover:bg-white/10"
              >
                Stay a moment
              </button>
            )}
            <button
              onClick={onProceed}
              className="flex-1 rounded-md border border-cyan-400/40 bg-cyan-500/20 px-4 py-3 text-sm font-medium text-cyan-50 hover:bg-cyan-500/30"
            >
              Continue Investigation →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
