import React, { useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";

interface HashFingerprintPuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  onSolved: () => void;
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
  onProceedToOverlay,
  initialSolved = false,
}) => {
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
            <div className="space-y-2 font-mono text-xs">
              {[
                ["EXP17_FINAL", "A91F27"],
                ["EXP17_BACKUP", "A91F27"],
                ["EXP17_CURRENT", "A91F27"],
              ].map(([n, h]) => (
                <div
                  key={n}
                  className="flex justify-between rounded-xl border border-amber-700/30 bg-amber-950/20 px-3 py-2.5 text-amber-100/90"
                >
                  <span>{n}</span>
                  <span>{h}</span>
                </div>
              ))}
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
              onProceedToOverlay?.();
            }}
          >
            CONTINUE
          </PuzzlePrimaryButton>
        )
      }
    />
  );
};
