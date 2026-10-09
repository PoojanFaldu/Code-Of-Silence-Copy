import { useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { useGame } from "@/contexts/GameContext";
import { GripVertical } from "lucide-react";

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
  const { penalizeWrongAnswer } = useGame();
  const [order, setOrder] = useState<EventId[]>(() => shuffle(EVENTS.map((e) => e.id)));
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const byId = (id: EventId) => EVENTS.find((e) => e.id === id)!;

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) return;
    const copy = [...order];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    setOrder(copy);
    setError(false);
  };

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
              <p className="text-[10px] uppercase tracking-widest text-slate-500 text-center pb-1">
                Drag entries to reorder the timeline
              </p>
              {order.map((id, index) => {
                const e = byId(id);
                const isDragging = dragIndex === index;
                const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    onDragOver={(ev) => {
                      ev.preventDefault();
                      setOverIndex(index);
                    }}
                    onDrop={(ev) => {
                      ev.preventDefault();
                      if (dragIndex !== null) reorder(dragIndex, index);
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-grab active:cursor-grabbing transition ${
                      isDragging
                        ? "opacity-40 border-sky-400/40 bg-sky-500/10"
                        : isOver
                          ? "border-sky-400/60 bg-sky-500/15 scale-[1.01]"
                          : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <GripVertical className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="font-mono text-[10px] text-slate-500 w-10">{e.stamp}</span>
                    <span className="flex-1 font-mono text-[11px] text-slate-200">{e.label}</span>
                    <span className="text-[10px] text-slate-600 font-mono">#{index + 1}</span>
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
            else {
              setError(true);
              penalizeWrongAnswer();
            }
          }}
        >
          SUBMIT
        </PuzzlePrimaryButton>
      }
    />
  );
}
