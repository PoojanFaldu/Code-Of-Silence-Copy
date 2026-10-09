import { useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";

interface SecurityCabinetPuzzleProps {
  onClose: () => void;
  onComplete: () => void;
}

type BadgeId = "A-17" | "B-04" | "C-22" | "D-09";
type StaffId = "arjun" | "neha" | "karan" | "rohan";

const BADGES: BadgeId[] = ["A-17", "B-04", "C-22", "D-09"];

const STAFF: { id: StaffId; name: string }[] = [
  { id: "arjun", name: "Dr. Arjun Mehta" },
  { id: "neha", name: "Neha Rao" },
  { id: "karan", name: "Karan Patel" },
  { id: "rohan", name: "Rohan Desai" },
];

const SOLUTION: Record<StaffId, BadgeId> = {
  arjun: "A-17",
  neha: "B-04",
  karan: "C-22",
  rohan: "D-09",
};

type Assignments = Partial<Record<StaffId, BadgeId>>;

export default function SecurityCabinetPuzzle({
  onClose,
  onComplete,
}: SecurityCabinetPuzzleProps) {
  const [assignments, setAssignments] = useState<Assignments>({});
  const [dragBadge, setDragBadge] = useState<BadgeId | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeId | null>(null);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  const usedBadges = new Set(Object.values(assignments));
  const pool = BADGES.filter((b) => !usedBadges.has(b));

  const clearStaff = (staff: StaffId) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[staff];
      return next;
    });
    setError(false);
  };

  const placeBadge = (staff: StaffId, badge: BadgeId) => {
    setAssignments((prev) => {
      const next = { ...prev };
      (Object.keys(next) as StaffId[]).forEach((id) => {
        if (next[id] === badge) delete next[id];
      });
      next[staff] = badge;
      return next;
    });
    setSelectedBadge(null);
    setDragBadge(null);
    setError(false);
  };

  const onDropStaff = (staff: StaffId) => {
    const badge = dragBadge ?? selectedBadge;
    if (!badge) return;
    placeBadge(staff, badge);
  };

  const check = () => {
    const ok = STAFF.every((s) => assignments[s.id] === SOLUTION[s.id]);
    if (!ok) {
      setError(true);
      return;
    }
    setError(false);
    setDone(true);
  };

  if (done) {
    return (
      <PuzzleShell
        title="Security Cabinet"
        accent="slate"
        onClose={onClose}
        footer={
          <PuzzlePrimaryButton accent="slate" onClick={onComplete}>
            CONTINUE
          </PuzzlePrimaryButton>
        }
      >
        <div className="space-y-4 py-1 font-mono text-xs sm:text-sm">
          <p className="text-center text-sm font-semibold tracking-[0.2em] text-emerald-300">
            BADGE ASSIGNMENT VERIFIED
          </p>
          <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-4 space-y-2 text-slate-200">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Badge C-22</p>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">OWNER</span>
              <span className="text-cyan-200">Karan Patel</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">ACCESS</span>
              <span>Technical</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">AUTHORIZED AREA</span>
              <span className="text-amber-200/90">Network Room</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed text-center">
            Badge C-22 was recovered near the Network Room.
          </p>
        </div>
      </PuzzleShell>
    );
  }

  const allFilled = STAFF.every((s) => Boolean(assignments[s.id]));

  return (
    <PuzzleShell
      title="Security Cabinet"
      accent="slate"
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <div className="space-y-2">
          {error && (
            <p className="text-center text-xs text-rose-400 tracking-wider">
              BADGE ASSIGNMENT INCORRECT
              <br />
              <span className="text-slate-500">Review the staff records.</span>
            </p>
          )}
          <PuzzlePrimaryButton accent="slate" onClick={check} disabled={!allFilled}>
            SUBMIT
          </PuzzlePrimaryButton>
        </div>
      }
    >
      <div className="space-y-4 font-mono text-xs sm:text-sm">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">
          Four staff badges were recovered near the laboratory.
        </p>

        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Staff record</p>
          <p>• Only one badge belongs to a doctor — that badge letter is first in the alphabet.</p>
          <p>• Neha Rao holds the badge with the smallest number.</p>
          <p>• Rohan Desai&apos;s badge letter comes after everyone else&apos;s.</p>
          <p>• Karan Patel&apos;s badge number is greater than 20.</p>
          <p>• Dr. Arjun Mehta&apos;s letter comes immediately before Neha Rao&apos;s.</p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Badges</p>
          <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
            {pool.map((badge) => (
              <button
                key={badge}
                type="button"
                draggable
                onDragStart={() => {
                  setDragBadge(badge);
                  setSelectedBadge(badge);
                }}
                onDragEnd={() => setDragBadge(null)}
                onClick={() => setSelectedBadge((prev) => (prev === badge ? null : badge))}
                className={`rounded-lg border px-3 py-2 text-sm tracking-wider transition cursor-grab active:cursor-grabbing ${
                  selectedBadge === badge
                    ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-100"
                    : "border-white/15 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                }`}
              >
                {badge}
              </button>
            ))}
            {pool.length === 0 && (
              <p className="text-[11px] text-slate-600">All badges placed — drag off a slot to free one.</p>
            )}
          </div>
          {selectedBadge && (
            <p className="mt-1.5 text-[10px] text-cyan-300/80">
              Selected {selectedBadge} — click a name slot to place
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Assign badges</p>
          {STAFF.map((s) => {
            const badge = assignments[s.id];
            return (
              <div
                key={s.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onDropStaff(s.id);
                }}
                onClick={() => {
                  if (selectedBadge) {
                    placeBadge(s.id, selectedBadge);
                    return;
                  }
                  if (badge) {
                    setSelectedBadge(badge);
                    clearStaff(s.id);
                  }
                }}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 transition ${
                  dragBadge || selectedBadge
                    ? "border-cyan-500/30 bg-cyan-950/20"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <span className="text-slate-200">{s.name}</span>
                {badge ? (
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setDragBadge(badge);
                      setSelectedBadge(badge);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBadge(badge);
                      clearStaff(s.id);
                    }}
                    className="rounded-md border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-1 text-cyan-100 tracking-wider cursor-grab"
                  >
                    {badge}
                  </button>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-slate-600">Drop badge</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PuzzleShell>
  );
}
