interface CctvRevealProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function CctvReveal({ onClose, onComplete }: CctvRevealProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-xl border border-slate-500/40 bg-[#0a0d12] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">CCTV Playback</h2>
            <p className="text-xs text-emerald-400 mt-1 font-mono">SIGNAL RESTORED · DAMAGED FOOTAGE</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-3 py-1 text-sm text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="relative overflow-hidden rounded-lg border border-white/15 bg-black aspect-video">
            <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.04)_3px)]" />
            <div className="absolute top-3 left-3 text-[10px] font-mono text-rose-400">REC ● CAM-03 · LAB</div>
            <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-400">23:41:08</div>

            <div className="absolute inset-0 flex items-end justify-center pb-8 gap-8">
              <div className="flex flex-col items-center gap-2">
                <div className="h-24 w-16 rounded-t-full bg-slate-700/80 border border-slate-500/50" />
                <div className="h-16 w-20 rounded bg-slate-600/70 border border-slate-500/40" />
                <p className="text-[10px] text-slate-400 font-mono">Face obscured</p>
              </div>
              <div className="flex flex-col items-center gap-2 -mb-2">
                <div className="h-14 w-[4.5rem] rounded-md bg-rose-900/80 border-2 border-rose-400/70 shadow-[0_0_18px_rgba(251,113,133,0.35)] px-3 py-2">
                  <div className="h-2 w-10 bg-rose-300/50 rounded mb-2" />
                  <div className="h-2 w-8 bg-rose-200/40 rounded" />
                </div>
                <p className="text-[10px] text-rose-300 font-semibold">Neha&apos;s research bag</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-12 rounded-sm bg-amber-200/80 border border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.35)]" />
                <p className="text-[10px] text-amber-200">Rectangular object</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2 text-sm text-slate-300">
            <p>
              A person enters the laboratory shortly before the murder. Their face isn&apos;t visible.
            </p>
            <p>
              The recording clearly shows <strong className="text-rose-300">Neha&apos;s distinctive research bag</strong>.
              She was probably in the lab around the relevant time — but this still isn&apos;t proof she killed Verma.
            </p>
            <p className="text-amber-200/90">
              They are also carrying a <strong>small rectangular object</strong> into the lab. That detail may matter later.
            </p>
          </div>

          <button
            onClick={onComplete}
            className="w-full rounded-md bg-sky-500/20 border border-sky-400/40 px-4 py-3 text-sm font-medium text-sky-100 hover:bg-sky-500/30"
          >
            Log CCTV Clues
          </button>
        </div>
      </div>
    </div>
  );
}
