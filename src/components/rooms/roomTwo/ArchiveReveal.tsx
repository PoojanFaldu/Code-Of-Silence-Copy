interface ArchiveRevealProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function ArchiveReveal({ onClose, onComplete }: ArchiveRevealProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-xl border border-slate-500/40 bg-[#0a0d12] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Archive Access Log</h2>
            <p className="text-xs text-emerald-400 mt-1 font-mono">SECURE CONNECTION · PORT 443</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-3 py-1 text-sm text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="rounded-lg border border-white/10 bg-black/50 p-4 font-mono text-sm text-slate-300 space-y-3">
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <span className="text-slate-500">Last accessed file</span>
              <span className="text-sky-200">EXP-17_RESULTS</span>
              <span className="text-slate-500">Last modified</span>
              <span className="text-sky-200">21:17</span>
              <span className="text-slate-500">User</span>
              <span className="text-rose-300 font-semibold">NEHA RAO</span>
            </div>
          </div>

          <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            The latest access and the altered section both carry Neha Rao&apos;s name.
          </div>

          <div className="rounded-lg border border-amber-400/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90 space-y-1">
            <p className="font-mono text-xs uppercase tracking-wider text-amber-300/80">Archive note</p>
            <p className="font-mono text-amber-200">WARNING: Previous file version unavailable.</p>
            <p className="font-mono text-amber-200/80">Original modification record unavailable.</p>
            <p className="font-mono text-amber-200/80">Modification history partially corrupted.</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300 space-y-2">
            <p>
              Access, alteration, and timing all line up with Neha. She had every reason to fear what Verma would
              find.
            </p>
            <p className="text-slate-400 text-sm">
              EXP-17 also references archived experimental records. Physical archive index required.
            </p>
            <p className="text-slate-500 text-xs font-mono">
              Open item: original modification record unavailable — history gap remains unexplained.
            </p>
          </div>

          <button
            onClick={onComplete}
            className="w-full rounded-md bg-sky-500/20 border border-sky-400/40 px-4 py-3 text-sm font-medium text-sky-100 hover:bg-sky-500/30"
          >
            Log Evidence — Update Trail
          </button>
        </div>
      </div>
    </div>
  );
}
