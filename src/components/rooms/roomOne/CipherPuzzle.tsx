import { useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";
import { useGame } from "@/contexts/GameContext";
import { formatMissionTime } from "@/components/common/GlobalTimer";
import { AlertTriangle, Clock, Lock, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

interface CipherPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

const CIPHERTEXT = "FKHFN WKH EOXH IROGHU";
const ANSWER = "CHECK THE BLUE FOLDER";
const SHIFT = 3;
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const PENALTY_SECONDS = 300; // 5 minutes

function decodeLetter(ch: string): string {
  if (ch === " ") return " ";
  const i = ALPHA.indexOf(ch);
  if (i < 0) return ch;
  return ALPHA[(i - SHIFT + 26) % 26];
}

export default function CipherPuzzle({ onSolved, onClose }: CipherPuzzleProps) {
  const { deductTime, timeRemaining, penalizeWrongAnswer } = useGame();
  const [activeTab, setActiveTab] = useState("decode");
  const [mapUnlocked, setMapUnlocked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  const normalize = (value: string) =>
    value
      .toUpperCase()
      .replace(/[^A-Z\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const handleSubmit = () => {
    if (normalize(input) === ANSWER) {
      onSolved();
      return;
    }
    setError(true);
    penalizeWrongAnswer();
  };

  const handleTabChange = (targetTab: string) => {
    if (targetTab === "map" && !mapUnlocked) {
      setShowConfirmModal(true);
      return;
    }
    setActiveTab(targetTab);
  };

  const handleConfirmDeduct = () => {
    deductTime(PENALTY_SECONDS);
    setMapUnlocked(true);
    setShowConfirmModal(false);
    setActiveTab("map");
    toast.error("5:00 deducted from mission timer for Map section clues.");
  };

  const estimatedNewTime = Math.max(0, timeRemaining - PENALTY_SECONDS);

  return (
    <div className="relative">
      <PuzzleShell
        title="Cipher"
        accent="violet"
        onClose={onClose}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={[
          {
            id: "decode",
            label: "Decode",
            content: (
              <div className="space-y-4">
                <div className="rounded-xl bg-black/50 border border-white/10 p-4 text-center">
                  <p className="font-mono text-lg sm:text-xl tracking-[0.2em] text-violet-100">
                    {CIPHERTEXT}
                  </p>
                </div>
                <div className="flex justify-center gap-5 font-mono text-sm">
                  {[
                    ["C", "F"],
                    ["A", "D"],
                    ["T", "W"],
                  ].map(([p, c]) => (
                    <button
                      key={p}
                      type="button"
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 hover:border-violet-400/40 transition"
                      onMouseEnter={() => setHover(c)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <div className="text-emerald-300 font-bold">{p}</div>
                      <div className="text-[10px] text-slate-500">+3</div>
                      <div className="text-amber-300 font-bold">{c}</div>
                    </button>
                  ))}
                </div>
                <input
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setError(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Decoded message"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 font-mono text-sm text-white outline-none focus:border-violet-400/50"
                  autoComplete="off"
                />
                {error && <p className="text-xs text-rose-400 text-center">Try again</p>}
              </div>
            ),
          },
          {
            id: "map",
            label: mapUnlocked ? "Map (Unlocked)" : "Map (-5 Mins)",
            content: (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-violet-950/30 border border-violet-500/20 text-[11px] font-mono text-violet-200">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    Alphabet Substitution Clues Active
                  </span>
                  <span className="text-slate-400">Shift Key: -3</span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-[45vh] overflow-y-auto p-0.5">
                  {ALPHA.map((code) => {
                    const plain = decodeLetter(code);
                    const lit = hover === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setInput((v) => v + plain)}
                        className={`rounded-lg border px-1.5 py-2 font-mono text-xs transition ${
                          lit
                            ? "border-violet-400/60 bg-violet-500/20"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                        }`}
                        title={`Insert ${plain}`}
                      >
                        <span className="text-amber-300 font-bold">{code}</span>
                        <span className="text-slate-600 mx-0.5">→</span>
                        <span className="text-emerald-300 font-bold">{plain}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ),
          },
        ]}
        footer={
          <PuzzlePrimaryButton accent="violet" onClick={handleSubmit}>
            DECODE
          </PuzzlePrimaryButton>
        }
      />

      {/* Confirmation Prompt Modal for Map Section */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-amber-500/40 bg-[#0c0d14] p-5 sm:p-6 shadow-2xl shadow-amber-950/50">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 h-7 w-7 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white flex items-center justify-center transition"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Warning header */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider text-amber-200">
                  Time Penalty Warning
                </h3>
                <p className="text-xs text-amber-400/80 font-mono">MAP SECTION ACCESS</p>
              </div>
            </div>

            {/* Core message */}
            <div className="rounded-xl border border-white/10 bg-black/50 p-4 mb-4 space-y-2.5">
              <p className="text-sm font-semibold text-white leading-snug">
                5 mins will be deducted for using the map section.
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Opening the Map tab reveals the full decryption clues and character mapping for this
                cipher, but costs <strong className="text-amber-300">5 minutes</strong> from your
                countdown timer.
              </p>

              {/* Time preview */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 font-mono text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Current Time:
                </span>
                <span className="text-cyan-300 font-bold">
                  {formatMissionTime(timeRemaining)}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-red-400 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-red-400" /> After -5:00 Penalty:
                </span>
                <span className="text-red-400 font-bold">
                  {formatMissionTime(estimatedNewTime)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeduct}
                className="flex-1 rounded-xl border border-amber-500/50 bg-amber-500/20 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-500/30 hover:border-amber-400 shadow-lg shadow-amber-950/40 transition"
              >
                Confirm (-5 Mins)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
