import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, ChevronRight, FileText, ListChecks, X } from "lucide-react";
import {
  EVIDENCE_LOGS,
  INVESTIGATION_HUD_EVENT,
  ROOM_TASKS,
  getCompletedTasks,
  getUnlockedLogs,
  type LogId,
  type TaskId,
} from "@/lib/investigationProgress";
import { getInvestigationState, type RoomKey } from "@/lib/investigationState";

type InvestigationHudProps = {
  currentRoom: RoomKey;
};

export default function InvestigationHud({ currentRoom }: InvestigationHudProps) {
  const [completed, setCompleted] = useState<TaskId[]>([]);
  const [unlocked, setUnlocked] = useState<LogId[]>([]);
  const [logsOpen, setLogsOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(true);
  const [activeLog, setActiveLog] = useState<LogId | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<string>(currentRoom);

  const refresh = useCallback(() => {
    setCompleted(getCompletedTasks());
    setUnlocked(getUnlockedLogs());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(INVESTIGATION_HUD_EVENT, refresh);
    return () => window.removeEventListener(INVESTIGATION_HUD_EVENT, refresh);
  }, [refresh]);

  useEffect(() => {
    setExpandedRoom(currentRoom);
  }, [currentRoom]);

  const state = getInvestigationState();
  const active = EVIDENCE_LOGS.find((l) => l.id === activeLog);

  const roomDone = (roomId: string) => {
    const group = ROOM_TASKS.find((r) => r.id === roomId);
    if (!group) return false;
    return group.tasks.every((t) => completed.includes(t.id));
  };

  return (
    <>
      {/* LEFT — Evidence logs */}
      <div className="fixed top-24 left-4 z-40 flex flex-col items-start gap-2 pointer-events-auto max-w-[min(20rem,calc(100vw-2rem))]">
        <button
          type="button"
          onClick={() => {
            setLogsOpen((v) => !v);
            if (logsOpen) setActiveLog(null);
          }}
          className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-black/80 px-3 py-2 text-xs font-semibold tracking-wider uppercase text-cyan-100 shadow-lg backdrop-blur-md hover:bg-cyan-950/50 transition"
        >
          <FileText className="h-3.5 w-3.5" />
          Logs
          <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-300">
            {unlocked.length}
          </span>
        </button>

        {logsOpen && (
          <div className="w-full rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-md overflow-hidden">
            <div className="border-b border-white/5 px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500">
              Evidence
            </div>
            {unlocked.length === 0 ? (
              <p className="px-3 py-4 text-xs text-slate-500">No logs yet</p>
            ) : (
              <ul className="max-h-[40vh] overflow-y-auto p-1.5 space-y-1">
                {EVIDENCE_LOGS.filter((l) => unlocked.includes(l.id)).map((log) => (
                  <li key={log.id}>
                    <button
                      type="button"
                      onClick={() => setActiveLog(activeLog === log.id ? null : log.id)}
                      className={`w-full rounded-xl px-3 py-2.5 text-left text-xs transition border ${
                        activeLog === log.id
                          ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-50"
                          : "border-transparent bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
                      }`}
                    >
                      {log.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {active && (
              <div className="border-t border-white/10 bg-[#0a1018] px-3 py-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-cyan-400/80">{active.title}</p>
                  <button
                    type="button"
                    onClick={() => setActiveLog(null)}
                    className="text-slate-500 hover:text-white"
                    aria-label="Close log"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">
                  {active.body}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT — Progress tracker */}
      <div className="fixed top-24 right-4 z-40 flex flex-col items-end gap-2 pointer-events-auto max-w-[min(18rem,calc(100vw-2rem))]">
        <button
          type="button"
          onClick={() => setProgressOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-black/80 px-3 py-2 text-xs font-semibold tracking-wider uppercase text-emerald-100 shadow-lg backdrop-blur-md hover:bg-emerald-950/40 transition"
        >
          <ListChecks className="h-3.5 w-3.5" />
          Progress
        </button>

        {progressOpen && (
          <div className="w-64 rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-md overflow-hidden">
            <div className="border-b border-white/5 px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500">
              Investigation
            </div>
            <div className="p-1.5 space-y-1 max-h-[55vh] overflow-y-auto">
              {ROOM_TASKS.map((room) => {
                const done = roomDone(room.id);
                const locked =
                  (room.id === "research" && !state.room1Complete && currentRoom !== "research") ||
                  (room.id === "archive" && !state.room2Complete && currentRoom !== "archive") ||
                  (room.id === "server" && !state.room3Complete && currentRoom !== "server");
                const isCurrent = room.id === currentRoom;
                const open = expandedRoom === room.id;

                return (
                  <div
                    key={room.id}
                    className={`rounded-xl border ${
                      isCurrent ? "border-emerald-400/30 bg-emerald-500/5" : "border-transparent bg-white/[0.02]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedRoom(open ? "" : room.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                          done
                            ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300"
                            : "border-white/15 text-slate-500"
                        }`}
                      >
                        {done ? <Check className="h-3 w-3" /> : open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </span>
                      <span className={`flex-1 text-xs font-semibold ${locked ? "text-slate-600" : "text-slate-200"}`}>
                        {room.label}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] uppercase tracking-wider text-emerald-400/80">Here</span>
                      )}
                    </button>

                    {open && (
                      <ul className="px-2 pb-2 space-y-1">
                        {room.tasks.map((task) => {
                          const ok = completed.includes(task.id);
                          return (
                            <li
                              key={task.id}
                              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px]"
                            >
                              <span
                                className={`flex h-4 w-4 items-center justify-center rounded border ${
                                  ok
                                    ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                                    : "border-white/10 text-transparent"
                                }`}
                              >
                                <Check className="h-2.5 w-2.5" />
                              </span>
                              <span className={ok ? "text-slate-400 line-through" : "text-slate-300"}>
                                {task.label}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
