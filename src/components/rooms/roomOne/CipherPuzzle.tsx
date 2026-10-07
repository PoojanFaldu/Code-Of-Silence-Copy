import { useState } from "react";

interface CipherPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

const CIPHERTEXT = "FKHFN WKH EOXH IROGHU";
const ANSWER = "CHECK THE BLUE FOLDER";

export default function CipherPuzzle({ onSolved, onClose }: CipherPuzzleProps) {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const normalize = (value: string) =>
    value
      .toUpperCase()
      .replace(/[^A-Z\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const handleSubmit = () => {
    if (normalize(input) === ANSWER) {
      setMessage({ text: "The message opens cleanly.", ok: true });
      setTimeout(onSolved, 900);
      return;
    }
    setMessage({
      text: "Not quite. Compare the sample pair again — every letter moves the same distance.",
      ok: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-violet-500/30 bg-[#100b16] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-violet-200">Encrypted Scrap</h2>
            <p className="text-xs text-slate-400 mt-1">Recovered from the concealed drawer</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-3 py-1 text-sm text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="rounded-lg border border-violet-400/20 bg-black/30 p-4 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-violet-300/70 mb-2">Ciphertext</p>
            <p className="font-mono text-xl tracking-widest text-violet-100">{CIPHERTEXT}</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-300 space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-violet-300/80">Reference · Caesar cipher</p>
            <p>Each letter is shifted by the same amount along the alphabet.</p>
            <div className="mt-2 rounded border border-violet-400/20 bg-black/30 px-3 py-2 font-mono text-xs text-violet-100">
              <p className="text-slate-500 mb-1">Margin sample Verma left:</p>
              <p>
                PLAIN <span className="text-emerald-300">CAT</span>
              </p>
              <p>
                CODE&nbsp; <span className="text-amber-300">FDW</span>
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Use the sample to find the shift amount, then apply it to the full ciphertext.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-400">Decoded message</label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Type the plaintext"
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-violet-400/60"
            />
          </div>

          {message && (
            <p className={`text-sm ${message.ok ? "text-emerald-400" : "text-rose-400"}`}>{message.text}</p>
          )}

          <button
            onClick={handleSubmit}
            className="w-full rounded-md bg-violet-500/25 border border-violet-400/40 px-4 py-2.5 text-sm font-medium text-violet-100 hover:bg-violet-500/35"
          >
            Submit Decode
          </button>
        </div>
      </div>
    </div>
  );
}
