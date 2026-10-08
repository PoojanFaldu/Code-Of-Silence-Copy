import React, { useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { useGame } from "@/contexts/GameContext";
import {
  BookOpen,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
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
  const [isMaximized, setIsMaximized] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!isOpen) return null;

  const handleCloseLetter = () => {
    setIsVermaLetterOpen(false);
    setIsMaximized(false);
    setZoomLevel(1);
  };

  const handleZoomIn = () => {
    playTone(550, 0.04);
    setZoomLevel((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    playTone(450, 0.04);
    setZoomLevel((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))));
  };

  const handleResetZoom = () => {
    playTone(500, 0.04);
    setZoomLevel(1);
  };

  const handleToggleMaximize = () => {
    playTone(620, 0.05);
    setIsMaximized((prev) => !prev);
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
                        <div className="rounded-lg border border-cyan-500/20 bg-black/75 px-3 py-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-[9px] uppercase font-mono tracking-widest text-cyan-400/70 shrink-0">
                              LIVE HASH:
                            </span>
                            <span className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-cyan-100 select-all truncate">
                              {file.terminalHash}
                            </span>
                          </div>
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
          SECOND POPUP: Dr. Verma's Handwritten Parchment Letter (Authentic Exhibit)
          ========================================================================= */}
      {isVermaLetterOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto"
          onClick={handleCloseLetter}
        >
          <div
            className={`relative flex flex-col rounded-2xl border border-amber-600/50 bg-[#0d0a06] shadow-2xl shadow-amber-950/80 text-amber-50 overflow-hidden transition-all duration-300 ${
              isMaximized
                ? "w-[98vw] h-[96vh] max-w-none p-3 sm:p-5 m-auto"
                : "w-full max-w-4xl my-auto p-4 sm:p-5"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-700/40 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 rounded-lg bg-amber-900/40 border border-amber-600/50 text-amber-400">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 font-mono font-bold tracking-wider border border-amber-600/40">
                      EXHIBIT #03 • HANDWRITTEN
                    </span>
                    <span className="text-[10px] text-amber-400/80 font-mono hidden sm:inline">
                      REF: VRM-ARCHIVE-MEMO
                    </span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold tracking-tight text-white font-serif mt-0.5">
                    Dr. Verma's Archival Letter
                  </h3>
                </div>
              </div>

              {/* Window & Zoom Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Zoom Toolbar */}
                <div className="flex items-center rounded-lg border border-amber-600/40 bg-amber-950/50 p-0.5 text-xs font-mono">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.75}
                    className="p-1 sm:p-1.5 rounded hover:bg-amber-900/60 text-amber-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
                    title="Zoom Out (-)"
                    aria-label="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs text-amber-200 font-bold hover:text-white transition"
                    title="Reset to 100%"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>

                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 2.5}
                    className="p-1 sm:p-1.5 rounded hover:bg-amber-900/60 text-amber-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
                    title="Zoom In (+)"
                    aria-label="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="p-1 sm:p-1.5 rounded hover:bg-amber-900/60 text-amber-400 hover:text-amber-200 transition border-l border-amber-700/40 ml-0.5 hidden xs:flex items-center"
                    title="Reset view (100%)"
                    aria-label="Reset zoom"
                  >
                    <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>

                {/* Proper Maximize / Minimize Button */}
                <button
                  type="button"
                  onClick={handleToggleMaximize}
                  className="p-1.5 sm:p-2 rounded-lg border border-amber-600/50 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 hover:text-white transition flex items-center justify-center shadow-sm"
                  title={isMaximized ? "Restore window size" : "Maximize window to fullscreen"}
                  aria-label={isMaximized ? "Restore window size" : "Maximize window to fullscreen"}
                >
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300" />
                  ) : (
                    <Maximize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300" />
                  )}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleCloseLetter}
                  className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                  aria-label="Close letter"
                  title="Close"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Letter Image Display Container */}
            <div
              className={`mt-3 relative rounded-xl border border-amber-700/40 bg-black/85 flex flex-col shadow-inner overflow-hidden transition-all ${
                isMaximized ? "flex-1 min-h-0" : "h-[60vh] sm:h-[66vh]"
              }`}
            >
              {/* Secondary Status & Hint Bar */}
              <div className="px-3 py-1.5 bg-black/60 border-b border-amber-900/30 flex items-center justify-between text-[11px] font-mono text-amber-300/70 shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>PARCHMENT VIEWER • {Math.round(zoomLevel * 100)}% SCALE</span>
                  {isMaximized && (
                    <span className="hidden md:inline px-1.5 py-0.2 rounded bg-amber-900/40 text-amber-300 text-[10px] border border-amber-700/30 font-bold uppercase">
                      Fullscreen Mode
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-amber-400/60">
                  <span className="hidden sm:inline">
                    Click image to toggle zoom • Scroll horizontally/vertically to examine hashes
                  </span>
                  {!isMaximized && (
                    <button
                      type="button"
                      onClick={handleToggleMaximize}
                      className="text-[10px] text-amber-300 hover:text-amber-100 underline decoration-amber-500/50"
                    >
                      Maximize
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable image viewport */}
              <div className="flex-1 min-h-0 overflow-auto p-2 sm:p-4 flex items-center justify-center">
                <img
                  src="/evidence/verma_letter.jpg"
                  alt="Dr. Verma's Handwritten Archival Letter"
                  style={{
                    width: isMaximized
                      ? `${Math.round(1100 * zoomLevel)}px`
                      : `${Math.round(780 * zoomLevel)}px`,
                    maxWidth: zoomLevel <= 1 && !isMaximized ? "100%" : "none",
                    transition: "width 200ms ease-out",
                  }}
                  className="h-auto object-contain rounded-lg cursor-pointer select-none shadow-2xl drop-shadow-[0_15px_35px_rgba(0,0,0,0.9)] hover:brightness-105 transition"
                  onClick={() => {
                    playTone(550, 0.04);
                    setZoomLevel((prev) => (prev > 1.1 ? 1 : 1.6));
                  }}
                  title="Click to toggle 160% zoom"
                />
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-amber-800/30 shrink-0">
              <button
                type="button"
                onClick={handleCloseLetter}
                className="w-full px-5 py-2.5 rounded-xl border border-amber-500/60 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold uppercase tracking-wider transition shadow-md shadow-amber-950/50"
              >
                Back to Terminal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
