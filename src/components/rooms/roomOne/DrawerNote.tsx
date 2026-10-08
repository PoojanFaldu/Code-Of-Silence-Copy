import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";

interface DrawerNoteProps {
  onContinue: () => void;
  onClose: () => void;
}

export default function DrawerNote({ onContinue, onClose }: DrawerNoteProps) {
  return (
    <PuzzleShell
      title="Note"
      accent="amber"
      onClose={onClose}
      tabs={[
        {
          id: "note",
          label: "Note",
          content: (
            <div className="rounded-xl border border-amber-700/30 bg-[#1a140e] p-5 space-y-4">
              <p className="font-mono text-[10px] tracking-widest text-amber-500/80">20:41 — D. VERMA</p>
              <p className="font-serif text-base leading-relaxed text-amber-50/90 italic">
                EXP-17 was altered before the later record changes.
                <br />
                <br />
                I finally know where the original discrepancy came from.
                <br />
                <br />
                I did not expect it would be one of my own colleagues.
                <br />
                <br />
                I have to settle this tonight — before the file is rewritten again.
              </p>
            </div>
          ),
        },
        {
          id: "scrap",
          label: "Scrap",
          content: (
            <div className="space-y-3">
              <div className="rounded-xl border border-dashed border-amber-500/30 bg-black/30 p-6 text-center space-y-2">
                <p className="font-mono text-xs tracking-widest text-amber-200/70">ENCRYPTED SCRAP</p>
                <p className="font-mono text-sm text-slate-400">FKHFN WKH …</p>
              </div>
              <p className="font-serif text-sm text-amber-50/70 italic text-center px-2">
                &quot;The record ends before the night does.
                <br />
                If someone asks, I never finished reviewing Experiment 17.&quot;
              </p>
            </div>
          ),
        },
      ]}
      footer={
        <PuzzlePrimaryButton accent="amber" onClick={onContinue}>
          TAKE SCRAP
        </PuzzlePrimaryButton>
      }
    />
  );
}
