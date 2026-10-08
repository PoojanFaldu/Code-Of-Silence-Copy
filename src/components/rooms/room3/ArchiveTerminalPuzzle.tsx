import { useEffect, useRef, useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { playKeyClick, playMaskAlignSnap } from "./audio";

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
  const [done, setDone] = useState(initialSolved);
  const [lines, setLines] = useState<Line[]>([
    { kind: "sys", text: "ARCHIVE TERMINAL v1.4" },
    { kind: "sys", text: 'Type "help" for available commands.' },
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
        { kind: "out", text: "  clear" },
        { kind: "out", text: "  help" },
        { kind: "out", text: "" }
      );
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
    <PuzzleShell title="Archive" accent="indigo" onClose={onClose} maxWidth="max-w-xl">
      <div className="space-y-3">
        <div
          className="flex flex-wrap gap-x-3 gap-y-1 rounded-lg border border-indigo-500/20 bg-indigo-950/20 px-3 py-2 text-[10px] uppercase tracking-wider text-indigo-200/80"
          style={{ fontFamily: TERM_FONT }}
        >
          <span className="text-slate-500 normal-case tracking-normal">Available:</span>
          <span>ls</span>
          <span>cat &lt;file&gt;</span>
          <span>check &lt;file&gt;</span>
          <span>conclude</span>
          <span>help</span>
        </div>

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
  );
};

export default ArchiveTerminalPuzzle;
