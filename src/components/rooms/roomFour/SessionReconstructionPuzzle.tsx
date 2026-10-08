import { useMemo, useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";

interface SessionReconstructionPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

type EventId =
  | "verma_enter"
  | "arjun"
  | "exp17"
  | "neha"
  | "unknown"
  | "verma_disconnect"
  | "ceased";

const SLOTS = ["20:56", "21:03", "21:17", "21:29", "21:36", "21:41", "21:42"] as const;

const EVENTS: { id: EventId; label: string; short: string }[] = [
  { id: "verma_enter", label: "VERMA ENTERED SERVER ROOM", short: "VERMA ENTER" },
  { id: "arjun", label: "ARJUN RESEARCH SESSION", short: "ARJUN" },
  { id: "exp17", label: "EXP-17 BASELINE MODIFIED", short: "EXP-17 MOD" },
  { id: "neha", label: "NEHA RECORD ACCESS", short: "NEHA" },
  { id: "unknown", label: "UNKNOWN SESSION", short: "UNKNOWN" },
  { id: "verma_disconnect", label: "VERMA TERMINAL DISCONNECTED", short: "VERMA DISCONNECT" },
  { id: "ceased", label: "ALL ACTIVITY CEASED", short: "CEASED" },
];

const SOLUTION: EventId[] = [
  "verma_enter",
  "arjun",
  "exp17",
  "neha",
  "unknown",
  "verma_disconnect",
  "ceased",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SessionReconstructionPuzzle({
  onSolved,
  onClose,
}: SessionReconstructionPuzzleProps) {
  const poolInit = useMemo(() => shuffle(EVENTS.map((e) => e.id)), []);
  const [slots, setSlots] = useState<(EventId | null)[]>(() => SLOTS.map(() => null));
  const [pool, setPool] = useState<EventId[]>(poolInit);
  const [selected, setSelected] = useState<EventId | null>(null);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  const shortOf = (id: EventId) => EVENTS.find((e) => e.id === id)!.short;
  const labelOf = (id: EventId) => EVENTS.find((e) => e.id === id)!.label;

  const placeInSlot = (slotIndex: number) => {
    if (!selected) return;
    const nextSlots = [...slots];
    const displaced = nextSlots[slotIndex];
    nextSlots[slotIndex] = selected;
    setSlots(nextSlots);
    setPool((p) => {
      const without = p.filter((id) => id !== selected);
      return displaced ? [...without, displaced] : without;
    });
    setSelected(null);
    setError(false);
  };

  const returnToPool = (slotIndex: number) => {
    const id = slots[slotIndex];
    if (!id) return;
    const nextSlots = [...slots];
    nextSlots[slotIndex] = null;
    setSlots(nextSlots);
    setPool((p) => [...p, id]);
    setError(false);
  };

  if (done) {
    return (
      <PuzzleShell
        title="Session"
        accent="slate"
        onClose={onClose}
        footer={
          <PuzzlePrimaryButton accent="slate" onClick={onSolved}>
            CONTINUE
          </PuzzlePrimaryButton>
        }
      >
        <div className="text-center space-y-2 py-3">
          <p className="text-emerald-300 font-semibold tracking-widest text-sm">RECONSTRUCTED</p>
          <p className="text-xs text-slate-400">One session before the change</p>
          <p className="text-xs text-slate-400">One after · ended with Verma</p>
        </div>
      </PuzzleShell>
    );
  }

  return (
    <PuzzleShell
      title="Session"
      accent="slate"
      onClose={onClose}
      maxWidth="max-w-xl"
      tabs={[
        {
          id: "timeline",
          label: "Timeline",
          content: (
            <div className="space-y-1.5">
              {SLOTS.map((time, i) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => (slots[i] ? returnToPool(i) : placeInSlot(i))}
                  className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left hover:bg-white/[0.06] transition"
                >
                  <span className="font-mono text-sm text-cyan-300 w-12 shrink-0">{time}</span>
                  <span className="font-mono text-[11px] text-slate-200 flex-1 truncate">
                    {slots[i] ? shortOf(slots[i]!) : "—"}
                  </span>
                </button>
              ))}
              {error && <p className="text-xs text-rose-400 text-center">Does not match evidence</p>}
            </div>
          ),
        },
        {
          id: "events",
          label: "Events",
          content: (
            <div className="flex flex-wrap gap-2">
              {pool.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelected(id === selected ? null : id)}
                  className={`rounded-xl border px-3 py-2 font-mono text-[11px] transition ${
                    selected === id
                      ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-100"
                      : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {labelOf(id)}
                </button>
              ))}
              {pool.length === 0 && (
                <p className="text-xs text-slate-500 w-full text-center py-6">All placed · switch to Timeline</p>
              )}
              {selected && (
                <p className="w-full text-[10px] text-center text-slate-500 pt-2">
                  Selected · tap a time slot
                </p>
              )}
            </div>
          ),
        },
      ]}
      footer={
        <PuzzlePrimaryButton
          accent="slate"
          disabled={slots.some((s) => s === null)}
          onClick={() => {
            if (slots.every((id, i) => id === SOLUTION[i])) setDone(true);
            else setError(true);
          }}
        >
          SUBMIT
        </PuzzlePrimaryButton>
      }
    />
  );
}
