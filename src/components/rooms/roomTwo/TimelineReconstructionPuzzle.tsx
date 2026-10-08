import { useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";

interface TimelineReconstructionPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

type EventId = "verma" | "arjun" | "file" | "neha" | "unknown" | "interrupt";

const EVENTS: { id: EventId; label: string; stamp: string }[] = [
  { id: "verma", label: "VERMA — SESSION OPENED", stamp: "20:??" },
  { id: "arjun", label: "ARJUN — RESEARCH ACCESS", stamp: "21:??" },
  { id: "file", label: "FILE — MODIFIED", stamp: "21:??" },
  { id: "neha", label: "NEHA — RECORD ACCESS", stamp: "21:??" },
  { id: "unknown", label: "UNKNOWN — TERMINAL", stamp: "21:??" },
  { id: "interrupt", label: "RECORD — INTERRUPTED", stamp: "21:??" },
];

const SOLUTION: EventId[] = ["verma", "arjun", "file", "neha", "unknown", "interrupt"];

const CLUES = [
  "Arjun before file modified",
  "Neha after modification",
  "Unknown after Neha",
  "Interruption last",
  "Verma first",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TimelineReconstructionPuzzle({
  onSolved,
  onClose,
}: TimelineReconstructionPuzzleProps) {
  const [order, setOrder] = useState<EventId[]>(() => shuffle(EVENTS.map((e) => e.id)));
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= order.length) return;
    const copy = [...order];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setOrder(copy);
    setError(false);
  };

  const byId = (id: EventId) => EVENTS.find((e) => e.id === id)!;

  if (done) {
    return (
      <PuzzleShell
        title="Timeline"
        accent="sky"
        onClose={onClose}
        footer={
          <PuzzlePrimaryButton accent="sky" onClick={onSolved}>
            CONTINUE
          </PuzzlePrimaryButton>
        }
      >
        <div className="text-center space-y-2 py-4">
          <p className="text-emerald-300 font-semibold tracking-widest text-sm">RECOVERED</p>
          <p className="text-xs text-slate-400">Activity log incomplete</p>
          <p className="text-xs text-slate-500">Offline copy may exist in archives</p>
        </div>
      </PuzzleShell>
    );
  }

  return (
    <PuzzleShell
      title="Timeline"
      accent="sky"
      onClose={onClose}
      tabs={[
        {
          id: "order",
          label: "Order",
          content: (
            <div className="space-y-2">
              {order.map((id, index) => {
                const e = byId(id);
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <span className="font-mono text-[10px] text-slate-500 w-10">{e.stamp}</span>
                    <span className="flex-1 font-mono text-[11px] text-slate-200">{e.label}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        className="h-8 w-8 rounded-lg border border-white/10 text-slate-300 hover:bg-white/10"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        className="h-8 w-8 rounded-lg border border-white/10 text-slate-300 hover:bg-white/10"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })}
              {error && <p className="text-xs text-rose-400 text-center">Wrong order</p>}
            </div>
          ),
        },
        {
          id: "clues",
          label: "Clues",
          content: (
            <div className="space-y-2">
              {CLUES.map((c) => (
                <div
                  key={c}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-slate-300"
                >
                  {c}
                </div>
              ))}
            </div>
          ),
        },
      ]}
      footer={
        <PuzzlePrimaryButton
          accent="sky"
          onClick={() => {
            if (order.every((id, i) => id === SOLUTION[i])) setDone(true);
            else setError(true);
          }}
        >
          SUBMIT
        </PuzzlePrimaryButton>
      }
    />
  );
}
