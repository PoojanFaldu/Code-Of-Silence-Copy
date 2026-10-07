import { useState } from "react";

interface CipherPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

const CIPHERTEXT = "FKHFN WKH EOXH IROGHU";
const SHIFT = 3;
const ANSWER = "CHECK THE BLUE FOLDER";

export default function CipherPuzzle({ onSolved, onClose }: CipherPuzzleProps) {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [preview, setPreview] = useState(false);

  const normalize = (value: string) =>
    value
      .toUpperCase()
      .replace(/[^A-Z\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const handleSubmit = () => {
    if (normalize(input) === ANSWER) {
      setMessage({ text: "Decoded. The blue folder is in this office — find it.", ok: true });
      setTimeout(onSolved, 900);
      return;
    }
    setMessage({ text: "That doesn't match. Remember: every letter shifts by the same amount.", ok: false });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-violet-500/30 bg-[#100b16] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-violet-200">Cipher Code</h2>
            <p className="text-xs text-slate-400 mt-1">Caesar Cipher · SHIFT = {SHIFT}</p>
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
            <p className="text-[11px] uppercase tracking-[0.2em] text-violet-300/70 mb-2">Encrypted Note</p>
            <p className="font-mono text-xl tracking-widest text-violet-100">{CIPHERTEXT}</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
            <p>
              <span className="text-violet-300 font-medium">Reference:</span> Caesar Cipher — every
              letter has been shifted by the same amount.
            </p>
            <p className="mt-1">
              <span className="text-violet-300 font-medium">SHIFT =</span> {SHIFT}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-400">Your decode</label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Enter the decoded message"
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-violet-400/60"
            />
          </div>

          {message && (
            <p className={`text-sm ${message.ok ? "text-emerald-400" : "text-rose-400"}`}>{message.text}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPreview((v) => !v)}
              className="rounded-md border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
            >
              {preview ? "Hide helper" : "Show shift helper"}
            </button>
            <button
              onClick={handleSubmit}
              className="ml-auto rounded-md bg-violet-500/25 border border-violet-400/40 px-4 py-2 text-sm font-medium text-violet-100 hover:bg-violet-500/35"
            >
              Submit Decode
            </button>
          </div>

          {preview && (
            <div className="rounded-md border border-dashed border-violet-400/30 bg-violet-500/5 p-3 font-mono text-xs text-violet-200/90">
              Shift each letter back by {SHIFT}: D→A · E→B · F→C · G→D · H→E · …
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
