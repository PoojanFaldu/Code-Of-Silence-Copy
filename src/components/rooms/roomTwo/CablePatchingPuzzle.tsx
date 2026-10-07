import { useMemo, useState } from "react";

interface CablePatchingPuzzleProps {
  onSolved: () => void;
  onClose: () => void;
}

type JackId = "camera" | "power" | "decoderOut" | "decoderIn" | "decoderPower" | "monitor";

const LEFT_JACKS: { id: JackId; label: string; color: string }[] = [
  { id: "camera", label: "Camera", color: "#38bdf8" },
  { id: "decoderOut", label: "Decoder (out)", color: "#a78bfa" },
  { id: "power", label: "Power", color: "#fbbf24" },
];

const RIGHT_JACKS: { id: JackId; label: string; color: string }[] = [
  { id: "decoderIn", label: "Decoder (signal)", color: "#a78bfa" },
  { id: "monitor", label: "Monitor", color: "#34d399" },
  { id: "decoderPower", label: "Decoder (power)", color: "#fbbf24" },
];

const REQUIRED: Record<string, JackId> = {
  camera: "decoderIn",
  decoderOut: "monitor",
  power: "decoderPower",
};

export default function CablePatchingPuzzle({ onSolved, onClose }: CablePatchingPuzzleProps) {
  const [selected, setSelected] = useState<JackId | null>(null);
  const [links, setLinks] = useState<Partial<Record<JackId, JackId>>>({});
  const [message, setMessage] = useState("SIGNAL LOST — reconnect the patch panel.");
  const [solved, setSolved] = useState(false);

  const reverseLinks = useMemo(() => {
    const map: Partial<Record<JackId, JackId>> = {};
    (Object.entries(links) as [JackId, JackId][]).forEach(([from, to]) => {
      map[to] = from;
    });
    return map;
  }, [links]);

  const handleLeftClick = (id: JackId) => {
    if (solved) return;
    setSelected(id);
    setMessage(`Selected ${LEFT_JACKS.find((j) => j.id === id)?.label}. Choose a destination jack.`);
  };

  const handleRightClick = (id: JackId) => {
    if (solved || !selected) return;

    setLinks((prev) => {
      const next = { ...prev };
      // clear any existing use of this destination or source
      (Object.entries(next) as [JackId, JackId][]).forEach(([from, to]) => {
        if (to === id || from === selected) delete next[from];
      });
      next[selected] = id;
      return next;
    });
    setSelected(null);
    setMessage("Cable patched. Connect all three required routes.");
  };

  const handleRestore = () => {
    const ok = (Object.keys(REQUIRED) as JackId[]).every((src) => links[src] === REQUIRED[src]);
    if (!ok) {
      setMessage("Incorrect patching. Need: Camera→Decoder, Decoder→Monitor, Power→Decoder.");
      return;
    }
    setSolved(true);
    setMessage("Signal restored. Loading damaged CCTV recording…");
    setTimeout(onSolved, 1100);
  };

  const JackButton = ({
    id,
    label,
    color,
    side,
  }: {
    id: JackId;
    label: string;
    color: string;
    side: "left" | "right";
  }) => {
    const isSelected = selected === id;
    const isLinked =
      side === "left" ? Boolean(links[id]) : Boolean(reverseLinks[id]);

    return (
      <button
        onClick={() => (side === "left" ? handleLeftClick(id) : handleRightClick(id))}
        disabled={solved}
        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
          isSelected
            ? "border-cyan-300 bg-cyan-500/20"
            : isLinked
              ? "border-white/25 bg-white/10"
              : "border-white/10 bg-black/30 hover:bg-white/5"
        }`}
      >
        <span
          className="h-3 w-3 rounded-full shrink-0"
          style={{ background: color, boxShadow: `0 0 10px ${color}` }}
        />
        <div>
          <p className="text-sm text-slate-100">{label}</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            {side === "left" ? "Output" : "Input"}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-sky-500/30 bg-[#071018] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-sky-200">Monitor Cable Patching</h2>
            <p className="text-xs text-rose-300 mt-1 font-mono">SIGNAL LOST</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-3 py-1 text-sm text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <p className="text-sm text-slate-300">
            Click a source jack, then a destination jack. Required routes:
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-400">
            <span className="rounded border border-white/10 px-2 py-1">Camera → Decoder</span>
            <span className="rounded border border-white/10 px-2 py-1">Decoder → Monitor</span>
            <span className="rounded border border-white/10 px-2 py-1">Power → Decoder</span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <div className="space-y-2">
              {LEFT_JACKS.map((j) => (
                <JackButton key={j.id} {...j} side="left" />
              ))}
            </div>

            <div className="flex flex-col items-center gap-3 py-2">
              {LEFT_JACKS.map((j) => {
                const dest = links[j.id];
                return (
                  <div key={`cable-${j.id}`} className="w-16 h-0.5 rounded relative">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: dest ? j.color : "rgba(148,163,184,0.25)",
                        boxShadow: dest ? `0 0 8px ${j.color}` : "none",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              {RIGHT_JACKS.map((j) => (
                <JackButton key={j.id} {...j} side="right" />
              ))}
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-300">
            {message}
          </div>

          <div className="flex justify-between gap-3">
            <button
              onClick={() => {
                setLinks({});
                setSelected(null);
                setMessage("Panel cleared. SIGNAL LOST");
                setSolved(false);
              }}
              className="rounded-md border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              Clear Cables
            </button>
            <button
              onClick={handleRestore}
              disabled={solved}
              className="rounded-md bg-sky-500/20 border border-sky-400/40 px-4 py-2 text-sm font-medium text-sky-100 hover:bg-sky-500/30 disabled:opacity-50"
            >
              {solved ? "Signal Restored" : "Restore Signal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
