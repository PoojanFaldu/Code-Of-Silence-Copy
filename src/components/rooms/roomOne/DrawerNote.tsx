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
            <div className="rounded-xl border border-amber-700/30 bg-[#1a140e] p-5">
              <p className="font-serif text-base leading-relaxed text-amber-50/90 italic">
                &quot;The record ends before the night does.
                <br />
                If someone asks, I never finished reviewing Experiment 17.&quot;
              </p>
            </div>
          ),
        },
        {
          id: "scrap",
          label: "Scrap",
          content: (
            <div className="rounded-xl border border-dashed border-amber-500/30 bg-black/30 p-6 text-center space-y-2">
              <p className="font-mono text-xs tracking-widest text-amber-200/70">ENCRYPTED SCRAP</p>
              <p className="font-mono text-sm text-slate-400">FKHFN WKH …</p>
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
