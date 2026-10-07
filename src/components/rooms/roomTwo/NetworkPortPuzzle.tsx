import { useState } from "react";

interface NetworkPortPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

const PORT_REF = [
  { port: "21", service: "FTP", note: "File transfer" },
  { port: "22", service: "SSH", note: "Remote shell" },
  { port: "25", service: "SMTP", note: "Mail delivery" },
  { port: "53", service: "DNS", note: "Name lookup" },
  { port: "80", service: "HTTP", note: "Unencrypted web" },
  { port: "443", service: "HTTPS / SSL", note: "Encrypted web" },
];

export default function NetworkPortPuzzle({ onSolved, onClose }: NetworkPortPuzzleProps) {
  const [portInput, setPortInput] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [solved, setSolved] = useState(false);

  const handleSubmit = () => {
    if (solved) return;
    const normalized = portInput.replace(/\D/g, "");
    if (normalized === "443") {
      setSolved(true);
      setMessage({ text: "Connection accepted.", ok: true });
      setTimeout(onSolved, 900);
      return;
    }
    if (!normalized) {
      setMessage({ text: "Enter a port number from the reference card.", ok: false });
      return;
    }
    setMessage({
      text: "Rejected. Re-read the terminal note and match it to the reference card.",
      ok: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl border border-sky-500/30 bg-[#071018] shadow-2xl overflow-hidden my-4">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-sky-200">Archive Gateway</h2>
            <p className="text-xs text-slate-400 mt-1">SECURE ARCHIVE CONNECTION REQUIRED</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-3 py-1 text-sm text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-xs text-slate-300 space-y-2">
            <p className="text-slate-500">// terminal.log — last admin note</p>
            <p>&quot;Shell access denied. Mail relay offline. Name service ignored.&quot;</p>
            <p>&quot;Only encrypted page traffic reaches the vault.&quot;</p>
            <p className="text-slate-500 pt-1">// end note</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Reference Card — Common Ports</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PORT_REF.map((row) => (
                <div
                  key={row.port}
                  className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 font-mono text-xs text-slate-300 flex justify-between gap-2"
                >
                  <span>
                    <span className="text-sky-300">{row.port}</span>
                    <span className="text-slate-500"> → </span>
                    {row.service}
                  </span>
                  <span className="text-slate-500">{row.note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-slate-500">Port number</label>
            <div className="flex gap-2">
              <input
                value={portInput}
                onChange={(e) => setPortInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                disabled={solved}
                placeholder="Enter port"
                className="flex-1 rounded-md border border-white/15 bg-black/40 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-sky-400/60"
              />
              <button
                onClick={handleSubmit}
                disabled={solved}
                className="rounded-md bg-sky-500/20 border border-sky-400/40 px-4 py-2 text-sm font-medium text-sky-100 hover:bg-sky-500/30 disabled:opacity-40"
              >
                Connect
              </button>
            </div>
          </div>

          {message && (
            <p className={`text-sm ${message.ok ? "text-emerald-400" : "text-amber-300"}`}>{message.text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
