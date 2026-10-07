interface BlueFolderRevealProps {
  onClose: () => void;
  onComplete: () => void;
}

const RECORDS = [
  {
    name: "DR. ARJUN MEHTA",
    note: "Senior researcher. Ongoing dispute with Verma over research direction. Had baseline access to Experiment 17.",
    tag: null as string | null,
  },
  {
    name: "NEHA RAO",
    note: "Student researcher — Experimental Data Section. Listed on Trial Sets B & C.",
    tag: "repeated",
  },
  {
    name: "RIYA SHAH",
    note: "Research assistant. Access to documents and laboratory schedules. No anomalies flagged yet.",
    tag: null,
  },
  {
    name: "NEHA RAO",
    note: "Handwritten: \"Several inconsistencies found in submitted results. Discuss with Neha regarding recent modifications.\"",
    tag: "flagged",
  },
  {
    name: "KARAN PATEL",
    note: "Lab technician. Equipment maintenance access. Present during overnight runs — unclear relevance.",
    tag: null,
  },
  {
    name: "NEHA RAO",
    note: "Her initials appear beside overwritten trial logs. Verma circled the entry twice.",
    tag: "repeated",
  },
];

export default function BlueFolderReveal({ onClose, onComplete }: BlueFolderRevealProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-xl border border-blue-500/35 bg-[#0a1220] shadow-2xl overflow-hidden my-4">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-blue-200">Blue Folder</h2>
            <p className="text-xs text-slate-400 mt-1">Verma&apos;s private investigation notes</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-3 py-1 text-sm text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="rounded-lg border border-blue-400/25 bg-gradient-to-b from-blue-950/60 to-slate-950/80 p-5">
            <p className="text-[11px] uppercase tracking-[0.25em] text-blue-300/70 mb-3">
              Confidential · Research-data manipulation
            </p>
            <h3 className="text-base font-semibold text-blue-50 mb-2">Working File — Experiment Audit</h3>
            <p className="text-sm leading-relaxed text-slate-300">
              Professor Dev Verma had been quietly reviewing lab datasets. Results from{" "}
              <strong className="text-white">Experiment 17</strong> do not match the original baseline. Someone has
              been altering the research — but Verma had not named a culprit yet.
            </p>

            <div className="mt-5 space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Persons of interest</p>
              <ul className="space-y-1.5">
                {RECORDS.map((row, idx) => {
                  const highlight = row.tag !== null;
                  return (
                    <li
                      key={`${row.name}-${idx}`}
                      className={`rounded px-3 py-2 text-sm ${
                        highlight
                          ? "bg-rose-500/15 border border-rose-400/40 text-rose-100"
                          : "bg-white/5 border border-white/10 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-mono text-xs sm:text-sm">
                        <span className={highlight ? "font-semibold" : ""}>{row.name}</span>
                        {row.tag && (
                          <span className="text-[10px] uppercase tracking-wider text-rose-300/80">{row.tag}</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{row.note}</p>
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="mt-5 text-sm text-amber-200/90 border-t border-white/10 pt-4">
              <strong className="text-rose-300">NEHA RAO</strong> appears repeatedly. Verma was digging into her
              experimental data — and her recent modifications.
            </p>
            <p className="mt-2 text-sm text-slate-400 italic">
              Margin note in Verma&apos;s hand: &quot;Baseline mismatch on Exp. 17 — not only student runs. Trace
              earlier edits.&quot;
            </p>
            <p className="mt-3 text-sm text-sky-200/90">
              Next lead: the <strong className="text-white">Research Laboratory</strong>, where Experiment 17 data
              is stored.
            </p>
          </div>

          <button
            onClick={onComplete}
            className="w-full rounded-md bg-blue-500/20 border border-blue-400/40 px-4 py-3 text-sm font-medium text-blue-100 hover:bg-blue-500/30"
          >
            Log Clue — Continue to Research Lab
          </button>
        </div>
      </div>
    </div>
  );
}
