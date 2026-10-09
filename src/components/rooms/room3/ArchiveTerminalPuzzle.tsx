import { useEffect, useRef, useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { playKeyClick, playMaskAlignSnap } from "./audio";
import { useGame } from "@/contexts/GameContext";
import { formatMissionTime } from "@/components/common/GlobalTimer";
import { AlertTriangle, Clock, Lock, Lightbulb, X } from "lucide-react";
import { toast } from "sonner";

interface ArchiveTerminalPuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  onSolved: () => void;
  onProceedToServerRoom?: () => void;
  initialSolved?: boolean;
}

const TERM_FONT =
  'ui-monospace, "JetBrains Mono", "Fira Code", "Courier New", monospace';

type Line = { kind: "cmd" | "out" | "err" | "sys"; text: string };

type Phase = "shell" | "ask_file" | "ask_researcher";

const FILES = ["research.txt", "results.txt", "backup.txt", "notes.txt"] as const;
const PENALTY_SECONDS = 300; // 5 minutes deduction

function normalizeName(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^dr\s+/, "")
    .trim();
}

function isArjun(raw: string) {
  const s = normalizeName(raw);
  return s === "arjun" || s === "mehta" || s === "arjun mehta" || s === "mehta arjun";
}

function isResultsFile(raw: string) {
  const s = raw.trim().toLowerCase().replace(/['"]/g, "");
  return s === "results.txt" || s === "results";
}

export const ArchiveTerminalPuzzle = ({
  isOpen,
  onClose,
  onSolved,
  onProceedToServerRoom,
  initialSolved = false,
}: ArchiveTerminalPuzzleProps) => {
  const { deductTime, timeRemaining } = useGame();
  const estimatedNewTime = Math.max(0, timeRemaining - PENALTY_SECONDS);

  const [done, setDone] = useState(initialSolved);
  const [hintUnlocked, setHintUnlocked] = useState(false);
  const [showHintConfirm, setShowHintConfirm] = useState(false);
  const [showHintBanner, setShowHintBanner] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.removeItem("room3_terminal_hint_unlocked");
    } catch {
      /* ignore */
    }
  }, []);

  const [lines, setLines] = useState<Line[]>([
    { kind: "sys", text: "ARCHIVE TERMINAL v1.4" },
    { kind: "sys", text: 'Type "help" for available commands, or "hint" for clues (-5:00 penalty).' },
    { kind: "sys", text: "" },
  ]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("shell");
  const [sawCheckResults, setSawCheckResults] = useState(false);
  const [sawCheckBackup, setSawCheckBackup] = useState(false);
  const [sawNotes, setSawNotes] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [isOpen, done, phase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, phase]);

  if (!isOpen) return null;

  const push = (...next: Line[]) => setLines((prev) => [...prev, ...next]);

  const markSolved = () => {
    playMaskAlignSnap();
    setDone(true);
    onSolved();
    try {
      sessionStorage.setItem("room3_puzzle6_solved", "true");
    } catch {
      /* ignore */
    }
  };

  const handleConfirmHint = () => {
    deductTime(PENALTY_SECONDS);
    setHintUnlocked(true);
    setShowHintConfirm(false);
    setShowHintBanner(true);
    toast.error("−5:00 deducted from mission timer for Hint.");
    push(
      { kind: "sys", text: "--- HINT PROTOCOL UNLOCKED (-5:00 DEDUCTED) ---" },
      { kind: "out", text: "1. Read notes: cat notes.txt -> Assigned researcher: Dr. Arjun Mehta" },
      { kind: "out", text: "2. Check files: check results.txt (modified!) & check backup.txt (original)" },
      { kind: "out", text: "3. Run 'conclude' -> Which file was altered? results.txt -> Who was assigned? Arjun Mehta" },
      { kind: "sys", text: "------------------------------------------------" },
      { kind: "out", text: "" }
    );
  };

  const runShell = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    push({ kind: "cmd", text: `> ${trimmed}` });

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ").trim().toLowerCase();

    if (cmd === "help") {
      push(
        { kind: "out", text: "AVAILABLE COMMANDS" },
        { kind: "out", text: "  ls" },
        { kind: "out", text: "  cat <filename>" },
        { kind: "out", text: "  check <filename>" },
        { kind: "out", text: "  conclude" },
        { kind: "out", text: "  hint (-5:00 penalty on first use)" },
        { kind: "out", text: "  clear" },
        { kind: "out", text: "  help" },
        { kind: "out", text: "" }
      );
      return;
    }

    if (cmd === "hint") {
      if (hintUnlocked) {
        setShowHintBanner(true);
        push(
          { kind: "sys", text: "--- ARCHIVE TERMINAL HINTS ---" },
          { kind: "out", text: "1. cat notes.txt -> Assigned researcher: Dr. Arjun Mehta" },
          { kind: "out", text: "2. check results.txt & check backup.txt -> results.txt was modified" },
          { kind: "out", text: "3. conclude -> Answer 'results.txt', then 'Arjun Mehta'" },
          { kind: "sys", text: "------------------------------" },
          { kind: "out", text: "" }
        );
      } else {
        setShowHintConfirm(true);
        push(
          { kind: "sys", text: "HINT PROTOCOL: Accessing hints deducts 5 minutes (-5:00) from mission timer." },
          { kind: "out", text: "Please confirm using the dialog to proceed." },
          { kind: "out", text: "" }
        );
      }
      return;
    }

    if (cmd === "clear") {
      setLines([
        { kind: "sys", text: "ARCHIVE TERMINAL v1.4" },
        { kind: "sys", text: 'Type "help" for available commands.' },
        { kind: "sys", text: "" },
      ]);
      return;
    }

    if (cmd === "ls") {
      push(
        ...FILES.map((f) => ({ kind: "out" as const, text: f })),
        { kind: "out", text: "" }
      );
      return;
    }

    if (cmd === "cat") {
      if (!arg) {
        push({ kind: "err", text: "Usage: cat <filename>" }, { kind: "out", text: "" });
        return;
      }
      if (arg === "research.txt") {
        push(
          { kind: "out", text: "EXPERIMENT 17" },
          { kind: "out", text: "" },
          { kind: "out", text: "Expected result: 84.2%" },
          { kind: "out", text: "Recorded result: 91.7%" },
          { kind: "out", text: "" },
          { kind: "out", text: "WARNING:" },
          { kind: "out", text: "This result does not match the original research notes." },
          { kind: "out", text: "" }
        );
        return;
      }
      if (arg === "results.txt") {
        push(
          { kind: "out", text: "EXPERIMENT 17 RESULTS" },
          { kind: "out", text: "" },
          { kind: "out", text: "Recorded result: 91.7%" },
          { kind: "out", text: "Source: live record" },
          { kind: "out", text: "" }
        );
        return;
      }
      if (arg === "backup.txt") {
        push(
          { kind: "out", text: "EXPERIMENT 17 BACKUP" },
          { kind: "out", text: "" },
          { kind: "out", text: "Expected result: 84.2%" },
          { kind: "out", text: "Recorded result: 84.2%" },
          { kind: "out", text: "" },
          { kind: "out", text: "STATUS: ORIGINAL" },
          { kind: "out", text: "" }
        );
        return;
      }
      if (arg === "notes.txt") {
        setSawNotes(true);
        push(
          { kind: "out", text: "EXPERIMENT 17 NOTES" },
          { kind: "out", text: "" },
          { kind: "out", text: "Only the researcher assigned to Experiment 17" },
          { kind: "out", text: "was allowed to update the result." },
          { kind: "out", text: "" },
          { kind: "out", text: "Assigned researcher:" },
          { kind: "out", text: "Dr. Arjun Mehta" },
          { kind: "out", text: "" }
        );
        return;
      }
      push({ kind: "err", text: `No such file: ${arg}` }, { kind: "out", text: "" });
      return;
    }

    if (cmd === "check") {
      if (!arg) {
        push({ kind: "err", text: "Usage: check <filename>" }, { kind: "out", text: "" });
        return;
      }
      if (arg === "results.txt") {
        setSawCheckResults(true);
        push(
          { kind: "out", text: "FILE CHECK" },
          { kind: "out", text: "" },
          { kind: "out", text: "results.txt" },
          { kind: "out", text: "" },
          { kind: "out", text: "Expected: 84.2%" },
          { kind: "out", text: "Found:    91.7%" },
          { kind: "out", text: "" },
          { kind: "err", text: "ERROR:" },
          { kind: "err", text: "FILE DOES NOT MATCH ORIGINAL" },
          { kind: "out", text: "" }
        );
        return;
      }
      if (arg === "backup.txt") {
        setSawCheckBackup(true);
        push(
          { kind: "out", text: "FILE CHECK" },
          { kind: "out", text: "" },
          { kind: "out", text: "backup.txt" },
          { kind: "out", text: "" },
          { kind: "out", text: "STATUS: ORIGINAL" },
          { kind: "out", text: "" }
        );
        return;
      }
      if (arg === "research.txt" || arg === "notes.txt") {
        push(
          { kind: "out", text: "FILE CHECK" },
          { kind: "out", text: "" },
          { kind: "out", text: arg },
          { kind: "out", text: "" },
          { kind: "out", text: "STATUS: REFERENCE ONLY" },
          { kind: "out", text: "Use check on results.txt or backup.txt." },
          { kind: "out", text: "" }
        );
        return;
      }
      push({ kind: "err", text: `No such file: ${arg}` }, { kind: "out", text: "" });
      return;
    }

    if (cmd === "conclude") {
      if (!(sawCheckResults && sawCheckBackup && sawNotes)) {
        push(
          { kind: "err", text: "Investigation incomplete." },
          { kind: "out", text: "Inspect the files, then check results and backup." },
          { kind: "out", text: "Read notes.txt before concluding." },
          { kind: "out", text: "" }
        );
        return;
      }
      push(
        { kind: "sys", text: "CONCLUSION PROTOCOL" },
        { kind: "sys", text: "Which file was altered?" },
        { kind: "out", text: "" }
      );
      setPhase("ask_file");
      return;
    }

    push(
      { kind: "err", text: "Unknown command." },
      { kind: "out", text: 'Type "help" to view available commands.' },
      { kind: "out", text: "" }
    );
  };

  const submit = () => {
    const value = input;
    setInput("");
    playKeyClick();

    if (phase === "ask_file") {
      push({ kind: "cmd", text: `> ${value}` });
      if (isResultsFile(value)) {
        push(
          { kind: "sys", text: "Who was assigned to Experiment 17?" },
          { kind: "out", text: "" }
        );
        setPhase("ask_researcher");
      } else {
        push(
          { kind: "err", text: "Incorrect file." },
          { kind: "sys", text: "Which file was altered?" },
          { kind: "out", text: "" }
        );
      }
      return;
    }

    if (phase === "ask_researcher") {
      push({ kind: "cmd", text: `> ${value}` });
      if (isArjun(value)) {
        push(
          { kind: "sys", text: "RECORD LOGGED." },
          { kind: "sys", text: "results.txt does not match original." },
          { kind: "sys", text: "Assigned researcher: Dr. Arjun Mehta" },
          { kind: "out", text: "" }
        );
        setPhase("shell");
        markSolved();
      } else {
        push(
          { kind: "err", text: "Incorrect name." },
          { kind: "sys", text: "Who was assigned to Experiment 17?" },
          { kind: "out", text: "" }
        );
      }
      return;
    }

    runShell(value);
  };

  if (done) {
    return (
      <PuzzleShell
        title="Archive"
        accent="indigo"
        onClose={onClose}
        footer={
          <PuzzlePrimaryButton
            accent="indigo"
            onClick={() => {
              playKeyClick();
              onClose();
              onProceedToServerRoom?.();
            }}
          >
            CONTINUE
          </PuzzlePrimaryButton>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-center text-sm font-semibold tracking-[0.2em] text-indigo-200">
            ARCHIVE RECOVERED
          </p>
          <div
            className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-xs text-slate-200 space-y-2"
            style={{ fontFamily: TERM_FONT }}
          >
            <p>results.txt — does not match original (91.7% vs 84.2%)</p>
            <p>backup.txt — STATUS: ORIGINAL</p>
            <p className="text-indigo-200">Assigned researcher: Dr. Arjun Mehta</p>
          </div>
          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            Experiment 17 data was altered. Baseline updates required the assigned researcher.
          </p>
        </div>
      </PuzzleShell>
    );
  }

  const promptLabel =
    phase === "ask_file" ? "file >" : phase === "ask_researcher" ? "name >" : ">";

  return (
    <>
      <PuzzleShell title="Archive" accent="indigo" onClose={onClose} maxWidth="max-w-xl">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div
              className="flex flex-wrap gap-x-3 gap-y-1 rounded-lg border border-indigo-500/20 bg-indigo-950/20 px-3 py-2 text-[10px] uppercase tracking-wider text-indigo-200/80 flex-1"
              style={{ fontFamily: TERM_FONT }}
            >
              <span className="text-slate-500 normal-case tracking-normal">Available:</span>
              <span>ls</span>
              <span>cat &lt;file&gt;</span>
              <span>check &lt;file&gt;</span>
              <span>conclude</span>
              <span>hint</span>
              <span>help</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (hintUnlocked) {
                  setShowHintBanner((prev) => !prev);
                } else {
                  setShowHintConfirm(true);
                }
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                hintUnlocked
                  ? "border-amber-400/50 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 shadow-sm shadow-amber-950/40"
              }`}
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              <span>{hintUnlocked ? (showHintBanner ? "Hide Hint" : "Show Hint") : "Hint (-5:00)"}</span>
            </button>
          </div>

          {hintUnlocked && showHintBanner && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-100/90 space-y-1.5 font-mono shadow-inner animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  <span>Archive Clues</span>
                </div>
                <span className="text-[10px] text-amber-400/80 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  -5:00 APPLIED
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-200 text-[11px] leading-relaxed">
                <li>
                  Run <span className="text-emerald-300 font-semibold">cat notes.txt</span> to find the assigned researcher (
                  <strong>Dr. Arjun Mehta</strong>).
                </li>
                <li>
                  Run <span className="text-emerald-300 font-semibold">check results.txt</span> and{" "}
                  <span className="text-emerald-300 font-semibold">check backup.txt</span> to discover that{" "}
                  <strong>results.txt</strong> was modified.
                </li>
                <li>
                  Run <span className="text-emerald-300 font-semibold">conclude</span> &rarr; answer{" "}
                  <span className="text-amber-300 font-bold">results.txt</span> &rarr; answer{" "}
                  <span className="text-amber-300 font-bold">Arjun Mehta</span>.
                </li>
              </ul>
            </div>
          )}

          <div
            className="relative h-[min(52vh,420px)] overflow-y-auto rounded-xl border border-white/10 bg-[#05070b] px-3 py-3 shadow-inner"
            style={{ fontFamily: TERM_FONT }}
            onClick={() => inputRef.current?.focus()}
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.35)_3px)]" />
            <div className="relative space-y-0.5 text-[12px] sm:text-[13px] leading-relaxed">
              {lines.map((line, i) => (
                <pre
                  key={`${i}-${line.text.slice(0, 12)}`}
                  className={`whitespace-pre-wrap break-words ${
                    line.kind === "cmd"
                      ? "text-emerald-300/90"
                      : line.kind === "err"
                        ? "text-rose-300/90"
                        : line.kind === "sys"
                          ? "text-indigo-200/85"
                          : "text-slate-300"
                  }`}
                >
                  {line.text || " "}
                </pre>
              ))}
              <form
                className="flex items-center gap-2 pt-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <span className="shrink-0 text-emerald-400/90">{promptLabel}</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-emerald-100 caret-emerald-300 outline-none"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Terminal command"
                />
                <span className="inline-block h-4 w-2 animate-pulse bg-emerald-400/80" aria-hidden />
              </form>
              <div ref={bottomRef} />
            </div>
          </div>
        </div>
      </PuzzleShell>

      {/* Confirmation Modal */}
      {showHintConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-md rounded-2xl border border-amber-500/50 bg-[#0c1017] p-5 sm:p-6 shadow-2xl shadow-amber-950/50"
            style={{ fontFamily: TERM_FONT }}
          >
            <button
              type="button"
              onClick={() => setShowHintConfirm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider text-amber-200">
                  Time Penalty Warning
                </h3>
                <p className="text-xs text-amber-400/80">ARCHIVE TERMINAL HINT</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/60 p-4 mb-4 space-y-2.5">
              <p className="text-sm font-semibold text-white leading-snug">
                5 minutes will be deducted from your mission timer to unlock this hint.
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Unlocking the hint reveals the step-by-step commands to solve the archive terminal verification protocol.
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Current Time:
                </span>
                <span className="text-cyan-300 font-bold">
                  {formatMissionTime(timeRemaining)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-400 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-red-400" /> After -5:00 Penalty:
                </span>
                <span className="text-red-400 font-bold">
                  {formatMissionTime(estimatedNewTime)}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowHintConfirm(false)}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmHint}
                className="flex-1 rounded-xl border border-amber-500/50 bg-amber-500/20 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-500/30 hover:border-amber-400 shadow-lg shadow-amber-950/40 transition cursor-pointer"
              >
                Confirm (-5 Mins)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ArchiveTerminalPuzzle;
