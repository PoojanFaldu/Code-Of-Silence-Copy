import { useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { useGame } from "@/contexts/GameContext";

interface SessionIdentificationPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

type UserId = "arjun" | "neha" | "karan";

/** Partial badge on the unknown row — player must finish the chain. */
const TARGET_BADGE = "2290";

const LOG_ROWS = [
  {
    time: "21:03",
    user: "A. MEHTA",
    terminal: "LAB-02",
    session: "A91C",
    auth: "4412",
    highlight: false,
  },
  {
    time: "21:29",
    user: "N. RAO",
    terminal: "ARC-01",
    session: "C42E",
    auth: "8801",
    highlight: false,
  },
  {
    time: "21:36",
    user: "UNKNOWN",
    terminal: "SRV-03",
    session: "7F2A",
    auth: TARGET_BADGE,
    highlight: true,
  },
];

/**
 * Badge IDs only — names omitted.
 * 2290 owns SRV-03; 4412 is a distractor with secondary server access.
 * Karan is on NET-01 only.
 */
const ACL_ROWS = [
  { terminal: "LAB-02", badges: ["4412"] },
  { terminal: "ARC-01", badges: ["8801"] },
  { terminal: "SRV-03", badges: ["2290", "4412"] },
  { terminal: "NET-01", badges: ["3371"] },
];

/** Neha holds both archive (8801) and server (2290) badges — match AUTH, not the named log alone. */
const REGISTRY = [
  { badge: "4412", name: "DR. ARJUN MEHTA", role: "RESEARCH" },
  { badge: "8801", name: "NEHA RAO", role: "ARCHIVES" },
  { badge: "2290", name: "NEHA RAO", role: "SERVER" },
  { badge: "3371", name: "KARAN PATEL", role: "NETWORK" },
];

const CHOICES: { id: UserId; label: string }[] = [
  { id: "arjun", label: "DR. ARJUN MEHTA" },
  { id: "neha", label: "NEHA RAO" },
  { id: "karan", label: "KARAN PATEL" },
];

export default function SessionIdentificationPuzzle({
  onSolved,
  onClose,
}: SessionIdentificationPuzzleProps) {
  const { penalizeWrongAnswer } = useGame();
  const [selected, setSelected] = useState<UserId | null>(null);
  const [badgeInput, setBadgeInput] = useState("");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  const verify = () => {
    const badge = badgeInput.replace(/\D/g, "");
    if (badge === TARGET_BADGE && selected === "neha") {
      setError(false);
      setDone(true);
      return;
    }
    setError(true);
    penalizeWrongAnswer();
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
        <div className="space-y-3 py-2 text-center">
          <p className="text-sm font-semibold tracking-[0.2em] text-emerald-300">SESSION VERIFIED</p>
          <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-4 font-mono text-xs text-slate-200 space-y-1.5">
            <p>N. RAO</p>
            <p className="text-slate-400">SRV-03</p>
            <p className="text-cyan-300">21:36</p>
          </div>
        </div>
      </PuzzleShell>
    );
  }

  return (
    <PuzzleShell
      title="Session"
      accent="slate"
      onClose={onClose}
      maxWidth="max-w-lg"
      tabs={[
        {
          id: "log",
          label: "Log",
          content: (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 px-0.5">
                Server log — auth field truncated
              </p>
              {LOG_ROWS.map((row) => (
                <div
                  key={row.session}
                  className={`rounded-xl border px-3 py-2.5 font-mono text-[11px] sm:text-xs space-y-0.5 ${
                    row.highlight
                      ? "border-amber-500/30 bg-amber-500/[0.06]"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-cyan-300">{row.time}</span>
                    <span className="text-slate-500">SESSION {row.session}</span>
                  </div>
                  <div className="flex justify-between gap-2 text-slate-200">
                    <span>{row.user}</span>
                    <span className="text-slate-400">{row.terminal}</span>
                  </div>
                  <p className={row.highlight ? "text-amber-300/90" : "text-slate-500"}>
                    AUTH ····{row.auth}
                  </p>
                </div>
              ))}
            </div>
          ),
        },
        {
          id: "acl",
          label: "ACL",
          content: (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 px-0.5">
                Terminal ACL — badge IDs only
              </p>
              {ACL_ROWS.map((row) => (
                <div
                  key={row.terminal}
                  className={`rounded-xl border px-3 py-2.5 font-mono text-[11px] sm:text-xs ${
                    row.terminal === "SRV-03"
                      ? "border-amber-500/25 bg-amber-500/[0.04]"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-200">{row.terminal}</span>
                    <span className="text-cyan-300/90">{row.badges.join(" · ")}</span>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-slate-500 px-0.5 pt-1">
                Multiple badges may share a node. Match the session AUTH, not the ACL alone.
              </p>
            </div>
          ),
        },
        {
          id: "registry",
          label: "IDs",
          content: (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 px-0.5">
                Badge registry
              </p>
              {REGISTRY.map((row) => (
                <div
                  key={row.badge}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 font-mono text-[11px] sm:text-xs"
                >
                  <div className="flex justify-between gap-2 text-slate-200">
                    <span className="text-cyan-300">{row.badge}</span>
                    <span className="text-slate-500">{row.role}</span>
                  </div>
                  <p className="text-slate-300 mt-0.5">{row.name}</p>
                </div>
              ))}
            </div>
          ),
        },
      ]}
      footer={
        <div className="space-y-2">
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">
              Unknown session AUTH (last 4)
            </span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={badgeInput}
              onChange={(e) => {
                setBadgeInput(e.target.value.replace(/\D/g, "").slice(0, 4));
                setError(false);
              }}
              placeholder="····"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-sm tracking-[0.35em] text-cyan-100 placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
            />
          </label>
          <div className="space-y-1.5">
            {CHOICES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelected(c.id);
                  setError(false);
                }}
                className={`w-full rounded-xl border px-3 py-2.5 font-mono text-xs tracking-wider transition ${
                  selected === c.id
                    ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-50"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          {error && (
            <p className="text-center text-xs tracking-widest text-rose-400">SESSION MISMATCH</p>
          )}
          <PuzzlePrimaryButton
            accent="slate"
            onClick={verify}
            disabled={!selected || badgeInput.length < 4}
          >
            VERIFY
          </PuzzlePrimaryButton>
        </div>
      }
    />
  );
}
