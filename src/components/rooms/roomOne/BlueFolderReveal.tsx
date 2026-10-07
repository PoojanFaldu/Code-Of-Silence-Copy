interface BlueFolderRevealProps {
  onClose: () => void;
  onComplete: () => void;
}

const NAMES = ["ARJUN MEHTA", "NEHA RAO", "KIRAN DESAI", "NEHA RAO", "SAMIR PATEL", "NEHA RAO"];

export default function BlueFolderReveal({ onClose, onComplete }: BlueFolderRevealProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-xl border border-blue-500/35 bg-[#0a1220] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-blue-200">Blue Folder</h2>
            <p className="text-xs text-slate-400 mt-1">Case notes · Research-data manipulation</p>
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
              Confidential · Internal Investigation
            </p>
            <h3 className="text-base font-semibold text-blue-50 mb-2">
              Suspected Research-Data Manipulation
            </h3>
            <p className="text-sm leading-relaxed text-slate-300">
              Dr. Verma had been quietly auditing lab datasets. Several entries show inconsistent
              timestamps and overwritten trial logs. No formal accusation is attached — only a short
              list of persons of interest who accessed the altered files.
            </p>

            <div className="mt-5 space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">Referenced names</p>
              <ul className="space-y-1.5">
                {NAMES.map((name, idx) => {
                  const isNeha = name === "NEHA RAO";
                  return (
                    <li
                      key={`${name}-${idx}`}
                      className={`rounded px-3 py-2 font-mono text-sm ${
                        isNeha
                          ? "bg-rose-500/15 border border-rose-400/40 text-rose-200 font-semibold"
                          : "bg-white/5 border border-white/10 text-slate-300"
                      }`}
                    >
                      {name}
                      {isNeha && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-rose-300/80">
                          repeated
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="mt-5 text-sm text-amber-200/90 border-t border-white/10 pt-4">
              One name appears repeatedly: <strong className="text-rose-300">NEHA RAO</strong>.
              You have a reason to suspect her — but not yet why.
            </p>
          </div>

          <button
            onClick={onComplete}
            className="w-full rounded-md bg-blue-500/20 border border-blue-400/40 px-4 py-3 text-sm font-medium text-blue-100 hover:bg-blue-500/30"
          >
            Log Clue & Continue Investigation
          </button>
        </div>
      </div>
    </div>
  );
}
