interface ResearchReportProps {
  onClose: () => void;
  onContinue: () => void;
}

export default function ResearchReport({ onClose, onContinue }: ResearchReportProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-xl border border-lime-500/30 bg-[#0c1408] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-lime-200">Research Terminal</h2>
            <p className="text-xs text-slate-400 mt-1">Restored access · Experiment integrity audit</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-3 py-1 text-sm text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="rounded-lg border border-lime-400/25 bg-gradient-to-b from-lime-950/40 to-black/50 p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-lime-300/70 mb-3">Lab Report · Draft</p>
            <h3 className="text-base font-semibold text-lime-50 mb-3">Dataset Divergence Detected</h3>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div className="rounded border border-white/10 bg-black/30 p-3">
                <p className="text-[10px] uppercase text-slate-500 mb-1">Original results</p>
                <p className="font-mono text-emerald-300">PASS · consistent</p>
              </div>
              <div className="rounded border border-rose-400/30 bg-rose-500/10 p-3">
                <p className="text-[10px] uppercase text-slate-500 mb-1">Current results</p>
                <p className="font-mono text-rose-300">ALTERED · mismatch</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-300">
              Original experiment results do <strong className="text-white">not</strong> match the
              current results. Someone changed the research records after the trial closed.
            </p>

            <p className="mt-4 text-sm text-amber-100/90 border-t border-white/10 pt-4">
              Section owner for the altered block:{" "}
              <strong className="text-rose-300">NEHA RAO</strong>
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Motive begins to form — she had access, and her section is where the data was rewritten.
            </p>
          </div>

          <button
            onClick={onContinue}
            className="w-full rounded-md bg-lime-500/20 border border-lime-400/40 px-4 py-3 text-sm font-medium text-lime-100 hover:bg-lime-500/30"
          >
            Continue — Check Lab Monitor
          </button>
        </div>
      </div>
    </div>
  );
}
