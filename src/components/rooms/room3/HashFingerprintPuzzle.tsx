import React, { useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { useGame } from "@/contexts/GameContext";
import {
  BookOpen,
  Check,
  Copy,
  X,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

interface HashFingerprintPuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  onSolved: () => void;
  onProceedToArchive?: () => void;
  /** @deprecated use onProceedToArchive */
  onProceedToOverlay?: () => void;
  onOpenNotebook?: () => void;
  initialSolved?: boolean;
}

export interface ArchiveFileRecord {
  id: string;
  name: string;
  type: string;
  size: string;
  terminalHash: string; // Hash displayed on the live terminal (First Popup)
  vermaHash: string; // Hash recorded in Dr. Verma's confidential letter (Second Popup)
  isModified: boolean;
  info: string;
  diffNote: string;
}

/**
 * 3 Master files with long cryptographic hashes.
 * All 3 files have distinct hashes on the terminal.
 * In Dr. Verma's letter:
 * - EXP17_TELEMETRY.dat matches exactly
 * - EXP17_SYNTHESIS.log matches exactly
 * - EXP17_FINAL_REPORT.enc has a subtle 1-character difference:
 *   Terminal: ...71B4... vs Verma's Letter: ...71D4... (B vs D in block 6)
 */
export const HASH_PUZZLE_FILES: ArchiveFileRecord[] = [
  {
    id: "telemetry",
    name: "EXP17_TELEMETRY.dat",
    type: "Sensor Telemetry Stream",
    size: "42.8 MB",
    terminalHash: "8F4B-92A1-C7D3-E05B-41F8-6A92-D38E-5C14",
    vermaHash: "8F4B-92A1-C7D3-E05B-41F8-6A92-D38E-5C14",
    isModified: false,
    info: "Continuous biosensor feeds and reaction chamber environmental logs from incubation unit 4.",
    diffNote: "Hashes match Dr. Verma's recorded digest identically (Unmodified).",
  },
  {
    id: "synthesis",
    name: "EXP17_SYNTHESIS.log",
    type: "Reagent Protocol Log",
    size: "18.4 MB",
    terminalHash: "3C7E-A59D-1F08-4B26-9E41-83D7-F602-B85A",
    vermaHash: "3C7E-A59D-1F08-4B26-9E41-83D7-F602-B85A",
    isModified: false,
    info: "Automated compound formulation, catalytic sequencing, and solvent purification telemetry.",
    diffNote: "Hashes match Dr. Verma's recorded digest identically (Unmodified).",
  },
  {
    id: "final",
    name: "EXP17_FINAL_REPORT.enc",
    type: "Master Anomaly Deposition",
    size: "128.6 MB",
    // Notice: Block 6 is 71B4 on the live terminal, but 71D4 in Dr. Verma's letter!
    terminalHash: "D26A-8B1E-F407-3C9A-5E82-71B4-9A3B-E605",
    vermaHash: "D26A-8B1E-F407-3C9A-5E82-71D4-9A3B-E605",
    isModified: true,
    info: "Dr. Verma's signed deposition documenting critical trial anomalies, chemical toxicity, and safety breaches.",
    diffNote: "Mismatch at Block 6: Live terminal shows 71B4 while Dr. Verma's letter recorded 71D4. Tampering detected!",
  },
];

/** Audio tones for high-tech clicks and success */
function playTone(freq: number, duration: number = 0.08) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio restriction
  }
}

