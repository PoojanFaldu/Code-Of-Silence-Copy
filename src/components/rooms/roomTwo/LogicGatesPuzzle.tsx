import { useMemo, useState } from "react";

interface LogicGatesPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

/**
 * Unique solution: A=1, B=1, C=0, D=1, E=0
 * OUT1 = A AND B        → need 1
 * OUT2 = NOT C          → need 1
 * OUT3 = D AND (NOT E)  → need 1
 * OUT4 = B OR D         → need 1
 */
const TARGET = { out1: true, out2: true, out3: true, out4: true };

function wire(on: boolean) {
  return on ? "#34d399" : "#475569";
}

function Gate({
  x,
  y,
  w = 78,
  label,
  on,
}: {
  x: number;
  y: number;
  w?: number;
  label: string;
  on: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={36}
        rx={7}
        fill={on ? "rgba(52,211,153,0.2)" : "#0f172a"}
        stroke={on ? "#34d399" : "#64748b"}
        strokeWidth={2}
      />
      <text
        x={x + w / 2}
        y={y + 23}
        textAnchor="middle"
        fill={on ? "#d1fae5" : "#cbd5e1"}
        fontSize="12"
        fontWeight="700"
        fontFamily="ui-monospace, monospace"
      >
        {label}
      </text>
    </g>
  );
}

function InputNode({ x, y, label, on }: { x: number; y: number; label: string; on: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={14} fill={on ? "#34d399" : "#1e293b"} stroke="#94a3b8" strokeWidth={2} />
      <text x={x} y={y + 4} textAnchor="middle" fill={on ? "#052e1b" : "#e2e8f0"} fontSize="12" fontWeight="700">
        {label}
      </text>
    </g>
  );
}

function OutputNode({
  x,
  y,
  label,
  on,
  matched,
}: {
  x: number;
  y: number;
  label: string;
  on: boolean;
  matched: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y - 15}
        width={72}
        height={30}
        rx={6}
        fill={matched ? "rgba(52,211,153,0.25)" : "#0f172a"}
        stroke={matched ? "#34d399" : "#64748b"}
        strokeWidth={2}
      />
      <text x={x + 36} y={y + 4} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="700">
        {label}:{on ? "1" : "0"}
      </text>
    </g>
  );
}

function CircuitDiagram({
  a,
  b,
  c,
  d,
  e,
  out1,
  out2,
  notE,
  out3,
  out4,
}: {
  a: boolean;
  b: boolean;
  c: boolean;
  d: boolean;
  e: boolean;
  out1: boolean;
  out2: boolean;
  notE: boolean;
  out3: boolean;
  out4: boolean;
}) {
  // Each row owns a horizontal band. Shared inputs travel on left rails only.
  const rows = [48, 118, 188, 258];

  return (
    <svg viewBox="0 0 560 310" className="w-full h-auto rounded-lg border border-emerald-400/20 bg-[#04100c]">
      {/* Input column */}
      <InputNode x={32} y={rows[0] - 12} label="A" on={a} />
      <InputNode x={32} y={rows[0] + 28} label="B" on={b} />
      <InputNode x={32} y={rows[1]} label="C" on={c} />
      <InputNode x={32} y={rows[2] - 12} label="D" on={d} />
      <InputNode x={32} y={rows[2] + 28} label="E" on={e} />

      {/* Left stub rails (no crossing in gate area) */}
      <line x1={46} y1={rows[0] - 12} x2={120} y2={rows[0] - 12} stroke={wire(a)} strokeWidth={3} />
      <line x1={46} y1={rows[0] + 28} x2={120} y2={rows[0] + 28} stroke={wire(b)} strokeWidth={3} />
      <line x1={120} y1={rows[0] - 12} x2={120} y2={rows[0] - 2} stroke={wire(a)} strokeWidth={3} />
      <line x1={120} y1={rows[0] + 28} x2={120} y2={rows[0] + 18} stroke={wire(b)} strokeWidth={3} />

      {/* Row 1: A AND B → OUT1 */}
      <Gate x={120} y={rows[0] - 18} label="AND" on={out1} />
      <line x1={198} y1={rows[0]} x2={450} y2={rows[0]} stroke={wire(out1)} strokeWidth={3} />
      <OutputNode x={450} y={rows[0]} label="OUT1" on={out1} matched={out1 === TARGET.out1} />
      <text x={300} y={rows[0] - 10} fill="#64748b" fontSize="11">
        need 1
      </text>

      {/* Row 2: NOT C → OUT2 */}
      <line x1={46} y1={rows[1]} x2={120} y2={rows[1]} stroke={wire(c)} strokeWidth={3} />
      <Gate x={120} y={rows[1] - 18} label="NOT" on={out2} />
      <line x1={198} y1={rows[1]} x2={450} y2={rows[1]} stroke={wire(out2)} strokeWidth={3} />
      <OutputNode x={450} y={rows[1]} label="OUT2" on={out2} matched={out2 === TARGET.out2} />
      <text x={300} y={rows[1] - 10} fill="#64748b" fontSize="11">
        need 1
      </text>

      {/* Row 3: D AND (NOT E) → OUT3 — NOT sits left of AND on same band */}
      <line x1={46} y1={rows[2] - 12} x2={100} y2={rows[2] - 12} stroke={wire(d)} strokeWidth={3} />
      <line x1={46} y1={rows[2] + 28} x2={100} y2={rows[2] + 28} stroke={wire(e)} strokeWidth={3} />
      <Gate x={100} y={rows[2] + 10} label="NOT" on={notE} w={64} />
      <line x1={164} y1={rows[2] + 28} x2={210} y2={rows[2] + 28} stroke={wire(notE)} strokeWidth={3} />
      <line x1={100} y1={rows[2] - 12} x2={210} y2={rows[2] - 12} stroke={wire(d)} strokeWidth={3} />
      <line x1={210} y1={rows[2] - 12} x2={210} y2={rows[2] - 2} stroke={wire(d)} strokeWidth={3} />
      <line x1={210} y1={rows[2] + 28} x2={210} y2={rows[2] + 18} stroke={wire(notE)} strokeWidth={3} />
      <Gate x={210} y={rows[2] - 18} label="AND" on={out3} />
      <line x1={288} y1={rows[2]} x2={450} y2={rows[2]} stroke={wire(out3)} strokeWidth={3} />
      <OutputNode x={450} y={rows[2]} label="OUT3" on={out3} matched={out3 === TARGET.out3} />
      <text x={330} y={rows[2] - 10} fill="#64748b" fontSize="11">
        need 1
      </text>

      {/* Row 4: B OR D → OUT4
          B and D drop on dedicated left rails (x=70 and x=82) then join — no gate-area cross */}
      <line x1={32} y1={rows[0] + 28} x2={70} y2={rows[0] + 28} stroke={wire(b)} strokeWidth={2} opacity={0.001} />
      <path
        d={`M 46 ${rows[0] + 28} H 70 V ${rows[3] - 12} H 120`}
        fill="none"
        stroke={wire(b)}
        strokeWidth={3}
      />
      <path
        d={`M 46 ${rows[2] - 12} H 82 V ${rows[3] + 12} H 120`}
        fill="none"
        stroke={wire(d)}
        strokeWidth={3}
      />
      <line x1={120} y1={rows[3] - 12} x2={120} y2={rows[3] - 2} stroke={wire(b)} strokeWidth={3} />
      <line x1={120} y1={rows[3] + 12} x2={120} y2={rows[3] + 18} stroke={wire(d)} strokeWidth={3} />
      <Gate x={120} y={rows[3] - 18} label="OR" on={out4} />
      <line x1={198} y1={rows[3]} x2={450} y2={rows[3]} stroke={wire(out4)} strokeWidth={3} />
      <OutputNode x={450} y={rows[3]} label="OUT4" on={out4} matched={out4 === TARGET.out4} />
      <text x={300} y={rows[3] - 10} fill="#64748b" fontSize="11">
        need 1
      </text>
    </svg>
  );
}

