import React, { useState, useEffect, useRef } from "react";
import { 
  X, Tv, CheckCircle2, AlertTriangle, ShieldCheck, 
  RefreshCw, Play, Search, Eye, Sparkles, Video, Power, Cable
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  playJackPlug, playJackUnplug, playSignalRestore, playSuccessChime 
} from "./audio";

interface CablePatchingPuzzleProps {
  isOpen: boolean;
  onClose: () => void;
  onSolved: () => void;
  initialSolved?: boolean;
}

interface Terminal {
  id: string;
  unit: string;
  label: string;
  type: "source" | "target";
  color: string;
}

interface Connection {
  from: string;
  to: string;
}

const TERMINALS: Record<string, Terminal> = {
  camera_out: {
    id: "camera_out",
    unit: "LAB-CAM-02",
    label: "Camera Video Out",
    type: "source",
    color: "#f59e0b", // Amber/Gold Coax
  },
  power_out: {
    id: "power_out",
    unit: "POWER BUS",
    label: "Power 12V Out",
    type: "source",
    color: "#ef4444", // Red Power
  },
  decoder_vin: {
    id: "decoder_vin",
    unit: "DECODER UNIT",
    label: "Decoder Video In",
    type: "target",
    color: "#f59e0b",
  },
  decoder_pwr: {
    id: "decoder_pwr",
    unit: "DECODER UNIT",
    label: "Decoder Power In",
    type: "target",
    color: "#ef4444",
  },
  decoder_vout: {
    id: "decoder_vout",
    unit: "DECODER UNIT",
    label: "Decoder Video Out",
    type: "source",
    color: "#06b6d4", // Cyan Signal
  },
  monitor_in: {
    id: "monitor_in",
    unit: "LAB MONITOR",
    label: "Monitor Signal In",
    type: "target",
    color: "#06b6d4",
  },
};

