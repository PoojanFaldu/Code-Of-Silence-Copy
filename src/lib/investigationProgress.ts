/** Task IDs and evidence logs for the investigation HUD */

export type TaskId =
  | "laser"
  | "drawer"
  | "cipher"
  | "folder"
  | "logic"
  | "report"
  | "timeline"
  | "archive"
  | "hash"
  | "overlay"
  | "session"
  | "uv"
  | "accusation";

export type LogId =
  | "drawer_note"
  | "folder_log"
  | "exp17_report"
  | "timeline_order"
  | "archive_access"
  | "hash_diff"
  | "overlay_stamp"
  | "session_full"
  | "uv_archive";

export type RoomProgressId = "verma" | "research" | "archive" | "server";

export const ROOM_TASKS: {
  id: RoomProgressId;
  label: string;
  tasks: { id: TaskId; label: string }[];
}[] = [
  {
    id: "verma",
    label: "Office",
    tasks: [
      { id: "laser", label: "Laser" },
      { id: "drawer", label: "Drawer" },
      { id: "cipher", label: "Cipher" },
      { id: "folder", label: "Folder" },
    ],
  },
  {
    id: "research",
    label: "Lab",
    tasks: [
      { id: "logic", label: "Logic" },
      { id: "report", label: "Report" },
      { id: "timeline", label: "Timeline" },
      { id: "archive", label: "Archive" },
    ],
  },
  {
    id: "archive",
    label: "Archives",
    tasks: [
      { id: "hash", label: "Hash" },
      { id: "overlay", label: "Archive" },
    ],
  },
  {
    id: "server",
    label: "Server",
    tasks: [
      { id: "session", label: "Session" },
      { id: "uv", label: "UV" },
      { id: "accusation", label: "Accusation" },
    ],
  },
];

export const EVIDENCE_LOGS: {
  id: LogId;
  title: string;
  body: string;
}[] = [
  {
    id: "drawer_note",
    title: "Verma's Note",
    body: "The record ends before the night does.\nIf someone asks, I never finished reviewing Experiment 17.",
  },
  {
    id: "folder_log",
    title: "Research File",
    body: "20:58  VERMA\n21:07  ARJUN\n21:18  UNKNOWN\n21:26  NEHA\n21:34  UNKNOWN\n21:42  RECORD UNAVAILABLE",
  },
  {
    id: "exp17_report",
    title: "Experiment 17",
    body: "20:58 — VERMA\n21:07 — ARJUN\n21:18 — UNKNOWN\n21:26 — NEHA\n21:34 — UNKNOWN\n21:41 — INTERRUPT\n21:42 — UNAVAILABLE",
  },
  {
    id: "timeline_order",
    title: "Timeline",
    body: "VERMA — SESSION OPENED\nARJUN — RESEARCH ACCESS\nFILE — MODIFIED\nNEHA — RECORD ACCESS\nUNKNOWN — TERMINAL\nRECORD — INTERRUPTED",
  },
  {
    id: "archive_access",
    title: "Archive Access",
    body: "File: EXP-17_RESULTS\nWrite: 21:17\nAccount: N. RAO\nPrevious version unavailable",
  },
  {
    id: "hash_diff",
    title: "Hash Diff",
    body: "EXP17_FINAL   A91F27\nEXP17_BACKUP  A91F27\nEXP17_CURRENT C82B14  ← differs",
  },
  {
    id: "overlay_stamp",
    title: "Archive Recovered",
    body: "21:17  EXP-17 BASELINE MODIFIED\n21:36  UNKNOWN SESSION",
  },
  {
    id: "session_full",
    title: "Session Verified",
    body: "21:36  UNKNOWN SESSION 7F2A\nTerminal: SRV-03\nAUTH 2290 → K. PATEL",
  },
  {
    id: "uv_archive",
    title: "UV Archive",
    body: "20:56  VERMA\n21:03  A. MEHTA\n21:17  EXP-17 BASELINE MODIFIED\n21:29  N. RAO\n21:36  UNKNOWN SESSION\n21:41  VERMA TERMINAL DISCONNECTED\n21:42  SESSION CLOSED\n\nOriginal retained. Later copy modified.",
  },
];

const TASK_KEY = "cos_completed_tasks";
const LOG_KEY = "cos_unlocked_logs";
export const INVESTIGATION_HUD_EVENT = "cos-investigation-hud";

function canUseStorage() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(INVESTIGATION_HUD_EVENT));
  }
}

export function getCompletedTasks(): TaskId[] {
  if (!canUseStorage()) return [];
  try {
    const raw = sessionStorage.getItem(TASK_KEY);
    return raw ? (JSON.parse(raw) as TaskId[]) : [];
  } catch {
    return [];
  }
}

export function getUnlockedLogs(): LogId[] {
  if (!canUseStorage()) return [];
  try {
    const raw = sessionStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as LogId[]) : [];
  } catch {
    return [];
  }
}

export function completeTask(id: TaskId) {
  const list = getCompletedTasks();
  if (list.includes(id)) {
    notify();
    return;
  }
  if (canUseStorage()) {
    sessionStorage.setItem(TASK_KEY, JSON.stringify([...list, id]));
  }
  notify();
}

export function unlockLog(id: LogId) {
  const list = getUnlockedLogs();
  if (list.includes(id)) {
    notify();
    return;
  }
  if (canUseStorage()) {
    sessionStorage.setItem(LOG_KEY, JSON.stringify([...list, id]));
  }
  notify();
}

export function resetProgressHud() {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(TASK_KEY);
  sessionStorage.removeItem(LOG_KEY);
  notify();
}

export function isTaskDone(id: TaskId, completed = getCompletedTasks()) {
  return completed.includes(id);
}
