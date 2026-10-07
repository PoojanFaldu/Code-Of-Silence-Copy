import React, { useState } from "react";
import { X, BookOpen, Fingerprint, ShieldAlert, Check, Copy, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playKeyClick, playPaperSlide } from "./audio";
import { toast } from "sonner";

interface VermaNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHashPuzzle: () => void;
}

export const VermaNotebookModal: React.FC<VermaNotebookModalProps> = ({
  isOpen,
  onClose,
  onOpenHashPuzzle,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    playKeyClick();
    navigator.clipboard?.writeText(text);
    setCopiedHash(label);
    toast.success(`Copied ${label} hash to clipboard!`);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl my-auto rounded-2xl border border-amber-600/40 bg-gradient-to-b from-[#140e07] via-[#0d0905] to-black p-5 sm:p-7 shadow-2xl shadow-amber-950/60 text-amber-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-700/30">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-amber-900/30 border border-amber-600/40 text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 font-mono font-bold tracking-wider border border-amber-600/30">
                  ARCHIVE REPOSITORY EVIDENCE
                </span>
                <span className="text-xs text-amber-400/70 font-mono">DOC REF: VRM-NB-104</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif mt-0.5">
                Dr. Verma's Archival Notebook
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              playPaperSlide();
              onClose();
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Narrative Context Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-200/90 leading-relaxed font-sans">
            <strong className="text-amber-300">Why You Are In The Archives:</strong> Dr. Verma's original handwritten note specifically directed investigators to search the archives. He recorded the trusted cryptographic digital fingerprints (hashes) of all master Project AEGIS files here to preserve the true experimental results against unauthorized alteration.
          </div>
        </div>

        {/* Main Content Grid: Image + Notebook Details */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Forensic Image Preview */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            <div 
              className="relative rounded-xl overflow-hidden border border-amber-700/40 bg-black/60 group cursor-pointer shadow-lg"
              onClick={() => {
                playKeyClick();
                setZoomImage(!zoomImage);
              }}
            >
              <img 
                src="/evidence/verma_notebook.jpg" 
                alt="Dr. Verma's Handwritten Notebook with Cryptographic Hashes" 
                className={`w-full object-cover transition-transform duration-300 ${zoomImage ? 'scale-125' : 'group-hover:scale-105'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-amber-300 font-mono">
                <span className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded backdrop-blur-sm">
                  {zoomImage ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                  {zoomImage ? 'Click to reset' : 'Click to zoom'}
                </span>
                <span className="bg-amber-950/80 px-2 py-1 rounded border border-amber-700/50">
                  Exhibit #04
                </span>
              </div>
            </div>
            <p className="text-[11px] text-amber-400/60 font-mono text-center">
              Dr. Verma's notebook page showing recorded checksums & red audit stamp
            </p>
          </div>

          {/* Notebook Transcribed Records & Checksums */}
          <div className="lg:col-span-7 space-y-3 font-mono text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-black/60 border border-amber-900/60 space-y-3">
              <div className="border-b border-amber-800/30 pb-2">
                <span className="text-amber-400 font-bold tracking-wide uppercase text-xs">
                  Notebook Transcription — Project AEGIS Checksums
                </span>
              </div>

              {/* Recorded Hashes */}
              <div className="space-y-2.5">
                {/* AEGIS_v1 */}
                <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-amber-300 text-xs">AEGIS_v1 (Prototype)</span>
                    <button 
                      onClick={() => copyToClipboard("7e4c9f1a2b3d4e5f60718293a4b5c6d7e8f90e1b2c3d4e5f67890abcdef1234", "AEGIS_v1")}
                      className="text-[11px] text-amber-400 hover:text-amber-200 flex items-center gap-1 transition-colors"
                    >
                      {copiedHash === "AEGIS_v1" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Copy Hash
                    </button>
                  </div>
                  <div className="bg-black/80 px-2.5 py-1.5 rounded text-[11px] text-amber-100/90 font-mono break-all border border-amber-900/40">
                    7e4c9f1a2b3d4e5f60718293a4b5c6d7e8f90e1b2c3d4e5f67890abcdef1234
                  </div>
                </div>

                {/* AEGIS_v2 */}
                <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-amber-300 text-xs">AEGIS_v2 (Beta Revision)</span>
                    <button 
                      onClick={() => copyToClipboard("d0b3f5c7891234567890abcdef1234567890abcdef1234567890abcdef1234", "AEGIS_v2")}
                      className="text-[11px] text-amber-400 hover:text-amber-200 flex items-center gap-1 transition-colors"
                    >
                      {copiedHash === "AEGIS_v2" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Copy Hash
                    </button>
                  </div>
                  <div className="bg-black/80 px-2.5 py-1.5 rounded text-[11px] text-amber-100/90 font-mono break-all border border-amber-900/40">
                    d0b3f5c7891234567890abcdef1234567890abcdef1234567890abcdef1234
                  </div>
                </div>

                {/* AEGIS_FINAL */}
                <div className="p-2.5 rounded-lg bg-red-950/25 border border-red-700/40">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-red-300 text-xs">AEGIS_FINAL (Master Production)</span>
                      <span className="text-[10px] bg-red-900/60 text-red-200 px-1.5 py-0.2 rounded border border-red-700/50">
                        CRITICAL
                      </span>
                    </div>
                    <button 
                      onClick={() => copyToClipboard("a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890", "AEGIS_FINAL")}
                      className="text-[11px] text-red-300 hover:text-red-100 flex items-center gap-1 transition-colors"
                    >
                      {copiedHash === "AEGIS_FINAL" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Copy Hash
                    </button>
                  </div>
                  <div className="bg-black/80 px-2.5 py-1.5 rounded text-[11px] text-red-200 font-mono break-all border border-red-900/60">
                    a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890
                  </div>
                </div>
              </div>

              {/* Verma's Handwritten Warning Quote */}
              <div className="p-3 rounded-lg bg-amber-950/30 border-l-2 border-amber-500 font-serif italic text-amber-200/90 text-xs leading-relaxed">
                "Note to self: The final AEGIS dataset submitted by Neha exhibits statistical anomalies that defy our baseline chemistry. Check the computed file fingerprint on the Archive Workstation against my master hash above. Any discrepancy confirms tampering." — Dr. Verma
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-amber-800/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-amber-400/70 font-mono text-center sm:text-left">
            Next step: Compare hashes on the Archive Workstation to detect modified files.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-amber-700/50 text-amber-300 hover:bg-amber-950/50 flex-1 sm:flex-none"
            >
              Close Notebook
            </Button>
            <Button
              onClick={() => {
                playPaperSlide();
                onClose();
                onOpenHashPuzzle();
              }}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-bold font-mono shadow-lg shadow-amber-900/50 flex-1 sm:flex-none"
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              Verify Hashes on Terminal (Puzzle 5)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
