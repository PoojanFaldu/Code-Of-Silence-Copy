import React from "react";
import { X, FolderLock, FileCheck, CheckCircle2, AlertTriangle, Clock, ArrowRight, ShieldCheck, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playKeyClick } from "./audio";

interface CaseDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHashSolved: boolean;
  isOverlaySolved: boolean;
  onProceedToServerRoom?: () => void;
}

export const CaseDossierModal: React.FC<CaseDossierModalProps> = ({
  isOpen,
  onClose,
  isHashSolved,
  isOverlaySolved,
  onProceedToServerRoom,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl my-auto rounded-2xl border border-amber-600/40 bg-gradient-to-b from-[#140f09] via-[#0d0905] to-black p-5 sm:p-7 shadow-2xl shadow-amber-950/80 text-amber-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-700/30">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-amber-900/40 border border-amber-600/40 text-amber-400">
              <FolderLock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono font-bold tracking-wider border border-amber-600/30">
                CASE DOSSIER • ARCHIVES REPORT
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-white mt-0.5">
                Room 3 Evidence & Motive File
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

        {/* Evidence Items */}
        <div className="mt-5 space-y-4">
          {/* Evidence 1: Motive Discovered (Puzzle 5) */}
          <div className={`p-4 rounded-xl border transition-all ${
            isHashSolved 
              ? "bg-red-950/30 border-red-500/50 shadow-md shadow-red-950/30" 
              : "bg-black/40 border-slate-800 opacity-70"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded text-xs font-mono font-bold ${
                  isHashSolved ? "bg-red-900/70 text-red-200" : "bg-slate-800 text-slate-400"
                }`}>
                  EXHIBIT A: HASH TAMPERING
                </span>
                <span className="text-xs font-mono text-slate-400">AEGIS_FINAL Checksum Mismatch</span>
              </div>
              {isHashSolved ? (
                  <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> LATER EDIT LOGGED
                </span>
              ) : (
                <span className="text-xs font-mono text-amber-400/80">PENDING PUZZLE 5</span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {isHashSolved ? (
                <span>
                  <strong>Finding:</strong> AEGIS_FINAL was modified under Neha Rao&apos;s account — but the original
                  EXP-17 discrepancy predates her edits. Initial reviewer: <strong>Dr. Arjun Mehta</strong>. Neha
                  altered a later copy; she did not create the first falsification.
                </span>
              ) : (
                "Solve Puzzle 5 (Hash / Digital Fingerprint) on the archive terminal to verify whether any AEGIS file was modified."
              )}
            </p>
          </div>

          {/* Evidence 2: Timeline Presence (Puzzle 6) */}
          <div className={`p-4 rounded-xl border transition-all ${
            isOverlaySolved 
              ? "bg-amber-950/30 border-amber-500/50 shadow-md shadow-amber-950/30" 
              : "bg-black/40 border-slate-800 opacity-70"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded text-xs font-mono font-bold ${
                  isOverlaySolved ? "bg-amber-900/70 text-amber-200" : "bg-slate-800 text-slate-400"
                }`}>
                  EXHIBIT B: TIMELINE EVIDENCE
                </span>
                <span className="text-xs font-mono text-slate-400">Optical Stencil Decryption</span>
              </div>
              {isOverlaySolved ? (
                <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> EXP-17 ORIGINAL
                </span>
              ) : (
                <span className="text-xs font-mono text-amber-400/80">PENDING PUZZLE 6</span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {isOverlaySolved ? (
                <span>
                  <strong>Finding:</strong> Overlay recovered the <strong>EXP-17 ORIGINAL RECORD</strong> stamp —
                  initial reviewer <strong>Dr. Arjun Mehta</strong>. Neha was hiding something, but the original
                  manipulation was not hers.
                </span>
              ) : (
                "Solve Puzzle 6 (Overlay Mask) by aligning the transparent sheet over the archive documents."
              )}
            </p>
          </div>

          {/* Final Lead to Server Room */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-700/40 text-xs font-mono space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-300 font-bold">
              <Server className="w-4 h-4 text-indigo-400" />
              NEXT INVESTIGATION PHASE: SERVER ROOM
            </div>
            <p className="text-indigo-200/90 leading-relaxed font-sans">
              Physical records confirm an earlier discrepancy. Digital modification logs in the{" "}
              <strong>Server Room</strong> may identify who made the original change — and who had motive to silence
              Verma.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-amber-800/30 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-amber-700/50 text-amber-300 hover:bg-amber-950/50 text-xs font-mono"
          >
            Close Dossier
          </Button>

          {isHashSolved && isOverlaySolved && onProceedToServerRoom && (
            <Button
              onClick={() => {
                playKeyClick();
                onClose();
                onProceedToServerRoom();
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs shadow-lg shadow-indigo-950/50"
            >
              <Server className="w-4 h-4 mr-1.5" />
              Proceed to Server Room
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
