import React, { useState, useEffect } from "react";
import { 
  X, Fingerprint, ShieldAlert, CheckCircle2, AlertTriangle, 
  HelpCircle, ArrowRight, RefreshCw, FileText, Lock, Unlock, 
  Eye, FileCheck, Binary, Sparkles, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  playKeyClick, playHashScanTone, playTamperAlert, 
  playSuccessChime, playErrorBuzz 
} from "./audio";
import { toast } from "sonner";

interface HashFingerprintPuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  onSolved: () => void;
  onProceedToOverlay?: () => void;
  onOpenNotebook?: () => void;
  initialSolved?: boolean;
}

interface ResearchFile {
  id: "v1" | "v2" | "final";
  name: string;
  subtitle: string;
  size: string;
  modifiedDate: string;
  recordedHash: string;
  computedHash: string;
  isTampered: boolean;
}

export const HashFingerprintPuzzle: React.FC<HashFingerprintPuzzleProps> = ({
  isOpen,
  onClose,
  onSolved,
  onProceedToOverlay,
  onOpenNotebook,
  initialSolved = false,
}) => {
  const files: ResearchFile[] = [
    {
      id: "v1",
      name: "AEGIS_v1",
      subtitle: "Prototype Formulation (Phase I)",
      size: "24.8 MB",
      modifiedDate: "2024-03-12 11:42:09",
      recordedHash: "7e4c9f1a2b3d4e5f60718293a4b5c6d7e8f90e1b2c3d4e5f67890abcdef1234",
      computedHash: "7e4c9f1a2b3d4e5f60718293a4b5c6d7e8f90e1b2c3d4e5f67890abcdef1234",
      isTampered: false,
    },
    {
      id: "v2",
      name: "AEGIS_v2",
      subtitle: "Beta Chemical Synthesizer Data",
      size: "41.2 MB",
      modifiedDate: "2024-08-19 16:15:33",
      recordedHash: "d0b3f5c7891234567890abcdef1234567890abcdef1234567890abcdef1234",
      computedHash: "d0b3f5c7891234567890abcdef1234567890abcdef1234567890abcdef1234",
      isTampered: false,
    },
    {
      id: "final",
      name: "AEGIS_FINAL",
      subtitle: "Official Deposition & Regulatory Release",
      size: "52.7 MB",
      modifiedDate: "2024-10-14 20:18:44",
      recordedHash: "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
      computedHash: "f73e91b0d284a1c59e78291f04b2a8d3e91c784b2e5a019d8c3e721a945b0f12",
      isTampered: true,
    },
  ];

  const [scannedFiles, setScannedFiles] = useState<Record<string, boolean>>({
    v1: initialSolved,
    v2: initialSolved,
    final: initialSolved,
  });
  const [scanningFile, setScanningFile] = useState<string | null>(null);
  const [selectedFileForInspection, setSelectedFileForInspection] = useState<string | null>(null);
  const [selectedModifiedChoice, setSelectedModifiedChoice] = useState<string | null>(initialSolved ? "final" : null);
  const [isSolved, setIsSolved] = useState<boolean>(initialSolved);
  const [showModifiedReportModal, setShowModifiedReportModal] = useState<boolean>(false);
  const [evidenceSaved, setEvidenceSaved] = useState<boolean>(false);

  useEffect(() => {
    if (initialSolved) {
      setIsSolved(true);
      setSelectedModifiedChoice("final");
      setScannedFiles({ v1: true, v2: true, final: true });
    }
  }, [initialSolved]);

  const handleComputeHash = (fileId: string) => {
    playHashScanTone();
    setScanningFile(fileId);
    setTimeout(() => {
      setScannedFiles((prev) => ({ ...prev, [fileId]: true }));
      setScanningFile(null);
      if (fileId === "final") {
        playTamperAlert();
        toast.warning("ALERT: Hash mismatch detected on AEGIS_FINAL!", {
          description: "Computed digital fingerprint does not match Verma's notebook record.",
        });
      } else {
        playKeyClick();
        toast.success(`Computed hash verified for ${files.find(f => f.id === fileId)?.name}`);
      }
    }, 850);
  };

  const handleComputeAll = () => {
    playHashScanTone();
    setScanningFile("all");
    setTimeout(() => {
      setScannedFiles({ v1: true, v2: true, final: true });
      setScanningFile(null);
      playTamperAlert();
      toast.warning("Verification complete: AEGIS_FINAL shows cryptographic tamper mismatch!");
    }, 1200);
  };

  const handleConfirmModifiedSelection = () => {
    if (!selectedModifiedChoice) {
      playErrorBuzz();
      toast.error("Please select which file was modified based on your hash comparison.");
      return;
    }

    if (selectedModifiedChoice === "final") {
      playSuccessChime();
      setIsSolved(true);
      setShowModifiedReportModal(true);
      onSolved();
      try {
        sessionStorage.setItem("room3_puzzle5_solved", "true");
      } catch {
        // Ignore session storage errors
      }
      toast.success("Deduction Correct: AEGIS_FINAL was modified!");
    } else {
      playErrorBuzz();
      toast.error("Incorrect: That file's computed hash exactly matches Verma's notebook.");
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl my-auto rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-[#06101e] via-[#040913] to-black p-4 sm:p-7 shadow-2xl shadow-cyan-950/70 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Fingerprint className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 font-mono font-bold tracking-wider border border-cyan-500/30">
                  PUZZLE 5 — DIGITAL FORENSICS
                </span>
                <span className="text-xs text-cyan-400/70 font-mono">HASH CHECKSUM VERIFIER v4.2</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono mt-0.5">
                Hash / Digital Fingerprint Analysis
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              playKeyClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reference Card (Explains Hashing to Player) */}
        <div className="mt-4 p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-8 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              Reference Manual: Cryptographic Fingerprints
            </div>
            <p className="text-xs text-cyan-100/90 leading-relaxed font-sans">
              • <strong>A hash is a digital fingerprint</strong> unique to the exact bitstream of a file.<br />
              • <strong>Identical files have the same hash</strong> regardless of system or filename.<br />
              • <strong>If a file is changed, its hash changes completely</strong> (Avalanche Effect).
            </p>
            <p className="text-[11px] text-amber-300/90 font-mono">
              Compare each file's computed hash against the recorded hash written in Dr. Verma's notebook!
            </p>
          </div>
          <div className="md:col-span-4 flex flex-col gap-2">
            {onOpenNotebook && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  playKeyClick();
                  onOpenNotebook();
                }}
                className="border-amber-500/40 text-amber-300 hover:bg-amber-950/40 text-xs font-mono"
              >
                <BookOpen className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                View Verma's Notebook Hashes
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleComputeAll}
              disabled={scanningFile !== null}
              className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-mono text-xs"
            >
              <Binary className="w-3.5 h-3.5 mr-1.5" />
              Scan All Files Digital Fingerprints
            </Button>
          </div>
        </div>

        {/* 3 Research Files Cards */}
        <div className="mt-5 space-y-3">
          <div className="text-xs font-mono font-bold text-cyan-400/80 uppercase tracking-wider flex items-center justify-between">
            <span>Verma's Project AEGIS File Archives (3 Revisions Found):</span>
            <span className="text-[11px] text-white/50">Algorithm: SHA-256 Digest</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {files.map((file) => {
              const isScanned = scannedFiles[file.id];
              const isScanning = scanningFile === file.id || scanningFile === "all";
              const isMismatch = isScanned && file.isTampered;
              const isSelected = selectedModifiedChoice === file.id;

              return (
                <div
                  key={file.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isMismatch 
                      ? "bg-red-950/20 border-red-500/50 shadow-lg shadow-red-950/40" 
                      : isScanned 
                      ? "bg-emerald-950/15 border-emerald-500/40" 
                      : "bg-slate-900/40 border-slate-700/40"
                  } ${isSelected ? "ring-2 ring-cyan-400" : ""}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg font-mono font-bold text-xs ${
                        isMismatch ? "bg-red-900/50 text-red-300" : isScanned ? "bg-emerald-900/50 text-emerald-300" : "bg-slate-800 text-slate-300"
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base text-white">{file.name}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
                            {file.size}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{file.subtitle} • Modified {file.modifiedDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isScanned ? (
                        <Button
                          size="sm"
                          disabled={isScanning}
                          onClick={() => handleComputeHash(file.id)}
                          className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-xs"
                        >
                          {isScanning ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                              Computing...
                            </>
                          ) : (
                            <>
                              <Fingerprint className="w-3 h-3 mr-1.5" />
                              Calculate Hash
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer bg-black/60 px-3 py-1.5 rounded-lg border border-white/20 text-xs font-mono">
                            <input 
                              type="radio"
                              name="modifiedChoice"
                              checked={isSelected}
                              onChange={() => {
                                playKeyClick();
                                setSelectedModifiedChoice(file.id);
                              }}
                              className="accent-cyan-400"
                            />
                            <span>Flag as Modified File</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hash Comparison Data */}
                  <div className="mt-3 grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs font-mono">
                    <div className="lg:col-span-6 bg-black/50 p-2.5 rounded-lg border border-white/10">
                      <div className="text-[11px] text-amber-400 font-bold mb-1">
                        VERMA NOTEBOOK RECORDED HASH:
                      </div>
                      <div className="text-amber-100/90 break-all select-all font-mono text-[11px]">
                        {file.recordedHash}
                      </div>
                    </div>

                    <div className={`lg:col-span-6 p-2.5 rounded-lg border ${
                      !isScanned 
                        ? "bg-black/30 border-dashed border-white/20 text-slate-500" 
                        : isMismatch 
                        ? "bg-red-950/40 border-red-500/50 text-red-200" 
                        : "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold">
                          SYSTEM COMPUTED FILE HASH:
                        </span>
                        {isScanned && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isMismatch ? "bg-red-900 text-red-200" : "bg-emerald-900 text-emerald-200"
                          }`}>
                            {isMismatch ? "TAMPERED / MISMATCH" : "VERIFIED / MATCH"}
                          </span>
                        )}
                      </div>
                      <div className="break-all select-all font-mono text-[11px]">
                        {isScanned ? file.computedHash : "Hash not calculated yet. Click 'Calculate Hash'."}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="mt-6 pt-4 border-t border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono text-center sm:text-left">
            {isSolved ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                <CheckCircle2 className="w-4 h-4" />
                Puzzle 5 Solved: AEGIS_FINAL confirmed modified. Motive established.
              </span>
            ) : (
              <span>Identify the tampered file using the hash comparison above.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isSolved ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    playKeyClick();
                    setShowModifiedReportModal(true);
                  }}
                  className="border-red-500/50 text-red-300 hover:bg-red-950/40 font-mono text-xs"
                >
                  <Eye className="w-4 h-4 mr-1.5" />
                  View Neha's Manipulated Results
                </Button>
                {onProceedToOverlay && (
                  <Button
                    onClick={() => {
                      playKeyClick();
                      onClose();
                      onProceedToOverlay();
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold font-mono text-xs shadow-lg shadow-emerald-950/50"
                  >
                    Proceed to Overlay Mask (Puzzle 6)
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={handleConfirmModifiedSelection}
                disabled={!selectedModifiedChoice}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs w-full sm:w-auto shadow-lg shadow-cyan-950/50"
              >
                <Unlock className="w-4 h-4 mr-1.5" />
                Confirm & Open Modified File
              </Button>
            )}
          </div>
        </div>

        {/* ========================================================
            MODIFIED FILE AUDIT MODAL (Reveals Neha's Motive)
           ======================================================== */}
        {showModifiedReportModal && (
          <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-xl animate-fade-in overflow-y-auto"
            onClick={() => setShowModifiedReportModal(false)}
          >
            <div 
              className="relative w-full max-w-4xl my-auto rounded-2xl border border-red-500/50 bg-gradient-to-b from-[#180a0a] via-[#0f0505] to-black p-5 sm:p-7 shadow-2xl shadow-red-950/80 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-red-500/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-red-900/40 border border-red-500/50 text-red-400">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-red-900/60 text-red-300 font-mono font-bold tracking-wider border border-red-500/30">
                      FORENSIC REVELATION • CRITICAL EVIDENCE
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5">
                      AEGIS_FINAL — Manipulated Research Report
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowModifiedReportModal(false)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* High Impact Motive Summary Box */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-red-950/60 to-black border-2 border-red-600/70 shadow-lg shadow-red-950/50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-red-300 font-mono uppercase tracking-wide">
                      Motive Established: Verma Discovered Neha's Fraud
                    </h4>
                    <p className="text-xs sm:text-sm text-red-100/90 leading-relaxed mt-1 font-sans">
                      Opening the modified <strong>AEGIS_FINAL</strong> file reveals that experimental trial results were deliberately forged to make Neha Sen's research appear legitimate. Dr. Verma discovered this falsification and was preparing to formally report her before he was silenced. <strong>This firmly establishes her motive.</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Comparison & Document Image */}
              <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Forensic Document Photo */}
                <div className="lg:col-span-5 space-y-2">
                  <div className="rounded-xl overflow-hidden border border-red-600/40 bg-black shadow-lg">
                    <img 
                      src="/evidence/aegis_falsified_report.jpg" 
                      alt="AEGIS Falsified Research Report Document" 
                      className="w-full object-cover"
                    />
                  </div>
                  <p className="text-[11px] text-red-400/70 font-mono text-center">
                    Audited document with red ink markup showing Neha's altered parameters
                  </p>
                </div>

                {/* Data Comparison Table */}
                <div className="lg:col-span-7 space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-black/60 border border-red-900/60 space-y-2.5">
                    <div className="text-xs font-bold text-red-400 uppercase tracking-wide pb-1.5 border-b border-red-900/40">
                      Discrepancy Audit — Original vs Altered AEGIS_FINAL
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 rounded bg-red-950/30 border border-red-900/40">
                        <div className="font-bold text-slate-300 mb-0.5">Trial Metric: Efficacy Tolerance Rate</div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Verma Original Trial:</span>
                          <span className="text-amber-400 font-bold">38.4% (FAILED THRESHOLD)</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Neha Doctored Final:</span>
                          <span className="text-emerald-400 font-bold">94.8% (FALSIFIED COMPLIANT)</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded bg-red-950/30 border border-red-900/40">
                        <div className="font-bold text-slate-300 mb-0.5">Trial Metric: Cytotoxic Cell Necrosis</div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Verma Original Trial:</span>
                          <span className="text-red-400 font-bold">680 ppm (FATAL TOXICITY)</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Neha Doctored Final:</span>
                          <span className="text-emerald-400 font-bold">45 ppm (SUPPRESSED TO SAFETY)</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded bg-red-950/30 border border-red-900/40">
                        <div className="font-bold text-slate-300 mb-0.5">Document Audit Stamp & Author Credit</div>
                        <div className="text-[11px] text-red-200">
                          Timestamped revision logged by: <strong>N. Sen (Lead Biochemical Analyst)</strong>. Verma noted: <em>"Discovered Neha altered database. Deposition scheduled."</em>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-red-800/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-red-300/80 font-mono">
                  Motive recorded. Evidence locked into forensic investigation file.
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    onClick={() => {
                      playKeyClick();
                      setEvidenceSaved(true);
                      toast.success("Motive recorded: Neha manipulated the research!");
                      setShowModifiedReportModal(false);
                      if (onProceedToOverlay) {
                        onClose();
                        onProceedToOverlay();
                      }
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-xs w-full sm:w-auto shadow-lg shadow-red-950/50"
                  >
                    <FileCheck className="w-4 h-4 mr-1.5" />
                    Record Evidence & Proceed to Puzzle 6 (Overlay Mask)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
