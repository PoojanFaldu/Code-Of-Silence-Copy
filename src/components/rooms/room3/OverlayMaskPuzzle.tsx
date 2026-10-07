import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  X, Layers, CheckCircle2, AlertTriangle, ArrowRight, 
  HelpCircle, Move, FileText, Check, Lock, Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  playKeyClick, playPaperSlide, playMaskAlignSnap, 
  playSuccessChime, playErrorBuzz 
} from "./audio";
import { toast } from "sonner";

interface OverlayMaskPuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  onSolved: () => void;
  onProceedToServerRoom?: () => void;
  initialSolved?: boolean;
}

interface DocumentPage {
  id: number;
  title: string;
  docCode: string;
  category: string;
  isCorrectPage: boolean;
  pageAlignmentMark: { x: number; y: number };
}

export const OverlayMaskPuzzle: React.FC<OverlayMaskPuzzleProps> = ({
  isOpen,
  onClose,
  onSolved,
  onProceedToServerRoom,
  initialSolved = false,
}) => {
  const pages: DocumentPage[] = [
    {
      id: 1,
      title: "Chemical Reagent Batch Registry",
      docCode: "DOC-ARCH-081",
      category: "Reagent Storage Log",
      isCorrectPage: false,
      pageAlignmentMark: { x: 80, y: 35 },
    },
    {
      id: 2,
      title: "EXP-17 Trial Baseline Sheet",
      docCode: "DOC-ARCH-094",
      category: "Experiment Notes (Restricted)",
      isCorrectPage: true,
      pageAlignmentMark: { x: 120, y: 70 },
    },
    {
      id: 3,
      title: "Centrifuge Calibration & Sensor Log",
      docCode: "DOC-ARCH-119",
      category: "Hardware Maintenance",
      isCorrectPage: false,
      pageAlignmentMark: { x: 160, y: 110 },
    },
    {
      id: 4,
      title: "Project AEGIS Custody & Disposal Manifest",
      docCode: "DOC-ARCH-203",
      category: "Archival Records Transfer",
      isCorrectPage: false,
      pageAlignmentMark: { x: 95, y: 140 },
    },
  ];

  const [activePageId, setActivePageId] = useState<number>(initialSolved ? 2 : 1);
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number }>(
    initialSolved ? { x: 120, y: 70 } : { x: 30, y: 10 }
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAligned, setIsAligned] = useState<boolean>(initialSolved);
  const [showRevelation, setShowRevelation] = useState<boolean>(initialSolved);
  const [overlayActive, setOverlayActive] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const activePage = pages.find((p) => p.id === activePageId) || pages[1];

  // Target alignment coordinates on Page 2
  const TARGET_X = 120;
  const TARGET_Y = 70;
  const TOLERANCE = 18;

  // Check alignment
  const checkAlignment = useCallback((x: number, y: number, pageId: number) => {
    if (pageId === 2) {
      const distance = Math.hypot(x - TARGET_X, y - TARGET_Y);
      if (distance <= TOLERANCE) {
        if (!isAligned) {
          playMaskAlignSnap();
          setIsAligned(true);
          setShowRevelation(true);
          onSolved();
          try {
            sessionStorage.setItem("room3_puzzle6_solved", "true");
          } catch {
            // Ignore
          }
          toast.success("Markings locked — hidden stamp visible.");
        }
        return true;
      }
    }
    if (isAligned && !initialSolved) {
      setIsAligned(false);
    }
    return false;
  }, [isAligned, initialSolved, onSolved]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!overlayActive) return;
    playKeyClick();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - overlayPos.x,
      y: e.clientY - overlayPos.y,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(240, e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(140, e.clientY - dragStart.y));
    setOverlayPos({ x: newX, y: newY });
    checkAlignment(newX, newY, activePageId);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    // Snap if very close
    if (activePageId === 2) {
      const distance = Math.hypot(overlayPos.x - TARGET_X, overlayPos.y - TARGET_Y);
      if (distance <= 24) {
        setOverlayPos({ x: TARGET_X, y: TARGET_Y });
        checkAlignment(TARGET_X, TARGET_Y, activePageId);
      }
    }
  };

  const handlePageChange = (pageId: number) => {
    playPaperSlide();
    setActivePageId(pageId);
    checkAlignment(overlayPos.x, overlayPos.y, pageId);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl my-auto rounded-2xl border border-indigo-500/40 bg-gradient-to-b from-[#0b0c1e] via-[#060714] to-black p-4 sm:p-7 shadow-2xl shadow-indigo-950/70 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-400">
              <Layers className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 font-mono font-bold tracking-wider border border-indigo-500/30">
                  ARCHIVE INVESTIGATION
                </span>
                <span className="text-xs text-indigo-400/70 font-mono">OPTICAL STENCIL OVERLAY</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono mt-0.5">
                Transparent Overlay Mask
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

        <div className="mt-4 p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-300 font-mono text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              Overlay Sheet
            </div>
            <p className="text-xs text-indigo-100/90 leading-relaxed font-sans">
              Drag the transparent sheet across each archive page. Match the registration crosshairs (
              <span className="text-cyan-400 font-mono">⌖</span>) and corner notches (
              <span className="text-cyan-400 font-mono">⌞ ⌟</span>) printed on the sheet to marks on the page.
            </p>
          </div>
        </div>

        {/* Document Page Tabs Selector */}
        <div className="mt-4 flex flex-wrap gap-2 items-center border-b border-indigo-900/40 pb-3">
          <span className="text-xs font-mono text-slate-400 mr-2">Archive Documents:</span>
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePageChange(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                activePageId === p.id
                  ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/50 border border-indigo-400/50"
                  : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-700/40"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Page {p.id}: {p.title}
              {p.isCorrectPage && isAligned && (
                <Check className="w-3 h-3 text-emerald-400 ml-1" />
              )}
            </button>
          ))}
        </div>

        {/* Main Worktable Area (Document Canvas + Drag Overlay) */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Document Work Surface */}
          <div className="lg:col-span-8 flex flex-col items-center">
            <div 
              ref={containerRef}
              className="relative w-full max-w-[640px] h-[380px] bg-[#0d131f] rounded-xl border border-slate-700/60 shadow-2xl overflow-hidden select-none touch-none p-4"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            >
              {/* Document Header Inside Surface */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                <span className="font-bold text-slate-300 uppercase">{activePage.docCode} — {activePage.title}</span>
                <span className="text-slate-500">{activePage.category}</span>
              </div>

              {/* Target Registration Marks on Document */}
              <div 
                className="absolute text-cyan-400 font-mono text-sm pointer-events-none transition-colors"
                style={{ 
                  left: `${activePage.pageAlignmentMark.x + 10}px`, 
                  top: `${activePage.pageAlignmentMark.y + 10}px` 
                }}
              >
                <div className="flex items-center gap-1 text-[11px] font-mono bg-cyan-950/70 border border-cyan-500/40 px-1.5 py-0.5 rounded text-cyan-300">
                  <span className="text-base font-bold">⌖</span>
                  <span>REG-A</span>
                </div>
              </div>

              <div 
                className="absolute text-cyan-400 font-mono text-sm pointer-events-none"
                style={{ 
                  left: `${activePage.pageAlignmentMark.x + 280}px`, 
                  top: `${activePage.pageAlignmentMark.y + 190}px` 
                }}
              >
                <div className="flex items-center gap-1 text-[11px] font-mono bg-cyan-950/70 border border-cyan-500/40 px-1.5 py-0.5 rounded text-cyan-300">
                  <span className="text-base font-bold">⌞ ⌟</span>
                  <span>REG-B</span>
                </div>
              </div>

              {/* Document Text Noise / Grid Contents */}
              <div className="font-mono text-[11px] leading-relaxed text-slate-500/80 select-none space-y-2 pointer-events-none">
                {activePage.id === 2 ? (
                  <div className="space-y-2 text-slate-400">
                    <p>PROTOCOL EXP-17 // SERIES AEGIS // BASELINE RUN</p>
                    <p>SAMPLE BATCH: A-17-B // INCUBATION: 48H // CONTROL: MATCHED</p>
                    <p>EFFICACY TOLERANCE (RAW): 38.4% // THRESHOLD: 70%</p>
                    <p>CYTOTOXIC NECROSIS (RAW): 680 ppm // SAFETY CEILING: 120 ppm</p>
                    <div className={`relative bg-slate-900/30 py-1 px-1 rounded transition-all ${
                      isAligned ? "text-amber-300" : "text-slate-500"
                    }`}>
                      REVIEWER FIELD: [STAMPED — ALIGN OVERLAY]
                    </div>
                    <p>NOTES: Do not publish raw figures until secondary review clears deposition packet.</p>
                    <p>ATTACHMENT: optical registration marks on this sheet match archival stencil set.</p>
                  </div>
                ) : (
                  /* Decoy Document Noise */
                  <div className="space-y-2 text-slate-600">
                    <p>BATCH: CHEM-ALPHA-779 // TEMP: 4.2C // PH: 7.14 // CONCENTRATION: 0.85M</p>
                    <p>REAGENT-01: HYDRO-BENZYL // LOT: 881-A // VERIFY: PASS // SEAL: INTACT</p>
                    <p>REAGENT-02: PHOSPHO-ESTER // LOT: 902-C // VERIFY: CONDITIONAL // AUDIT: PENDING</p>
                    <p>SENSOR CALIBRATION: S-419 // OFFSET: +0.02 // STABILITY: 99.1% // CYCLE: 4</p>
                    <p>TRANSFER AUTH: ARCHIVE DISPOSAL MANIFEST REF #9012 // AUTHOR: DEPT-CHEM</p>
                  </div>
                )}
              </div>

              {/* ========================================================
                  TRANSPARENT OVERLAY SHEET (Interactive Movable Layer)
                 ======================================================== */}
              {overlayActive && (
                <div
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className={`absolute w-[350px] h-[220px] rounded-lg cursor-grab active:cursor-grabbing border-2 transition-shadow select-none ${
                    isAligned && activePage.isCorrectPage
                      ? "border-amber-400/90 shadow-[0_0_30px_rgba(245,158,11,0.6)] bg-amber-500/10 backdrop-blur-[0.5px]"
                      : "border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-cyan-500/10 backdrop-blur-[1px]"
                  }`}
                  style={{
                    left: `${overlayPos.x}px`,
                    top: `${overlayPos.y}px`,
                  }}
                >
                  {/* Frosted Film Polarized Grid Overlay */}
                  <div 
                    className="absolute inset-0 pointer-events-none rounded-lg opacity-40"
                    style={{
                      backgroundImage: 'linear-gradient(45deg, rgba(6,182,212,0.15) 25%, transparent 25%, transparent 75%, rgba(6,182,212,0.15) 75%)',
                      backgroundSize: '16px 16px',
                    }}
                  />

                  {/* Header / Grab Handle of the Film Sheet */}
                  <div className="flex items-center justify-between p-2 text-[10px] font-mono text-cyan-200 bg-cyan-950/60 border-b border-cyan-400/30 rounded-t-lg">
                    <span className="flex items-center gap-1 font-bold">
                      <Move className="w-3 h-3 text-cyan-400" />
                      ACETATE OVERLAY MASK — DRAG TO ALIGN
                    </span>
                    <span className={`px-1.5 py-0.2 rounded font-mono font-bold ${
                      isAligned && activePage.isCorrectPage ? "bg-amber-400 text-black" : "bg-cyan-900/80 text-cyan-300"
                    }`}>
                      {isAligned && activePage.isCorrectPage ? "LOCKED" : "UNALIGNED"}
                    </span>
                  </div>

                  {/* Overlay Registration Mark A (Top Left) */}
                  <div className="absolute top-9 left-2.5 pointer-events-none">
                    <div className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isAligned && activePage.isCorrectPage 
                        ? "bg-amber-500 text-black border-amber-300 font-bold scale-110" 
                        : "bg-cyan-900/90 text-cyan-300 border-cyan-400/60"
                    }`}>
                      <span className="text-sm font-bold">⌖</span>
                      <span>MASK-A</span>
                    </div>
                  </div>

                  {/* Overlay Registration Mark B (Bottom Right) */}
                  <div className="absolute bottom-3 right-2.5 pointer-events-none">
                    <div className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isAligned && activePage.isCorrectPage 
                        ? "bg-amber-500 text-black border-amber-300 font-bold scale-110" 
                        : "bg-cyan-900/90 text-cyan-300 border-cyan-400/60"
                    }`}>
                      <span className="text-sm font-bold">⌞ ⌟</span>
                      <span>MASK-B</span>
                    </div>
                  </div>

                  {/* Optical Mask Stencil Apertures / Windows */}
                  <div className="absolute inset-x-3 top-16 bottom-8 pointer-events-none flex items-center justify-around px-2">
                    <div className={`p-1.5 rounded border transition-all ${
                      isAligned && activePage.isCorrectPage 
                        ? "border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/50 scale-110" 
                        : "border-cyan-400/50 bg-black/40 border-dashed"
                    }`}>
                      <span className="text-[10px] font-mono font-bold text-amber-300">W-1</span>
                    </div>
                    <div className={`p-1.5 rounded border transition-all ${
                      isAligned && activePage.isCorrectPage 
                        ? "border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/50 scale-110" 
                        : "border-cyan-400/50 bg-black/40 border-dashed"
                    }`}>
                      <span className="text-[10px] font-mono font-bold text-amber-300">W-2</span>
                    </div>
                    <div className={`p-1.5 rounded border transition-all ${
                      isAligned && activePage.isCorrectPage 
                        ? "border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/50 scale-110" 
                        : "border-cyan-400/50 bg-black/40 border-dashed"
                    }`}>
                      <span className="text-[10px] font-mono font-bold text-amber-300">W-3</span>
                    </div>
                    <div className={`p-1.5 rounded border transition-all ${
                      isAligned && activePage.isCorrectPage 
                        ? "border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/50 scale-110" 
                        : "border-cyan-400/50 bg-black/40 border-dashed"
                    }`}>
                      <span className="text-[10px] font-mono font-bold text-amber-300">W-4</span>
                    </div>
                    <div className={`p-1.5 rounded border transition-all ${
                      isAligned && activePage.isCorrectPage 
                        ? "border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/50 scale-110" 
                        : "border-cyan-400/50 bg-black/40 border-dashed"
                    }`}>
                      <span className="text-[10px] font-mono font-bold text-amber-300">W-5</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Slider / Fine-Tune Coordinate Controls */}
            <div className="w-full max-w-[640px] mt-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Position:</span>
                <span className="bg-black/70 px-2 py-1 rounded text-cyan-300">X: {overlayPos.x}px</span>
                <span className="bg-black/70 px-2 py-1 rounded text-cyan-300">Y: {overlayPos.y}px</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Alignment Status:</span>
                {isAligned && activePage.isCorrectPage ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    MATCH CONFIRMED
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {activePage.id !== 2 ? "WRONG DOCUMENT PAGE" : "ALIGN MARKS"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Decoded Revelation & Case Significance */}
          <div className="lg:col-span-4 space-y-3 font-mono">
            {/* Decoded Hidden Text Card */}
            <div className={`p-4 rounded-xl border transition-all ${
              isAligned && activePage.isCorrectPage
                ? "bg-gradient-to-b from-amber-950/40 to-black border-amber-500/70 shadow-xl shadow-amber-950/60"
                : "bg-slate-900/40 border-slate-800 text-slate-500"
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Hidden Text Output
                </span>
                {isAligned && activePage.isCorrectPage && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-black font-bold uppercase">
                    DECRYPTED
                  </span>
                )}
              </div>

              {isAligned && activePage.isCorrectPage ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-black/80 border-2 border-amber-400 text-center shadow-lg space-y-2">
                    <span className="block text-lg sm:text-xl font-black font-mono tracking-wide text-amber-400">
                      EXP-17 ORIGINAL RECORD
                    </span>
                    <span className="block text-sm font-mono text-amber-200">
                      Initial reviewer: DR. ARJUN MEHTA
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-700/40 text-xs">
                    <strong className="text-indigo-300 font-mono flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-indigo-400" />
                      SERVER ROOM
                    </strong>
                    <p className="mt-1 text-indigo-100/90">
                      Digital write logs for this sheet may still be on the rack.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center space-y-2">
                  <Lock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-xs text-slate-400">
                    Overlay markings not aligned with this page.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Try other documents and drag until the marks line up.
                  </p>
                </div>
              )}
            </div>

            {isAligned && activePage.isCorrectPage && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Stamp recovered
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-100/80">
                  Physical EXP-17 stamp logged. Check the case dossier, then the Server Room.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono text-center sm:text-left">
            {isAligned && activePage.isCorrectPage ? (
              <span className="text-amber-400 font-bold">
                ✓ EXP-17 stamp recovered
              </span>
            ) : (
              <span>Drag the overlay; switch pages if marks do not line up.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-900 font-mono text-xs flex-1 sm:flex-none"
            >
              Close Mask
            </Button>
            {isAligned && activePage.isCorrectPage && onProceedToServerRoom && (
              <Button
                onClick={() => {
                  playKeyClick();
                  onClose();
                  onProceedToServerRoom();
                }}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold font-mono text-xs shadow-lg shadow-indigo-950/60 flex-1 sm:flex-none"
              >
                <Server className="w-4 h-4 mr-1.5" />
                Proceed to Server Room
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
