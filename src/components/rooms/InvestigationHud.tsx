import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, FileText, GripHorizontal, ListChecks, X } from "lucide-react";
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

  // Position state for draggable logs panel
  const [logsPos, setLogsPos] = useState<{ x: number; y: number }>({ x: 16, y: 96 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    posX: number;
    posY: number;
    moved: boolean;
  }>({
    mouseX: 0,
    mouseY: 0,
    posX: 16,
    posY: 96,
    moved: false,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only primary button
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: logsPos.x,
      posY: logsPos.y,
      moved: false,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;

      if (Math.hypot(dx, dy) > 4) {
        dragStartRef.current.moved = true;
      }

      const panelWidth = logsOpen ? 400 : 130;
      const maxX = Math.max(16, window.innerWidth - panelWidth);
      const maxY = Math.max(16, window.innerHeight - 80);

      const nextX = Math.max(16, Math.min(maxX, dragStartRef.current.posX + dx));
      const nextY = Math.max(16, Math.min(maxY, dragStartRef.current.posY + dy));

      setLogsPos({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, logsOpen]);

  const handleLogsButtonClick = () => {
    // If user dragged the button, do not toggle open/close
    if (dragStartRef.current.moved) {
      dragStartRef.current.moved = false;
      return;
    }
    setLogsOpen((v) => !v);
    if (logsOpen) setActiveLog(null);
  };

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
      {/* DRAGGABLE / MOVABLE EVIDENCE LOGS PANEL */}
      <div
        style={{ left: `${logsPos.x}px`, top: `${logsPos.y}px` }}
        className={`fixed z-40 flex flex-col items-start gap-2 pointer-events-auto w-[22rem] sm:w-[26rem] max-w-[calc(100vw-2rem)] select-none transition-shadow ${
          isDragging ? "opacity-95 shadow-2xl shadow-cyan-950/80" : ""
        }`}
      >
        {/* DRAGGABLE LOGS BUTTON */}
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onClick={handleLogsButtonClick}
          className="flex items-center gap-2 rounded-full border border-cyan-500/40 bg-black/90 px-3.5 py-2.5 text-sm font-bold tracking-wider uppercase text-cyan-100 shadow-xl backdrop-blur-md hover:bg-cyan-950/60 hover:border-cyan-400 transition cursor-grab active:cursor-grabbing group"
          title="Click to toggle, or drag to move"
        >
          <GripHorizontal className="h-3.5 w-3.5 text-cyan-400/60 group-hover:text-cyan-300 transition" />
          <FileText className="h-4 w-4 text-cyan-400" />
          Logs
          <span className="rounded-full bg-cyan-500/25 px-2 py-0.5 text-xs font-mono font-bold text-cyan-300">
            {unlocked.length}
          </span>
        </button>

        {logsOpen && (
          <div className="w-full rounded-2xl border border-cyan-500/30 bg-black/95 shadow-2xl backdrop-blur-xl overflow-hidden animate-fade-in">
            {/* Draggable Header Bar */}
            <div
              onPointerDown={handlePointerDown}
              className="flex items-center justify-between border-b border-white/10 bg-cyan-950/30 px-3.5 py-2.5 cursor-grab active:cursor-grabbing hover:bg-cyan-950/50 transition group"
              title="Click and drag to move logs"
            >
              <div className="flex items-center gap-2">
                <GripHorizontal className="h-4 w-4 text-cyan-400/80 group-hover:text-cyan-300 transition" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-cyan-300">
                  Evidence Dossier
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 group-hover:text-slate-300">
                Drag to Move
              </span>
            </div>

            {/* Logs List */}
            {unlocked.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-400 text-center font-medium">
                No evidence logs recovered yet.
              </p>
            ) : (
              <ul className="max-h-[35vh] overflow-y-auto p-2 space-y-1.5">
                {EVIDENCE_LOGS.filter((l) => unlocked.includes(l.id)).map((log) => (
                  <li key={log.id}>
                    <button
                      type="button"
                      onClick={() => setActiveLog(activeLog === log.id ? null : log.id)}
                      className={`w-full rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition border ${
                        activeLog === log.id
                          ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-50 shadow-md shadow-cyan-950/50"
                          : "border-transparent bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                      }`}
                    >
                      {log.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Active Log Expanded View */}
            {active && (
              <div className="border-t border-white/10 bg-[#09101a] px-4 py-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-300">
                    {active.title}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveLog(null)}
                    className="h-6 w-6 rounded-md hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
                    aria-label="Close log"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <pre className="max-h-[40vh] overflow-y-auto whitespace-pre-wrap font-mono text-xs sm:text-sm leading-relaxed text-slate-200 bg-black/40 p-3 rounded-xl border border-white/5">
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