export const CablePatchingPuzzle: React.FC<CablePatchingPuzzleProps> = ({
  isOpen,
  onClose,
  onSolved,
  initialSolved = false,
}) => {
  // Connections state: array of { from, to }
  const [connections, setConnections] = useState<Connection[]>(() => {
    if (initialSolved) {
      return [
        { from: "camera_out", to: "decoder_vin" },
        { from: "power_out", to: "decoder_pwr" },
        { from: "decoder_vout", to: "monitor_in" },
      ];
    }
    return [];
  });

  const [selectedTerminal, setSelectedTerminal] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState<boolean>(initialSolved);
  const [activeClueIndex, setActiveClueIndex] = useState<number>(0);
  const [evidenceSaved, setEvidenceSaved] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Check required connections:
  // 1. Camera -> Decoder (camera_out -> decoder_vin)
  // 2. Decoder -> Monitor (decoder_vout -> monitor_in)
  // 3. Power -> Decoder (power_out -> decoder_pwr)
  const hasCamToDecoder = connections.some(
    (c) => (c.from === "camera_out" && c.to === "decoder_vin") || (c.from === "decoder_vin" && c.to === "camera_out")
  );

  const hasPwrToDecoder = connections.some(
    (c) => (c.from === "power_out" && c.to === "decoder_pwr") || (c.from === "decoder_pwr" && c.to === "power_out")
  );

  const hasDecoderToMonitor = connections.some(
    (c) => (c.from === "decoder_vout" && c.to === "monitor_in") || (c.from === "monitor_in" && c.to === "decoder_vout")
  );

  const isAllConnected = hasCamToDecoder && hasPwrToDecoder && hasDecoderToMonitor;

  // Trigger restore when all 3 are plugged
  useEffect(() => {
    if (isAllConnected && !isRestored) {
      playSignalRestore();
      setTimeout(() => {
        playSuccessChime();
        setIsRestored(true);
        onSolved();
        try {
          sessionStorage.setItem("room2_puzzle4_solved", "true");
        } catch {
          // ignore
        }
      }, 700);
    }
  }, [isAllConnected, isRestored, onSolved]);

  // Terminal click handler
  const handleTerminalClick = (terminalId: string) => {
    if (isRestored) return;

    if (!selectedTerminal) {
      // Pick first terminal
      playJackPlug();
      setSelectedTerminal(terminalId);
    } else {
      // If clicking same terminal, deselect
      if (selectedTerminal === terminalId) {
        playJackUnplug();
        setSelectedTerminal(null);
        return;
      }

      // Check if connection already exists with either terminal, remove if so
      const filtered = connections.filter(
        (c) => c.from !== selectedTerminal && c.to !== selectedTerminal && c.from !== terminalId && c.to !== terminalId
      );

      // Add new connection
      playJackPlug();
      setConnections([...filtered, { from: selectedTerminal, to: terminalId }]);
      setSelectedTerminal(null);
    }
  };

  const handleDisconnect = (terminalId: string) => {
    if (isRestored) return;
    playJackUnplug();
    setConnections(connections.filter((c) => c.from !== terminalId && c.to !== terminalId));
  };

  const handleReset = () => {
    playJackUnplug();
    setConnections([]);
    setSelectedTerminal(null);
    setIsRestored(false);
  };

  const isConnected = (id: string) => {
    return connections.some((c) => c.from === id || c.to === id);
  };

  const getConnectedTarget = (id: string) => {
    const conn = connections.find((c) => c.from === id || c.to === id);
    if (!conn) return null;
    const otherId = conn.from === id ? conn.to : conn.from;
    return TERMINALS[otherId];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        ref={containerRef}
        className="relative w-full max-w-4xl my-auto rounded-2xl border border-rose-500/30 bg-gradient-to-b from-slate-950 via-[#10070b] to-black p-4 sm:p-6 shadow-2xl shadow-rose-950/40 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-rose-500/20">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg border shadow-inner transition-colors ${
              isRestored 
                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-400" 
                : "bg-rose-500/20 border-rose-400/40 text-rose-400"
            }`}>
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold uppercase">
                  LAB CCTV MONITOR • PUZZLE 4
                </span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                  isRestored ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400 font-bold animate-pulse"
                }`}>
                  {isRestored ? "SIGNAL RESTORED (1080p)" : "SIGNAL LOST"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5 font-display">
                Monitor Cable Patching Interface
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

        {/* VIEW 1: UNRESTORED (SIGNAL LOST + 2D CABLE PATCHING INTERFACE) */}
        {!isRestored && (
          <div className="mt-4 space-y-4">
            {/* Monitor Screen Simulation Display */}
            <div className="relative overflow-hidden rounded-xl border border-rose-500/40 bg-black p-6 shadow-2xl flex flex-col items-center justify-center min-h-[140px]">
              {/* Scanline and noise effect */}
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,0,0,0.15)_0%,rgba(0,0,0,0.95)_100%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

              <div className="relative z-10 text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-rose-950/80 border border-rose-500/50 text-rose-400 font-mono text-xs font-bold tracking-widest animate-pulse">
                  <AlertTriangle className="w-4 h-4" /> FEED SEVERED: NO SYNC
                </div>
                <h3 className="text-2xl sm:text-3xl font-mono font-extrabold tracking-widest text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]">
                  SIGNAL LOST
                </h3>
                <p className="text-xs font-mono text-slate-400">
                  Connect patch cables below to route CCTV feeds into decoder and monitor.
                </p>
              </div>
            </div>

            {/* Patching Instructions / Objectives Box */}
            <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-xs font-mono">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Cable className="w-4 h-4 text-cyan-400" /> REQUIRED PATCH CONNECTIONS:
                </span>
                <span className="text-slate-400 text-[11px]">
                  Click source port, then click destination port
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className={`p-2 rounded border flex items-center justify-between ${
                  hasCamToDecoder ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" : "bg-black/40 border-white/10 text-slate-300"
                }`}>
                  <span>1. Camera ➜ Decoder</span>
                  <span className="font-bold">{hasCamToDecoder ? "✓ SYNCED" : "OFFLINE"}</span>
                </div>
                <div className={`p-2 rounded border flex items-center justify-between ${
                  hasDecoderToMonitor ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" : "bg-black/40 border-white/10 text-slate-300"
                }`}>
                  <span>2. Decoder ➜ Monitor</span>
                  <span className="font-bold">{hasDecoderToMonitor ? "✓ LINKED" : "OFFLINE"}</span>
                </div>
                <div className={`p-2 rounded border flex items-center justify-between ${
                  hasPwrToDecoder ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" : "bg-black/40 border-white/10 text-slate-300"
                }`}>
                  <span>3. Power ➜ Decoder</span>
                  <span className="font-bold">{hasPwrToDecoder ? "✓ POWERED" : "OFFLINE"}</span>
                </div>
              </div>
            </div>

            {/* 2D Cable Patching Bay */}
            <div className="p-4 sm:p-5 rounded-xl border border-slate-700 bg-slate-950/80 shadow-inner">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  2D PATCH MATRIX • CLICK JACKS TO CONNECT / DISCONNECT
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 text-xs font-mono text-slate-400 hover:text-white"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Reset Wires
                </Button>
              </div>

              {/* Hardware Units Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column 1: Sources (Camera & Power) */}
                <div className="space-y-4">
                  {/* Camera Unit */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                        <Video className="w-4 h-4" /> LAB-CAM-02
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">
                        RF Camera Source
                      </span>
                    </div>

                    <div 
                      onClick={() => handleTerminalClick("camera_out")}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
                        selectedTerminal === "camera_out"
                          ? "bg-amber-950 border-amber-400 ring-2 ring-amber-400/50"
                          : isConnected("camera_out")
                          ? "bg-amber-950/40 border-amber-500/80 text-amber-200"
                          : "bg-black/50 border-slate-700 hover:border-amber-400"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-mono font-bold">Camera Port</div>
                        <div className="text-[10px] font-mono text-slate-400">Coaxial Feed Out</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isConnected("camera_out") && (
                          <span 
                            onClick={(e) => { e.stopPropagation(); handleDisconnect("camera_out"); }}
                            className="text-[10px] text-rose-400 underline hover:text-rose-300"
                          >
                            Unplug
                          </span>
                        )}
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isConnected("camera_out") ? "bg-amber-400 border-amber-200 shadow-glow" : "bg-black border-slate-500"
                        }`} />
                      </div>
                    </div>
                  </div>

                  {/* Power Supply Unit */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-rose-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400">
                        <Power className="w-4 h-4" /> 12V AUX POWER
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300">
                        Supply Rail
                      </span>
                    </div>

                    <div 
                      onClick={() => handleTerminalClick("power_out")}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
                        selectedTerminal === "power_out"
                          ? "bg-rose-950 border-rose-400 ring-2 ring-rose-400/50"
                          : isConnected("power_out")
                          ? "bg-rose-950/40 border-rose-500/80 text-rose-200"
                          : "bg-black/50 border-slate-700 hover:border-rose-400"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-mono font-bold">Power Port</div>
                        <div className="text-[10px] font-mono text-slate-400">12V DC Supply Out</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isConnected("power_out") && (
                          <span 
                            onClick={(e) => { e.stopPropagation(); handleDisconnect("power_out"); }}
                            className="text-[10px] text-rose-400 underline hover:text-rose-300"
                          >
                            Unplug
                          </span>
                        )}
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isConnected("power_out") ? "bg-rose-500 border-rose-200 shadow-glow" : "bg-black border-slate-500"
                        }`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Digital Decoder Unit (Intermediate Processor) */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-1.5">
                        <Tv className="w-4 h-4" /> CCTV DECODER
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                        Decryption Hub
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 mb-3">
                      Requires Camera Feed & Power In, delivers Decoded Stream Out.
                    </p>

                    <div className="space-y-2.5">
                      {/* Decoder Video In */}
                      <div 
                        onClick={() => handleTerminalClick("decoder_vin")}
                        className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
                          selectedTerminal === "decoder_vin"
                            ? "bg-amber-950 border-amber-400 ring-2 ring-amber-400/50"
                            : isConnected("decoder_vin")
                            ? "bg-amber-950/40 border-amber-500/80 text-amber-200"
                            : "bg-black/50 border-slate-700 hover:border-amber-400"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-mono font-bold">Decoder Video In</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {getConnectedTarget("decoder_vin") ? `Linked: ${getConnectedTarget("decoder_vin")?.label}` : "Awaiting Camera"}
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isConnected("decoder_vin") ? "bg-amber-400 border-amber-200" : "bg-black border-slate-500"
                        }`} />
                      </div>

                      {/* Decoder Power In */}
                      <div 
                        onClick={() => handleTerminalClick("decoder_pwr")}
                        className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
                          selectedTerminal === "decoder_pwr"
                            ? "bg-rose-950 border-rose-400 ring-2 ring-rose-400/50"
                            : isConnected("decoder_pwr")
                            ? "bg-rose-950/40 border-rose-500/80 text-rose-200"
                            : "bg-black/50 border-slate-700 hover:border-rose-400"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-mono font-bold">Decoder Power In</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {getConnectedTarget("decoder_pwr") ? `Linked: ${getConnectedTarget("decoder_pwr")?.label}` : "Awaiting Power"}
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isConnected("decoder_pwr") ? "bg-rose-500 border-rose-200" : "bg-black border-slate-500"
                        }`} />
                      </div>

                      {/* Decoder Video Out */}
                      <div 
                        onClick={() => handleTerminalClick("decoder_vout")}
                        className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
                          selectedTerminal === "decoder_vout"
                            ? "bg-cyan-950 border-cyan-400 ring-2 ring-cyan-400/50"
                            : isConnected("decoder_vout")
                            ? "bg-cyan-950/40 border-cyan-500/80 text-cyan-200"
                            : "bg-black/50 border-slate-700 hover:border-cyan-400"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-mono font-bold">Decoder Video Out</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {getConnectedTarget("decoder_vout") ? `Linked: ${getConnectedTarget("decoder_vout")?.label}` : "Connect to Monitor"}
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isConnected("decoder_vout") ? "bg-cyan-400 border-cyan-200" : "bg-black border-slate-500"
                        }`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Destination (Laboratory Monitor) */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                        <Tv className="w-4 h-4" /> LAB MONITOR
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300">
                        Display Terminal
                      </span>
                    </div>

                    <div 
                      onClick={() => handleTerminalClick("monitor_in")}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
                        selectedTerminal === "monitor_in"
                          ? "bg-cyan-950 border-cyan-400 ring-2 ring-cyan-400/50"
                          : isConnected("monitor_in")
                          ? "bg-cyan-950/40 border-cyan-500/80 text-cyan-200"
                          : "bg-black/50 border-slate-700 hover:border-cyan-400"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-mono font-bold">Monitor Input Port</div>
                        <div className="text-[10px] font-mono text-slate-400">Signal In</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isConnected("monitor_in") && (
                          <span 
                            onClick={(e) => { e.stopPropagation(); handleDisconnect("monitor_in"); }}
                            className="text-[10px] text-rose-400 underline hover:text-rose-300"
                          >
                            Unplug
                          </span>
                        )}
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isConnected("monitor_in") ? "bg-cyan-400 border-cyan-200 shadow-glow" : "bg-black border-slate-500"
                        }`} />
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-black/60 border border-white/5 text-[11px] font-mono text-slate-300 space-y-1">
                      <div className="text-slate-400 font-semibold mb-1">Status Summary:</div>
                      <div>• Camera feed: {hasCamToDecoder ? "🟢 Mapped" : "🔴 Disconnected"}</div>
                      <div>• Decoder power: {hasPwrToDecoder ? "🟢 Powered" : "🔴 No Power"}</div>
                      <div>• Monitor feed: {hasDecoderToMonitor ? "🟢 Linked" : "🔴 No Input"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hint / Helper Bar */}
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>
                {selectedTerminal ? (
                  <span className="text-cyan-300 animate-pulse">
                    ⚡ Terminal selected: <strong>{TERMINALS[selectedTerminal]?.label}</strong>. Now click the matching port to connect.
                  </span>
                ) : (
                  <span>Click any port to start routing a patch cord.</span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* VIEW 2: RESTORED CCTV SURVEILLANCE RECORDING & EVIDENCE */}
        {isRestored && (
          <div className="mt-4 space-y-5 animate-fade-in font-sans">
            {/* Header restoration alert */}
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-300 font-mono">
                    DAMAGED CCTV RECORDING RESTORED
                  </h4>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    Hardware patch confirmed: Camera ➜ Decoder ➜ Monitor (Power synced). Security tape uncorrupted.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded shrink-0">
                100% RECOVERED
              </span>
            </div>

            {/* Restored Surveillance Footage Viewport */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              {/* Left Column: Authentic CCTV Display */}
              <div className="relative rounded-xl overflow-hidden border-2 border-slate-700 bg-black shadow-2xl flex flex-col justify-between group">
                <div className="relative">
                  <img
                    src="/evidence/cctv_lab_recording.jpg"
                    alt="Restored CCTV Footage - Research Lab"
                    className="w-full h-72 object-cover object-center"
                  />
                  {/* CCTV Surveillance HUD Overlays */}
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm border border-white/20 text-white font-mono text-[11px] px-2 py-1 rounded flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-bold">REC</span>
                    <span className="text-slate-300">28-OCT 02:41:18 AM</span>
                  </div>

                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm border border-white/20 text-white font-mono text-[11px] px-2 py-1 rounded">
                    CAM-02 [RESEARCH LAB]
                  </div>

                  {/* Highlight bounding box 1: Neha's bag */}
                  <div className="absolute bottom-12 right-24 border-2 border-amber-400 bg-amber-400/10 rounded px-2 py-0.5 text-[10px] font-mono text-amber-300 font-bold backdrop-blur-sm">
                    [!] NEHA'S RESEARCH BAG
                  </div>

                  {/* Highlight bounding box 2: Small rectangular object */}
                  <div className="absolute top-28 right-16 border-2 border-cyan-400 bg-cyan-400/10 rounded px-2 py-0.5 text-[10px] font-mono text-cyan-300 font-bold backdrop-blur-sm">
                    [?] RECTANGULAR OBJECT
                  </div>

                  {/* Scanline subtle layer */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none opacity-25" />
                </div>

                <div className="p-3 bg-black/80 border-t border-white/10 text-xs font-mono text-slate-300 flex items-center justify-between">
                  <span>FRAME TIME: 02:41:18 AM (Shortly before murder)</span>
                  <span className="text-emerald-400">AUDIO: MUTED</span>
                </div>
              </div>

              {/* Right Column: Narrative Forensic Revelations from Prompt */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono space-y-2">
                    <div className="text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                      CCTV FORENSIC BREAKDOWN
                    </div>
                    <p className="text-slate-200 leading-relaxed">
                      A person enters the laboratory shortly before the murder. Their face is turned away from the lens angle and obscured under a dark hood.
                    </p>
                  </div>

                  {/* The exact narrative points from user prompt */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-black border border-amber-500/30 space-y-2.5">
                    <h5 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" /> Key Evidence Captured on Tape:
                    </h5>

                    <div className="space-y-2 text-xs text-slate-200">
                      <div className="p-2.5 rounded-lg bg-black/50 border border-amber-500/20">
                        <span className="text-amber-400 font-bold block mb-1">1. Neha's Distinctive Research Bag:</span>
                        The recording clearly shows <strong>Neha's distinctive research bag</strong> slung over the figure's shoulder.
                        <p className="text-amber-200/90 italic mt-1">
                          "Now the players know Neha was probably in the lab around the relevant time. But there's still no proof that she killed Verma."
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/50 border border-cyan-500/20">
                        <span className="text-cyan-400 font-bold block mb-1">2. Mysterious Rectangular Object:</span>
                        The CCTV also shows someone carrying a <strong>small rectangular object</strong> into the lab.
                        <p className="text-cyan-200/90 italic mt-1">
                          "This becomes important later."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-2 pt-1">
                  <Button
                    onClick={() => setEvidenceSaved(true)}
                    className={`w-full h-11 text-xs font-mono font-semibold rounded-xl border transition-all ${
                      evidenceSaved 
                        ? "bg-emerald-600/30 border-emerald-500/40 text-emerald-300" 
                        : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                    }`}
                  >
                    {evidenceSaved ? "✓ CCTV Clue Recorded into Detective Notebook" : "📋 Record CCTV Evidence into Case File"}
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
