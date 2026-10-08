import React, { useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { useGame } from "@/contexts/GameContext";

interface HashFingerprintPuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  onSolved: () => void;
  onProceedToArchive?: () => void;
  /** @deprecated use onProceedToArchive */
  onProceedToOverlay?: () => void;
  onOpenNotebook?: () => void;
  initialSolved?: boolean;
}

const FILES = [
  { id: "final", name: "EXP17_FINAL", hash: "A91F27" },
  { id: "backup", name: "EXP17_BACKUP", hash: "A91F27" },
  { id: "current", name: "EXP17_CURRENT", hash: "C82B14" },
] as const;

export const HashFingerprintPuzzle: React.FC<HashFingerprintPuzzleProps> = ({
  isOpen,
  onClose,
  onSolved,
  onProceedToArchive,
  onProceedToOverlay,
  initialSolved = false,
}) => {
  const { penalizeWrongAnswer } = useGame();
  const proceed = onProceedToArchive ?? onProceedToOverlay;
  const [selected, setSelected] = useState<string | null>(initialSolved ? "current" : null);
  const [error, setError] = useState(false);
  const [solved, setSolved] = useState(initialSolved);

  if (!isOpen) return null;

  const submit = () => {
    if (selected === "current") {
      setSolved(true);
      onSolved();
      return;
    }
    setError(true);
    penalizeWrongAnswer();
  };

  return (
    <PuzzleShell
      title="Hash"
      accent="cyan"
      onClose={onClose}
      tabs={[
        {
          id: "files",
          label: "Files",
          content: (
            <div className="space-y-2">
              {FILES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  disabled={solved}
                  onClick={() => {
                    setSelected(f.id);
                    setError(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl border px-3 py-3 font-mono text-sm transition ${
                    selected === f.id
                      ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-50"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                  }`}
                >
                  <span>{f.name}</span>
                  <span className="text-slate-500">{f.hash}</span>
                </button>
              ))}
              {error && <p className="text-xs text-rose-400 text-center">Wrong file</p>}
            </div>
          ),
        },
        {
          id: "ref",
          label: "Notebook",
          content: (
            <div className="rounded-xl border border-amber-700/30 bg-amber-950/20 px-4 py-5 space-y-3 font-mono text-xs text-amber-100/90">
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/80">Hash</p>
              <p>Same file → same fingerprint</p>
              <p>Different file → different fingerprint</p>
            </div>
          ),
        },
      ]}
      footer={
        !solved ? (
          <PuzzlePrimaryButton accent="cyan" onClick={submit} disabled={!selected}>
            SELECT
          </PuzzlePrimaryButton>
        ) : (
          <PuzzlePrimaryButton
            accent="cyan"
            onClick={() => {
              onClose();
              proceed?.();
            }}
          >
            CONTINUE
          </PuzzlePrimaryButton>
        )
      }
    />
  );
};