export default function LogicGatesPuzzle({ onSolved, onClose }: LogicGatesPuzzleProps) {
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [c, setC] = useState(true);
  const [d, setD] = useState(false);
  const [e, setE] = useState(true);
  const [message, setMessage] = useState("");
  const [solved, setSolved] = useState(false);

  const circuit = useMemo(() => {
    const notE = !e;
    return {
      out1: a && b,
      out2: !c,
      notE,
      out3: d && notE,
      out4: b || d,
    };
  }, [a, b, c, d, e]);

  const matches =
    circuit.out1 === TARGET.out1 &&
    circuit.out2 === TARGET.out2 &&
    circuit.out3 === TARGET.out3 &&
    circuit.out4 === TARGET.out4;

  const handleUnlock = () => {
    if (!matches) {
      setMessage("Not matched yet — work one row at a time from top to bottom.");
      return;
    }
    setSolved(true);
    setMessage("Circuit accepted. Research terminal restored.");
    setTimeout(onSolved, 900);
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
      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 font-mono text-sm transition ${
        value
          ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
          : "border-white/15 bg-white/5 text-slate-300"
      }`}
    >
      <span>{label}</span>
      <span className={`rounded px-2 py-0.5 text-xs ${value ? "bg-emerald-400 text-black" : "bg-slate-700"}`}>
        {value ? "1" : "0"}
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl border border-emerald-500/30 bg-[#07140f] shadow-2xl overflow-hidden my-4">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-emerald-200">Logic Gate Terminal</h2>
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

        <div className="px-5 py-4 space-y-4">
          <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-slate-300 space-y-1.5">
            <p className="text-[11px] uppercase tracking-wider text-emerald-300/80">Reference Card</p>
            <p>
              <strong className="text-emerald-300">AND</strong> → both inputs must be ON
            </p>
            <p>
              <strong className="text-emerald-300">OR</strong> → at least one input must be ON
            </p>
            <p>
              <strong className="text-emerald-300">NOT</strong> → reverses the input
            </p>
          </div>

          <div className="rounded-md border border-emerald-400/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-100 font-mono">
            Goal: OUT1=1 · OUT2=1 · OUT3=1 · OUT4=1
          </div>

          <CircuitDiagram a={a} b={b} c={c} d={d} e={e} {...circuit} />

          <div className="grid grid-cols-5 gap-2">
            <Toggle label="A" value={a} onToggle={() => !solved && setA((v) => !v)} />
            <Toggle label="B" value={b} onToggle={() => !solved && setB((v) => !v)} />
            <Toggle label="C" value={c} onToggle={() => !solved && setC((v) => !v)} />
            <Toggle label="D" value={d} onToggle={() => !solved && setD((v) => !v)} />
            <Toggle label="E" value={e} onToggle={() => !solved && setE((v) => !v)} />
          </div>

          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              matches
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                : "border-white/10 bg-white/5 text-slate-400"
            }`}
          >
            {matches
              ? "All outputs match — unlock when ready."
              : "Shared signals run on the left rails only, so rows stay readable."}
          </div>
        </div>

        <div className="border-t border-white/10 px-5 py-4 flex items-center justify-between gap-3">
          {message ? (
            <p className={`text-sm ${solved ? "text-emerald-300" : "text-amber-300"}`}>{message}</p>
          ) : (
            <p className="text-sm text-slate-500">Hint: OUT2 wants C off; OUT3 wants E off and D on.</p>
          )}
          <button
            onClick={handleUnlock}
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
