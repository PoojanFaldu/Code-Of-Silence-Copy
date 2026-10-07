import { useState } from "react";

interface NetworkPortPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

const PORT_REF = [
  { port: "21", service: "FTP" },
  { port: "22", service: "SSH" },
  { port: "25", service: "SMTP" },
  { port: "53", service: "DNS" },
  { port: "80", service: "HTTP" },
  { port: "443", service: "HTTPS / SSL" },
];

const SERVICES = [
  { id: "ftp", label: "FTP", port: "21", hint: "File transfer (not encrypted by default)" },
  { id: "ssh", label: "SSH", port: "22", hint: "Secure remote shell" },
  { id: "smtp", label: "SMTP", port: "25", hint: "Email delivery" },
  { id: "dns", label: "DNS", port: "53", hint: "Name lookup" },
  { id: "http", label: "HTTP", port: "80", hint: "Web — not secure" },
  { id: "https", label: "HTTPS / SSL", port: "443", hint: "Secure web connection" },
];

export default function NetworkPortPuzzle({ onSolved, onClose }: NetworkPortPuzzleProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [portInput, setPortInput] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [solved, setSolved] = useState(false);

  const selectedService = SERVICES.find((s) => s.id === selected) ?? null;

  const tryUnlock = (port: string, serviceOk: boolean) => {
    const normalized = port.replace(/\D/g, "");
    if (normalized === "443" && serviceOk) {
      setSolved(true);
      setMessage({ text: "Secure archive connection established.", ok: true });
      setTimeout(onSolved, 900);
      return;
    }
    if (serviceOk && normalized && normalized !== "443") {
      setMessage({
        text: `${selectedService?.label} uses port ${selectedService?.port} — but the archive needs a secure web connection.`,
        ok: false,
      });
      return;
    }
    if (!serviceOk) {
      setMessage({
        text: "Wrong service. The clue says: secure web connection.",
        ok: false,
      });
      return;
    }
    setMessage({ text: "Enter the port number for the selected service.", ok: false });
  };

  const handleSubmit = () => {
    if (solved) return;
    const isHttps = selected === "https";
    tryUnlock(portInput, isHttps);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl border border-sky-500/30 bg-[#071018] shadow-2xl overflow-hidden my-4">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-sky-200">Secure Archive Connection</h2>
            <p className="text-xs text-slate-400 mt-1">
              Identify the correct service used to access Verma&apos;s archived research.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-3 py-1 text-sm text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="rounded-lg border border-amber-400/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-100">
            Clue: <strong>&quot;The archive can only be accessed through a secure web connection.&quot;</strong>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Reference Card — Common Ports</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PORT_REF.map((row) => (
                <div
                  key={row.port}
                  className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 font-mono text-xs text-slate-300"
                >
                  <span className="text-sky-300">{row.port}</span>
                  <span className="text-slate-500"> → </span>
                  {row.service}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Select service</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {SERVICES.map((svc) => {
                const active = selected === svc.id;
                return (
                  <button
                    key={svc.id}
                    disabled={solved}
                    onClick={() => {
                      setSelected(svc.id);
                      setPortInput(svc.port);
                      setMessage(null);
                    }}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? "border-sky-400/60 bg-sky-500/15"
                        : "border-white/10 bg-black/30 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-100">{svc.label}</span>
                      <span className="font-mono text-xs text-sky-300">:{svc.port}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{svc.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-slate-500">Confirm port number</label>
            <div className="flex gap-2">
              <input
                value={portInput}
                onChange={(e) => setPortInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                disabled={solved}
                placeholder="e.g. 443"
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
