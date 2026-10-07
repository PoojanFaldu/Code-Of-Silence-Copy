import { useMemo, useState } from "react";

interface LogicGatesPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

export default function LogicGatesPuzzle({ onSolved, onClose }: LogicGatesPuzzleProps) {
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [c, setC] = useState(true);
  const [message, setMessage] = useState("");
  const [solved, setSolved] = useState(false);

  const andOut = a && b;
  const notOut = !c;
  const finalOut = andOut || notOut;

  const status = useMemo(
    () => ({
      andOut,
      notOut,
      finalOut,
    }),
    [andOut, notOut, finalOut]
  );

  const handleRestore = () => {
    if (!status.finalOut) {
      setMessage("Output is LOW. Adjust the inputs using AND / OR / NOT rules.");
      return;
    }
    setSolved(true);
    setMessage("Circuit accepted. Research terminal restored.");
    setTimeout(onSolved, 1000);
  };

  const Toggle = ({
    label,
    value,
    onToggle,
  }: {
    label: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <button
      onClick={onToggle}
      disabled={solved}
      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-mono transition ${
        value
          ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
          : "border-white/15 bg-white/5 text-slate-300"
      }`}
    >
      <span>Input {label}</span>
      <span className={`rounded px-2 py-0.5 text-xs ${value ? "bg-emerald-400 text-black" : "bg-slate-700 text-slate-200"}`}>
        {value ? "ON" : "OFF"}
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-emerald-500/30 bg-[#07140f] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-emerald-200">Logic Gate Control Panel</h2>
            <p className="text-xs text-slate-400 mt-1">
              Only the correct combination will restore the research terminal.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-3 py-1 text-sm text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="grid gap-5 px-5 py-5 md:grid-cols-[1fr_1.2fr]">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Reference Card</p>
            <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-slate-300 space-y-1.5">
              <p>
                <span className="text-emerald-300 font-semibold">AND</span> → both inputs must be ON
              </p>
              <p>
                <span className="text-emerald-300 font-semibold">OR</span> → at least one input must be ON
              </p>
              <p>
                <span className="text-emerald-300 font-semibold">NOT</span> → reverses the input
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Toggle label="A" value={a} onToggle={() => !solved && setA((v) => !v)} />
              <Toggle label="B" value={b} onToggle={() => !solved && setB((v) => !v)} />
              <Toggle label="C" value={c} onToggle={() => !solved && setC((v) => !v)} />
            </div>
          </div>

          <div className="rounded-lg border border-emerald-400/20 bg-black/40 p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-3">Circuit</p>
            <div className="font-mono text-xs text-slate-300 space-y-3">
              <div className="rounded border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400 mb-2">Stage 1</p>
                <p>
                  A ({a ? "1" : "0"}) AND B ({b ? "1" : "0"}) →{" "}
                  <span className={status.andOut ? "text-emerald-300" : "text-rose-300"}>
                    {status.andOut ? "1" : "0"}
                  </span>
                </p>
              </div>
              <div className="rounded border border-white/10 bg-white/5 p-3">
                <p className="text-slate-400 mb-2">Stage 2</p>
                <p>
                  NOT C ({c ? "1" : "0"}) →{" "}
                  <span className={status.notOut ? "text-emerald-300" : "text-rose-300"}>
                    {status.notOut ? "1" : "0"}
                  </span>
                </p>
              </div>
              <div className="rounded border border-emerald-400/30 bg-emerald-500/10 p-3">
                <p className="text-slate-400 mb-2">Output</p>
                <p>
                  (A ∧ B) ∨ (¬C) →{" "}
                  <span className={`text-base font-bold ${status.finalOut ? "text-emerald-300" : "text-rose-300"}`}>
                    {status.finalOut ? "HIGH" : "LOW"}
                  </span>
                </p>
              </div>
            </div>

            <div
              className={`mt-4 flex items-center justify-between rounded-md border px-3 py-2 ${
                status.finalOut
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-400/30 bg-rose-500/10 text-rose-200"
              }`}
            >
              <span className="text-sm">Terminal lock</span>
              <span className="font-mono text-xs">{status.finalOut ? "READY" : "LOCKED"}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-5 py-4 flex items-center justify-between gap-3">
          {message ? (
            <p className={`text-sm ${solved ? "text-emerald-300" : "text-amber-300"}`}>{message}</p>
          ) : (
            <p className="text-sm text-slate-500">Drive the final output HIGH to restore the terminal.</p>
          )}
          <button
            onClick={handleRestore}
            disabled={solved}
            className="shrink-0 rounded-md bg-emerald-500/20 border border-emerald-400/40 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            {solved ? "Unlocked" : "Restore Terminal"}
          </button>
        </div>
      </div>
    </div>
  );
}