export const HashFingerprintPuzzle: React.FC<HashFingerprintPuzzleProps> = ({
  isOpen,
  onClose,
  onSolved,
  onProceedToArchive,
  onProceedToOverlay,
  initialSolved = false,
}) => {
  const { penalizeWrongAnswer } = useGame();
  const proceed = onProceedToArchive ?? onProceedToOverlay;
  const [selectedId, setSelectedId] = useState<string | null>(initialSolved ? "final" : null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [solved, setSolved] = useState(initialSolved);

  // Second popup state: Dr. Verma's Letter
  const [isVermaLetterOpen, setIsVermaLetterOpen] = useState(false);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyHash = (text: string, id: string) => {
    playTone(740, 0.05);
    navigator.clipboard?.writeText(text);
    setCopiedHashId(id);
    toast.success("Cryptographic hash copied to clipboard!");
    setTimeout(() => setCopiedHashId(null), 2000);
  };

  const handleSelectFile = (id: string) => {
    if (solved) return;
    playTone(520, 0.05);
    setSelectedId(id);
    setErrorFeedback(null);
  };

  const handleSubmit = () => {
    if (!selectedId) {
      setErrorFeedback("Select the file you suspect has been modified.");
      return;
    }

    const selectedFile = HASH_PUZZLE_FILES.find((f) => f.id === selectedId);

    if (selectedFile?.isModified) {
      playTone(880, 0.25);
      setSolved(true);
      setErrorFeedback(null);
      toast.success("Integrity mismatch confirmed! EXP17_FINAL_REPORT.enc was modified.");
      onSolved();
    } else {
      playTone(280, 0.15);
      penalizeWrongAnswer();
      setErrorFeedback(
        `Integrity Verified: ${selectedFile?.name} matches Dr. Verma's recorded hash character-for-character. Inspect the remaining files.`
      );
    }
  };

  return (
    <>
      {/* =========================================================================
          FIRST POPUP: Main Archive Hash Terminal
          ========================================================================= */}
      <PuzzleShell
        title="Archive Terminal — File Integrity"
        accent="cyan"
        onClose={onClose}
        maxWidth="max-w-2xl"
        tabs={[
          {
            id: "terminal",
            label: "Terminal Files",
            content: (
              <div className="space-y-3.5">
                {/* Banner linking to Second Popup: Dr. Verma's Letter */}
                <div className="rounded-xl border border-amber-600/40 bg-gradient-to-r from-amber-950/40 to-black/70 p-3.5 flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/50 bg-amber-900/30 text-amber-300">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-amber-200">
                        Dr. Verma's Archival Letter
                      </h4>
                      <p className="text-[11px] text-amber-300/80 leading-tight">
                        Contains Dr. Verma's original recorded hashes for each file before his disappearance.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playTone(600, 0.06);
                      setIsVermaLetterOpen(true);
                    }}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-500/60 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold uppercase tracking-wider transition shadow-md shadow-amber-950/40"
                  >
                    <span>View Letter</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Subtitle / Objective */}
                <div className="px-1 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>LIVE ARCHIVE STORAGE • 3 MASTER VOLUMES</span>
                  <span className="text-cyan-400">SELECT THE TAMPERED FILE</span>
                </div>

                {/* List of 3 files on the live terminal */}
                <div className="space-y-2.5">
                  {HASH_PUZZLE_FILES.map((file, idx) => {
                    const isSelected = selectedId === file.id;
                    return (
                      <div
                        key={file.id}
                        onClick={() => handleSelectFile(file.id)}
                        className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer ${
                          isSelected
                            ? "border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-950/60"
                            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
                        }`}
                      >
                        {/* Header of file card */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-mono font-bold ${
                                isSelected
                                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-300"
                                  : "border-white/10 bg-white/5 text-slate-400"
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <div>
                              <span className="text-sm font-mono font-bold text-slate-100 group-hover:text-cyan-200 transition">
                                {file.name}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {file.type} • {file.size}
                              </span>
                            </div>
                          </div>

                          {/* Radio / Selection Indicator */}
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border transition ${
                              isSelected
                                ? "border-cyan-400/80 bg-cyan-400/20 text-cyan-200"
                                : "border-white/10 bg-black/40 text-slate-500 group-hover:text-slate-400"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="h-3 w-3 text-cyan-300" />
                                <span>Selected</span>
                              </>
                            ) : (
                              <span>Select File</span>
                            )}
                          </div>
                        </div>

                        {/* Live Terminal Computed Hash */}
                        <div className="rounded-lg border border-cyan-500/20 bg-black/75 px-3 py-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-[9px] uppercase font-mono tracking-widest text-cyan-400/70 shrink-0">
                              LIVE HASH:
                            </span>
                            <span className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-cyan-100 select-all truncate">
                              {file.terminalHash}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyHash(file.terminalHash, `terminal-${file.id}`);
                            }}
                            className="shrink-0 p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition"
                            title="Copy hash to clipboard"
                          >
                            {copiedHashId === `terminal-${file.id}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Feedback & Result Message */}
                {errorFeedback && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-200 font-mono flex items-start gap-2 animate-fade-in">
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorFeedback}</span>
                  </div>
                )}

                {solved && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-2.5 text-xs text-emerald-200 font-mono flex items-start gap-2 animate-fade-in">
                    <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-300 block mb-0.5">
                        TAMPERING VERIFIED: EXP17_FINAL_REPORT.enc
                      </strong>
                      Block 6 mismatch: Live terminal shows{" "}
                      <code className="text-rose-300 font-bold">71B4</code> whereas Dr. Verma's
                      letter recorded <code className="text-emerald-300 font-bold">71D4</code>.
                      Unauthorized alterations detected!
                    </div>
                  </div>
                )}
              </div>
            ),
          },
        ]}
        footer={
          !solved ? (
            <PuzzlePrimaryButton accent="cyan" onClick={handleSubmit} disabled={!selectedId}>
              CONFIRM MODIFIED FILE
            </PuzzlePrimaryButton>
          ) : (
            <PuzzlePrimaryButton
              accent="emerald"
              onClick={() => {
                onClose();
                proceed?.();
              }}
            >
              CONTINUE TO ARCHIVE COMPARISON
            </PuzzlePrimaryButton>
          )
        }
      />

      {/* =========================================================================
          SECOND POPUP: Dr. Verma's Confidential Letter & Recorded Hashes
          ========================================================================= */}
      {isVermaLetterOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto"
          onClick={() => setIsVermaLetterOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl my-auto rounded-2xl border border-amber-600/50 bg-gradient-to-b from-[#140e07] via-[#0b0805] to-black p-5 sm:p-6 shadow-2xl shadow-amber-950/70 text-amber-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-amber-700/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-900/40 border border-amber-600/50 text-amber-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 font-mono font-bold tracking-wider border border-amber-600/40">
                      CONFIDENTIAL RECORD
                    </span>
                    <span className="text-[10px] text-amber-400/80 font-mono">
                      REF: VRM-ARCHIVE-MEMO
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white font-serif mt-0.5">
                    Dr. Verma's Archival Letter
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsVermaLetterOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                aria-label="Close letter"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Letter Body & Directive */}
            <div className="mt-3.5 p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 font-serif text-xs sm:text-sm text-amber-200/90 leading-relaxed italic space-y-2">
              <p>
                "To whoever accesses this archive after me:
              </p>
              <p>
                I have compiled the authentic cryptographic checksums of the three master Project AEGIS
                files and stored them here. Do not trust whatever state is currently active on the
                primary terminal. If anyone has tampered with or rewritten the trial logs, even by a
                single byte, its hash will diverge from the numbers I have recorded below.
              </p>
              <p className="not-italic font-mono text-[11px] text-amber-400 font-bold">
                Compare each digest character-by-character against the terminal to locate the altered file."
              </p>
              <p className="text-right text-xs not-italic font-sans text-amber-300 font-semibold">
                — Dr. Ananya Verma, Lead Research Director
              </p>
            </div>

            {/* The 3 Files in Verma's Letter */}
            <div className="mt-4 space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
              {HASH_PUZZLE_FILES.map((file, idx) => (
                <div
                  key={`letter-${file.id}`}
                  className="rounded-xl border border-amber-800/40 bg-black/60 p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        [{idx + 1}] {file.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">({file.size})</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyHash(file.vermaHash, `verma-${file.id}`)}
                      className="flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:text-amber-200 transition"
                    >
                      {copiedHashId === `verma-${file.id}` ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug font-sans">
                    {file.info}
                  </p>

                  {/* Verma's Recorded Hash */}
                  <div className="rounded-lg border border-amber-700/30 bg-amber-950/20 px-2.5 py-1.5 font-mono text-xs sm:text-sm font-semibold tracking-wider text-amber-100 flex items-center justify-between select-all">
                    <span>{file.vermaHash}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Close Button / Return to Terminal */}
            <div className="mt-4 pt-3 border-t border-amber-800/30 flex items-center justify-between gap-3">
              <span className="text-[11px] text-amber-400/70 font-mono hidden sm:inline">
                Cross-reference each block against the live terminal.
              </span>
              <button
                type="button"
                onClick={() => setIsVermaLetterOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-amber-500/60 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold uppercase tracking-wider transition"
              >
                Return to Terminal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
