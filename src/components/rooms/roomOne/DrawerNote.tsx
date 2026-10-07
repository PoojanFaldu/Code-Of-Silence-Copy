interface DrawerNoteProps {
  onContinue: () => void;
  onClose: () => void;
}

export default function DrawerNote({ onContinue, onClose }: DrawerNoteProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-amber-500/30 bg-[#14100b] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-amber-200">Concealed Drawer</h2>
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-3 py-1 text-sm text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-6 space-y-5">
          <p className="text-sm text-slate-400">
            The laser finds its target. A slim drawer beneath the desk slides open — Verma left something behind.
          </p>

          <div className="rounded-lg border border-amber-700/40 bg-[#1c160f] p-5 shadow-inner">
            <p className="font-serif text-base leading-relaxed text-amber-100/90 italic">
              &quot;If you&apos;re reading this, I didn&apos;t have time to finish. The archive contains the proof. But
              first, find the key I left behind.&quot;
            </p>
            <p className="mt-4 text-right text-xs tracking-widest text-amber-500/80">— D. VERMA</p>
          </div>

          <p className="text-sm text-slate-300">
            Under the note sits a second scrap — ciphered letters and a faint cipher reference.
          </p>

          <button
            onClick={onContinue}
            className="w-full rounded-md bg-amber-500/20 border border-amber-400/40 px-4 py-3 text-sm font-medium text-amber-100 hover:bg-amber-500/30"
          >
            Examine Encrypted Note
          </button>
        </div>
      </div>
    </div>
  );
}
