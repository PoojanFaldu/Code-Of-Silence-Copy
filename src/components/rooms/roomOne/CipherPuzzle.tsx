import { useState } from "react";
import PuzzleShell, { PuzzlePrimaryButton } from "@/components/rooms/interaction/PuzzleShell";

interface CipherPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

const CIPHERTEXT = "FKHFN WKH EOXH IROGHU";
const ANSWER = "CHECK THE BLUE FOLDER";
const SHIFT = 3;
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function decodeLetter(ch: string): string {
  if (ch === " ") return " ";
  const i = ALPHA.indexOf(ch);
  if (i < 0) return ch;
  return ALPHA[(i - SHIFT + 26) % 26];
}

export default function CipherPuzzle({ onSolved, onClose }: CipherPuzzleProps) {
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
  };

  return (
    <PuzzleShell
      title="Cipher"
      accent="violet"
      onClose={onClose}
      tabs={[
        {
          id: "decode",
          label: "Decode",
          content: (
            <div className="space-y-4">
              <div className="rounded-xl bg-black/50 border border-white/10 p-4 text-center">
                <p className="font-mono text-lg sm:text-xl tracking-[0.2em] text-violet-100">{CIPHERTEXT}</p>
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
          label: "Map",
          content: (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
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
                    <span className="text-amber-300">{code}</span>
                    <span className="text-slate-600 mx-0.5">→</span>
                    <span className="text-emerald-300">{plain}</span>
                  </button>
                );
              })}
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
  );
}
