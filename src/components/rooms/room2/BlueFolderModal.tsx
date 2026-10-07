import React from "react";
import { X, FileText, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlueFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWorkstation: () => void;
}

export const BlueFolderModal: React.FC<BlueFolderModalProps> = ({
  isOpen,
  onClose,
  onOpenWorkstation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 shadow-2xl shadow-blue-900/30 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-blue-500/20">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-400/40 text-blue-400 shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold uppercase">
                  Classified File #EXP-881
                </span>
                <span className="text-xs text-slate-400 font-mono">ROOM 2 — RESEARCH LAB</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
                Dr. Verma's Blue Folder
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          {/* Left: Document Image */}
          <div className="relative rounded-xl overflow-hidden border border-blue-500/20 bg-slate-950 shadow-md group">
            <img
              src="/evidence/blue_folder.jpg"
              alt="Dr. Verma's Blue Folder Document"
              className="w-full h-64 object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 text-xs font-mono text-blue-200/90 bg-black/60 backdrop-blur-sm p-2 rounded border border-blue-500/20">
              📌 Sticky Note: "Experimental System Protocol #EXP-881: Workstation terminal lock sequence active. - Dr. Verma"
            </div>
          </div>

          {/* Right: Narrative Clue Breakdown */}
          <div className="flex flex-col justify-between space-y-4 font-sans">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-500/20 text-xs text-blue-200 leading-relaxed">
                <p className="font-semibold text-blue-400 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-blue-400" /> Narrative Background:
                </p>
                The players enter the research lab because the <strong>blue folder</strong> contains a direct reference to the lab's experimental system.
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <p className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
                  Key Findings in Folder:
                </p>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-start gap-2 bg-white/5 p-2 rounded border border-white/5">
                    <span className="text-blue-400 font-bold">1.</span>
                    <span>The central research terminal on the lab workstation is locked behind a logic circuit override.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-white/5 p-2 rounded border border-white/5">
                    <span className="text-blue-400 font-bold">2.</span>
                    <span>The blue dossier contains the circuit reference card: <strong className="text-white">AND, OR, NOT</strong> gate behaviors.</span>
                  </li>
                  <li className="flex items-start gap-2 bg-white/5 p-2 rounded border border-white/5">
                    <span className="text-blue-400 font-bold">3.</span>
                    <span>Solving this logic circuit will decrypt the suppressed experimental reports.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => {
                  onClose();
                  onOpenWorkstation();
                }}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 border border-blue-400/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4" />
                Inspect Workstation Logic Panel (Puzzle 3)
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
