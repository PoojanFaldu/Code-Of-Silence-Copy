import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";

interface BlueFolderRevealProps {
  onClose: () => void;
  onComplete: () => void;
}

const STAFF = [
  {
    name: "Dr. Arjun Mehta",
    role: "Researcher",
    note: "Assigned to Experiment 17 — only he may change its recorded result.",
  },
  {
    name: "Neha Rao",
    role: "Research assistant",
    note: "Has been looking into Professor Dev Verma's research records.",
  },
  {
    name: "Karan Patel",
    role: "Network technician",
    note: "Has access to restricted technical areas and lab equipment.",
  },
  {
    name: "Rohan Desai",
    role: "IT / Security admin",
    note: "Oversees security systems and CCTV infrastructure.",
  },
  {
    name: "Dr. Sameer Shah",
    role: "Research partner",
    note: "Collaborated with Professor Dev Verma. Recent disagreement over publication.",
  },
];

export default function BlueFolderReveal({ onClose, onComplete }: BlueFolderRevealProps) {
  return (
    <PuzzleShell
      title="File"
      accent="sky"
      onClose={onClose}
      tabs={[
        {
          id: "case",
          label: "Case",
          content: (
            <div className="space-y-3 font-mono text-xs sm:text-sm">
              <p className="text-[10px] uppercase tracking-[0.25em] text-sky-400/70">Office file</p>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-2 text-slate-300 leading-relaxed">
                <p>
                  Professor Dev Verma marked a problem in Experiment 17 and planned to settle it with
                  a colleague.
                </p>
                <p>
                  A separate personal note mentions a heated argument with Dr. Sameer Shah about a
                  publication.
                </p>
              </div>
            </div>
          ),
        },
        {
          id: "protocol",
          label: "Protocol",
          content: (
            <div className="space-y-3 font-mono text-xs sm:text-sm">
              <p className="text-[10px] uppercase tracking-[0.25em] text-sky-400/70">
                EXP-17 Baseline Control
              </p>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-2 text-slate-300 leading-relaxed">
                <p>Baseline revisions require authorization from the assigned researcher.</p>
                <div className="flex justify-between border-t border-white/10 pt-2 mt-2 gap-2">
                  <span className="text-slate-500 shrink-0">Assigned researcher</span>
                  <span className="text-sky-200 text-right">Dr. Arjun Mehta</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Protocol note only. Does not record who performed any specific write.
              </p>
            </div>
          ),
        },
        {
          id: "staff",
          label: "Staff",
          content: (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.25em] text-sky-400/70 mb-1">
                Persons of interest
              </p>
              {STAFF.map((s) => (
                <div
                  key={s.name}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 font-mono text-[11px] sm:text-xs"
                >
                  <div className="flex justify-between gap-2 text-slate-200">
                    <span>{s.name}</span>
                    <span className="text-slate-500 shrink-0">{s.role}</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">{s.note}</p>
                </div>
              ))}
            </div>
          ),
        },
      ]}
      footer={
        <PuzzlePrimaryButton accent="sky" onClick={onComplete}>
          CONTINUE
        </PuzzlePrimaryButton>
      }
    />
  );
}
