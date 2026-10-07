import React, { useState, useEffect } from "react";
import { 
  X, Cpu, CheckCircle2, AlertTriangle, ShieldCheck, 
  HelpCircle, Sparkles, ArrowRight, Zap, RefreshCw, Lock, Unlock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  playSwitchClick, playSuccessChime, playErrorBuzz 
} from "./audio";

interface LogicGatesPuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  onSolved: () => void;
  onProceedToMonitor?: () => void;
  initialSolved?: boolean;
}

export const LogicGatesPuzzle: React.FC<LogicGatesPuzzleProps> = ({
  isOpen,
  onClose,
  onSolved,
  onProceedToMonitor,
  initialSolved = false,
}) => {
  // Switch states (A, B, C, D)
  // Default values set to an unsolved combination: A=0, B=1, C=0, D=0
  const [switchA, setSwitchA] = useState<boolean>(false);
  const [switchB, setSwitchB] = useState<boolean>(true);
  const [switchC, setSwitchC] = useState<boolean>(false);
  const [switchD, setSwitchD] = useState<boolean>(false);

  const [isUnlocked, setIsUnlocked] = useState<boolean>(initialSolved);
  const [showReport, setShowReport] = useState<boolean>(initialSolved);
  const [evidenceSaved, setEvidenceSaved] = useState<boolean>(false);

  // Sync with initialSolved
  useEffect(() => {
    if (initialSolved) {
      setIsUnlocked(true);
      setShowReport(true);
    }
  }, [initialSolved]);

  // Logic evaluations:
  // Gate 1: NOT Gate on switchB -> output1
  const gate1Out = !switchB;

  // Gate 2: AND Gate on switchA and gate1Out -> output2
  const gate2Out = switchA && gate1Out;

  // Gate 3: OR Gate on switchC and switchD -> output3
  const gate3Out = switchC || switchD;

  // Gate 4: Final AND Gate combining gate2Out and gate3Out -> finalOutput
  const finalOutput = gate2Out && gate3Out;

  const handleToggle = (switchId: "A" | "B" | "C" | "D") => {
    playSwitchClick();
    if (switchId === "A") setSwitchA(!switchA);
    if (switchId === "B") setSwitchB(!switchB);
    if (switchId === "C") setSwitchC(!switchC);
    if (switchId === "D") setSwitchD(!switchD);
  };

  const handleReset = () => {
    playSwitchClick();
    setSwitchA(false);
    setSwitchB(true);
    setSwitchC(false);
    setSwitchD(false);
  };

  const handleValidateAndUnlock = () => {
    if (finalOutput) {
      playSuccessChime();
      setIsUnlocked(true);
      setShowReport(true);
      onSolved();
      try {
        sessionStorage.setItem("room2_puzzle3_solved", "true");
      } catch {
        // Ignore session storage errors
      }
    } else {
      playErrorBuzz();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl my-auto rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-black p-4 sm:p-6 shadow-2xl shadow-cyan-900/40 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg border shadow-inner transition-colors ${
              isUnlocked 
                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-400" 
                : "bg-cyan-500/20 border-cyan-400/40 text-cyan-400"
            }`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold uppercase">
                  WORKSTATION TERMINAL • PUZZLE 3
                </span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                  isUnlocked ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-300"
                }`}>
                  {isUnlocked ? "RESTORED / UNLOCKED" : "LOCKED"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5 font-display">
                Electronic Control Panel: Logic Gates
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

        {/* Tab Navigation if already unlocked */}
        {isUnlocked && (
          <div className="flex gap-2 mt-4 pb-2 border-b border-white/10">
            <button
              onClick={() => setShowReport(false)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${
                !showReport 
                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-semibold" 
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              ⚡ Logic Circuit Controls
            </button>
            <button
              onClick={() => setShowReport(true)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5 ${
                showReport 
                  ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-semibold" 
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              📄 Research Report (Decrypted)
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>
        )}

        {/* MAIN BODY: VIEW 1 - LOGIC GATES CIRCUIT */}
        {!showReport && (
          <div className="mt-4 space-y-4">
            {/* Top Screen Quote / Prompt Box */}
            <div className="relative overflow-hidden p-3 sm:p-4 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-950 shadow-inner">
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Workstation Terminal Display
                  </div>
                  <p className="text-base sm:text-lg font-mono font-semibold text-cyan-100 italic">
                    "Only the correct combination will restore the research terminal."
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs font-mono bg-black/60 px-3 py-1.5 rounded-lg border border-cyan-500/30 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  STATUS: {finalOutput ? "SIGNAL READY" : "BYPASS REQUIRED"}
                </div>
              </div>
            </div>

            {/* Reference Card Box */}
            <div className="p-3 sm:p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300 uppercase tracking-wider mb-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                REFERENCE CARD: LOGIC GATES SPECIFICATION
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-black/50 border border-amber-500/20 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <strong className="text-amber-300 font-bold text-sm">AND</strong>
                    <span className="px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 text-[10px]">Dual Input</span>
                  </div>
                  <p className="text-slate-300 mt-1">Both inputs must be <strong>ON</strong> (1) to output ON (1).</p>
                </div>

                <div className="p-2.5 rounded-lg bg-black/50 border border-amber-500/20 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <strong className="text-cyan-300 font-bold text-sm">OR</strong>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 text-[10px]">Flexible</span>
                  </div>
                  <p className="text-slate-300 mt-1">At least one input must be <strong>ON</strong> (1) to output ON (1).</p>
                </div>

                <div className="p-2.5 rounded-lg bg-black/50 border border-amber-500/20 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <strong className="text-rose-300 font-bold text-sm">NOT</strong>
                    <span className="px-1.5 py-0.5 rounded bg-rose-400/10 text-rose-300 text-[10px]">Inverter</span>
                  </div>
                  <p className="text-slate-300 mt-1">Reverses the input: <strong>0 → 1</strong>, <strong>1 → 0</strong>.</p>
                </div>
              </div>
            </div>

            {/* Interactive Logic Circuit Schematic */}
            <div className="p-4 sm:p-5 rounded-xl border border-slate-700 bg-black/60 shadow-inner">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  ⚡ Interactive Circuit Diagram • Toggle Switches Below
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 text-xs font-mono text-slate-400 hover:text-white"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Reset
                </Button>
              </div>

              {/* Schematic Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                {/* Column 1: Input Switches */}
                <div className="space-y-3">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 text-center font-bold">
                    INPUT TOGGLES
                  </div>

                  {/* Switch A */}
                  <div 
                    onClick={() => handleToggle("A")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      switchA 
                        ? "bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-500/20" 
                        : "bg-slate-900/60 border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-mono font-bold text-white">Switch A</div>
                      <div className="text-[10px] font-mono text-slate-400">Main Bus</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                      switchA ? "bg-cyan-400 text-black shadow" : "bg-slate-800 text-slate-400"
                    }`}>
                      {switchA ? "1 (ON)" : "0 (OFF)"}
                    </span>
                  </div>

                  {/* Switch B */}
                  <div 
                    onClick={() => handleToggle("B")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      switchB 
                        ? "bg-rose-950/60 border-rose-400 shadow-md shadow-rose-500/20" 
                        : "bg-slate-900/60 border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-mono font-bold text-white">Switch B</div>
                      <div className="text-[10px] font-mono text-slate-400">Inverter Feed</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                      switchB ? "bg-rose-500 text-white shadow" : "bg-slate-800 text-slate-400"
                    }`}>
                      {switchB ? "1 (ON)" : "0 (OFF)"}
                    </span>
                  </div>

                  {/* Switch C */}
                  <div 
                    onClick={() => handleToggle("C")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      switchC 
                        ? "bg-emerald-950/60 border-emerald-400 shadow-md shadow-emerald-500/20" 
                        : "bg-slate-900/60 border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-mono font-bold text-white">Switch C</div>
                      <div className="text-[10px] font-mono text-slate-400">Relay Primary</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                      switchC ? "bg-emerald-400 text-black shadow" : "bg-slate-800 text-slate-400"
                    }`}>
                      {switchC ? "1 (ON)" : "0 (OFF)"}
                    </span>
                  </div>

                  {/* Switch D */}
                  <div 
                    onClick={() => handleToggle("D")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      switchD 
                        ? "bg-indigo-950/60 border-indigo-400 shadow-md shadow-indigo-500/20" 
                        : "bg-slate-900/60 border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-mono font-bold text-white">Switch D</div>
                      <div className="text-[10px] font-mono text-slate-400">Relay Aux</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                      switchD ? "bg-indigo-400 text-black shadow" : "bg-slate-800 text-slate-400"
                    }`}>
                      {switchD ? "1 (ON)" : "0 (OFF)"}
                    </span>
                  </div>
                </div>

                {/* Column 2: Stage 1 Gates */}
                <div className="space-y-4">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 text-center font-bold">
                    STAGE 1 GATES
                  </div>

                  {/* NOT Gate on Switch B */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    gate1Out 
                      ? "bg-rose-950/40 border-rose-400 shadow-sm" 
                      : "bg-slate-900/50 border-slate-800 opacity-70"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-xs border border-rose-500/30">
                        NOT Gate
                      </span>
                      <span className={`text-xs font-mono font-bold ${gate1Out ? "text-rose-400" : "text-slate-500"}`}>
                        Output: {gate1Out ? "1" : "0"}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-2">
                      Input B: {switchB ? "1" : "0"} ➜ <strong className="text-white">NOT({switchB ? "1" : "0"}) = {gate1Out ? "1" : "0"}</strong>
                    </p>
                  </div>

                  {/* OR Gate on Switch C and D */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    gate3Out 
                      ? "bg-cyan-950/40 border-cyan-400 shadow-sm" 
                      : "bg-slate-900/50 border-slate-800 opacity-70"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs border border-cyan-500/30">
                        OR Gate
                      </span>
                      <span className={`text-xs font-mono font-bold ${gate3Out ? "text-cyan-400" : "text-slate-500"}`}>
                        Output: {gate3Out ? "1" : "0"}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-2">
                      C({switchC ? "1" : "0"}) OR D({switchD ? "1" : "0"}) ➜ <strong className="text-white">{gate3Out ? "1 (ACTIVE)" : "0"}</strong>
                    </p>
                  </div>
                </div>

                {/* Column 3: Stage 2 Gates */}
                <div className="space-y-4">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 text-center font-bold">
                    STAGE 2 GATES
                  </div>

                  {/* AND Gate on Switch A and NOT(B) */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    gate2Out 
                      ? "bg-amber-950/40 border-amber-400 shadow-sm" 
                      : "bg-slate-900/50 border-slate-800 opacity-70"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                        AND Gate 1
                      </span>
                      <span className={`text-xs font-mono font-bold ${gate2Out ? "text-amber-400" : "text-slate-500"}`}>
                        Output: {gate2Out ? "1" : "0"}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-2">
                      A({switchA ? "1" : "0"}) AND NOT(B)({gate1Out ? "1" : "0"}) ➜ <strong className="text-white">{gate2Out ? "1 (ACTIVE)" : "0"}</strong>
                    </p>
                  </div>

                  {/* Connecting conduit description */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400">
                    <span className="text-slate-300 font-semibold block mb-1">Signal Conduits:</span>
                    Route 1: {gate2Out ? "⚡ Line 1 Powered" : "❌ Line 1 Inactive"} <br />
                    Route 2: {gate3Out ? "⚡ Line 2 Powered" : "❌ Line 2 Inactive"}
                  </div>
                </div>

                {/* Column 4: Terminal Unlock Master Gate */}
                <div className="space-y-4">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 text-center font-bold">
                    FINAL GATE & OUTPUT
                  </div>

                  <div className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                    finalOutput 
                      ? "bg-emerald-950/60 border-emerald-400 shadow-xl shadow-emerald-500/20" 
                      : "bg-slate-950 border-slate-800"
                  }`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono font-bold text-xs">
                          MASTER AND GATE
                        </span>
                        {finalOutput ? (
                          <Unlock className="w-5 h-5 text-emerald-400 animate-bounce" />
                        ) : (
                          <Lock className="w-5 h-5 text-rose-400" />
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-300">
                        Evaluates: <br />
                        <span className="text-amber-300">Route 1 ({gate2Out ? "1" : "0"})</span> AND <span className="text-cyan-300">Route 2 ({gate3Out ? "1" : "0"})</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 text-center">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Terminal Power</div>
                      <div className={`text-lg font-mono font-extrabold mt-1 ${
                        finalOutput ? "text-emerald-400 animate-pulse" : "text-rose-500"
                      }`}>
                        {finalOutput ? "1 • UNLOCKED" : "0 • LOCKED"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs font-mono text-slate-400">
                {finalOutput ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Correct logic combination established! Terminal is ready to unlock.
                  </span>
                ) : (
                  <span className="text-amber-400/90 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Toggle switches to satisfy all gate requirements.
                  </span>
                )}
              </div>

              <Button
                onClick={handleValidateAndUnlock}
                disabled={!finalOutput}
                className={`h-11 px-6 font-mono font-bold rounded-xl transition-all shadow-lg ${
                  finalOutput 
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 scale-105" 
                    : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                }`}
              >
                <Zap className="w-4 h-4 mr-2" />
                RESTORE RESEARCH TERMINAL
              </Button>
            </div>
          </div>
        )}

        {/* MAIN BODY: VIEW 2 - DECRYPTED RESEARCH REPORT */}
        {showReport && (
          <div className="mt-4 space-y-5 animate-fade-in font-sans">
            {/* Success Notification Banner */}
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-300 font-mono">
                    TERMINAL UNLOCKED: RESEARCH REPORT DECRYPTED
                  </h4>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    The electronic control panel combination was accepted. Confidential laboratory audit logs retrieved.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded shrink-0">
                AUTH: GRANTED
              </span>
            </div>

            {/* Evidence Report Document Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              {/* Left Column: Report Visual Inspection Image */}
              <div className="rounded-xl overflow-hidden border border-rose-500/30 bg-slate-950 shadow-lg flex flex-col justify-between group">
                <div className="relative">
                  <img
                    src="/evidence/research_report.jpg"
                    alt="Scientific Research Audit Report"
                    className="w-full h-64 object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-rose-600/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    EVIDENCE: SECTION 4.2 ALTERED BY DR. NEHA SEN
                  </div>
                </div>
                <div className="p-3 bg-black/60 border-t border-white/10 text-xs font-mono text-slate-300">
                  <span className="text-rose-400 font-bold">DISCREPANCY DETECTED:</span> Toxicity levels manipulated (+250 ppm) to hide fatal trial defects.
                </div>
              </div>

              {/* Right Column: Comparative Findings & Narrative Revelation */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono">
                    <div className="text-slate-400 uppercase text-[10px] tracking-wider mb-2 font-bold">
                      DATA COMPARISON SUMMARY (SECTION 4.2)
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 rounded bg-black/40 border border-white/5">
                        <span className="text-slate-400">Original Baseline (Dr. Verma):</span>
                        <span className="text-emerald-400 font-bold">Toxicity 540 ppm • Stability 88.5%</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-rose-950/40 border border-rose-500/30">
                        <span className="text-rose-300 font-semibold">Current Altered Data:</span>
                        <span className="text-rose-400 font-bold">Toxicity 790 ppm • Stability 64.2%</span>
                      </div>
                    </div>
                  </div>

                  {/* The Crucial Narrative Revelations from Prompt */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 space-y-2">
                    <h5 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" /> Detective Notes:
                    </h5>
                    <ul className="text-xs text-slate-200 space-y-1.5 leading-relaxed">
                      <li className="flex items-start gap-1.5">
                        <span className="text-amber-400">▸</span>
                        <span><strong>Original experiment results ≠ current results.</strong></span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-amber-400">▸</span>
                        <span>Someone had deliberately changed the research.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-amber-400">▸</span>
                        <span>More importantly, the report shows that <strong>Neha was responsible for the section that was altered</strong>.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-amber-400">▸</span>
                        <span className="text-amber-300 font-semibold italic">Now the motive starts becoming clear.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Bottom Buttons */}
                <div className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setEvidenceSaved(true)}
                      className={`flex-1 h-10 text-xs font-mono font-semibold rounded-lg border transition-all ${
                        evidenceSaved 
                          ? "bg-emerald-600/30 border-emerald-500/40 text-emerald-300" 
                          : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                      }`}
                    >
                      {evidenceSaved ? "✓ Logged in Detective Casebook" : "📋 Record Evidence to Case File"}
                    </Button>

                    {onProceedToMonitor && (
                      <Button
                        onClick={() => {
                          onClose();
                          onProceedToMonitor();
                        }}
                        className="flex-1 h-10 text-xs font-mono font-bold rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/30 flex items-center justify-center gap-1.5"
                      >
                        Inspect Monitor (Puzzle 4)
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
