import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";

export type PuzzleAccent = "cyan" | "violet" | "amber" | "emerald" | "sky" | "indigo" | "lime" | "slate" | "rose";

const ACCENT: Record<
  PuzzleAccent,
  { border: string; title: string; tabOn: string; tabOff: string; btn: string; glow: string }
> = {
  cyan: {
    border: "border-cyan-500/30",
    title: "text-cyan-100",
    tabOn: "bg-cyan-500/20 text-cyan-100 border-cyan-400/40",
    tabOff: "text-slate-400 hover:text-slate-200 border-transparent",
    btn: "border-cyan-400/40 bg-cyan-500/20 text-cyan-50 hover:bg-cyan-500/30",
    glow: "shadow-cyan-950/40",
  },
  violet: {
    border: "border-violet-500/30",
    title: "text-violet-100",
    tabOn: "bg-violet-500/20 text-violet-100 border-violet-400/40",
    tabOff: "text-slate-400 hover:text-slate-200 border-transparent",
    btn: "border-violet-400/40 bg-violet-500/20 text-violet-50 hover:bg-violet-500/30",
    glow: "shadow-violet-950/40",
  },
  amber: {
    border: "border-amber-500/30",
    title: "text-amber-100",
    tabOn: "bg-amber-500/20 text-amber-100 border-amber-400/40",
    tabOff: "text-slate-400 hover:text-slate-200 border-transparent",
    btn: "border-amber-400/40 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30",
    glow: "shadow-amber-950/40",
  },
  emerald: {
    border: "border-emerald-500/30",
    title: "text-emerald-100",
    tabOn: "bg-emerald-500/20 text-emerald-100 border-emerald-400/40",
    tabOff: "text-slate-400 hover:text-slate-200 border-transparent",
    btn: "border-emerald-400/40 bg-emerald-500/20 text-emerald-50 hover:bg-emerald-500/30",
    glow: "shadow-emerald-950/40",
  },
  sky: {
    border: "border-sky-500/30",
    title: "text-sky-100",
    tabOn: "bg-sky-500/20 text-sky-100 border-sky-400/40",
    tabOff: "text-slate-400 hover:text-slate-200 border-transparent",
    btn: "border-sky-400/40 bg-sky-500/20 text-sky-50 hover:bg-sky-500/30",
    glow: "shadow-sky-950/40",
  },
  indigo: {
    border: "border-indigo-500/30",
    title: "text-indigo-100",
    tabOn: "bg-indigo-500/20 text-indigo-100 border-indigo-400/40",
    tabOff: "text-slate-400 hover:text-slate-200 border-transparent",
    btn: "border-indigo-400/40 bg-indigo-500/20 text-indigo-50 hover:bg-indigo-500/30",
    glow: "shadow-indigo-950/40",
  },
  lime: {
    border: "border-lime-500/30",
    title: "text-lime-100",
    tabOn: "bg-lime-500/20 text-lime-100 border-lime-400/40",
    tabOff: "text-slate-400 hover:text-slate-200 border-transparent",
    btn: "border-lime-400/40 bg-lime-500/20 text-lime-50 hover:bg-lime-500/30",
    glow: "shadow-lime-950/40",
  },
  slate: {
    border: "border-slate-500/40",
    title: "text-slate-100",
    tabOn: "bg-slate-500/25 text-slate-100 border-slate-400/40",
    tabOff: "text-slate-400 hover:text-slate-200 border-transparent",
    btn: "border-slate-400/40 bg-slate-500/20 text-slate-50 hover:bg-slate-500/30",
    glow: "shadow-black/50",
  },
  rose: {
    border: "border-rose-500/30",
    title: "text-rose-100",
    tabOn: "bg-rose-500/20 text-rose-100 border-rose-400/40",
    tabOff: "text-slate-400 hover:text-slate-200 border-transparent",
    btn: "border-rose-400/40 bg-rose-500/20 text-rose-50 hover:bg-rose-500/30",
    glow: "shadow-rose-950/40",
  },
};

export type PuzzleTab = {
  id: string;
  label: string;
  content: ReactNode;
};

type PuzzleShellProps = {
  title: string;
  accent?: PuzzleAccent;
  onClose: () => void;
  tabs?: PuzzleTab[];
  /** When no tabs — single body */
  children?: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  defaultTab?: string;
};

export function PuzzlePrimaryButton({
  accent = "cyan",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { accent?: PuzzleAccent }) {
  const a = ACCENT[accent];
  return (
    <button
      {...props}
      className={`w-full rounded-lg border px-4 py-2.5 text-sm font-semibold tracking-wide transition disabled:opacity-40 ${a.btn} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export default function PuzzleShell({
  title,
  accent = "cyan",
  onClose,
  tabs,
  children,
  footer,
  maxWidth = "max-w-lg",
  defaultTab,
}: PuzzleShellProps) {
  const a = ACCENT[accent];
  const [tab, setTab] = useState(defaultTab ?? tabs?.[0]?.id ?? "");
  const active = tabs?.find((t) => t.id === tab) ?? tabs?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div
        className={`w-full ${maxWidth} my-auto rounded-2xl border ${a.border} bg-[#0b0f16]/95 shadow-2xl ${a.glow} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-2">
          <h2 className={`text-sm sm:text-base font-bold tracking-[0.2em] uppercase ${a.title}`}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Segmented tabs */}
        {tabs && tabs.length > 0 && (
          <div className="px-4 sm:px-5 pb-3">
            <div className="flex gap-1 rounded-xl bg-black/40 p-1 border border-white/5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex-1 rounded-lg border px-2 py-2 text-[11px] sm:text-xs font-semibold tracking-wider uppercase transition ${
                    (active?.id ?? tab) === t.id ? a.tabOn : a.tabOff
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-4 sm:px-5 pb-4 min-h-[120px]">{tabs ? active?.content : children}</div>

        {footer && (
          <div className="border-t border-white/5 px-4 sm:px-5 py-3 bg-black/30">{footer}</div>
        )}
      </div>
    </div>
  );
}
