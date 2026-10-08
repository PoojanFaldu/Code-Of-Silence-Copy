/** Task IDs and evidence logs for the investigation HUD */

import { syncPlayerTasks } from "@/lib/eventDb";

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
    body: "20:41 — D. VERMA\nEXP-17 was altered before the later record changes.\nI finally know where the original discrepancy came from.\nI did not expect it would be one of my own colleagues.\nI have to settle this tonight — before the file is rewritten again.",
  },
  {
    id: "folder_log",
    title: "Research File",
    body: "20:56  VERMA\n21:03  ARJUN\n21:17  FILE CHANGE\n21:29  NEHA\n21:36  UNKNOWN\n21:42  RECORD UNAVAILABLE\n\nProtocol: EXP-17 baseline revisions require the assigned researcher — A. Mehta.",
  },
  {
    id: "exp17_report",
    title: "Experiment 17",
    body: "20:56 — VERMA\n21:03 — ARJUN\n21:17 — FILE CHANGE\n21:29 — NEHA\n21:36 — UNKNOWN\n21:41 — INTERRUPT\n21:42 — UNAVAILABLE",
  },
  {
    id: "timeline_order",
    title: "Timeline",
    body: "VERMA — SESSION OPENED\nARJUN — RESEARCH ACCESS\nFILE — MODIFIED\nNEHA — RECORD ACCESS\nUNKNOWN — TERMINAL\nRECORD — INTERRUPTED",
  },
  {
    id: "archive_access",
    title: "Archive Access",
    body: "File: EXP-17_RESULTS\nAccess: 21:29\nAccount: N. RAO\nAction: REVIEW\n\nReview occurred after the 21:17 baseline change.",
  },
  {
    id: "hash_diff",
    title: "Hash Discrepancy",
    body: "TAMPERING IDENTIFIED in EXP17_FINAL_REPORT.enc:\nTerminal Hash:  D26A-8B1E-F407-3C9A-5E82-71B4-9A3B-E605\nVerma's Letter: D26A-8B1E-F407-3C9A-5E82-71D4-9A3B-E605\nBlock 6 alteration (71B4 ≠ 71D4) proves the anomaly report was rewritten.",
  },
  {
    id: "overlay_stamp",
    title: "Archive Recovered",
    body: "21:17  EXP-17 BASELINE MODIFIED\n21:36  UNKNOWN SESSION\n\nOriginal change 21:17 — Authorized researcher: A. MEHTA\nBaseline changes normally require the assigned researcher.",
  },
  {
    id: "session_full",
    title: "Session Verified",
    body: "21:36  UNKNOWN SESSION 7F2A\nTerminal: SRV-03\nAUTH 2290 → N. RAO",
  },
  {
    id: "uv_archive",
    title: "UV Archive",
    body: "20:56  VERMA\n21:03  Assigned researcher — present\n21:17  EXP-17 BASELINE MODIFIED\n21:29  N. RAO — review (after original change)\n21:36  N. RAO — server check (after original change)\n21:41  VERMA TERMINAL DISCONNECTED\n21:42  SESSION CLOSED\n\nClearance — N. Rao:\nHer review and server session both happen after the 21:17 rewrite. She was checking a file already altered — not authoring the original change.\n\nFinal note — D. VERMA:\nThe baseline was rewritten by the researcher assigned to EXP-17. I told them I would not stay silent. Neha only arrived later — she was trying to understand what had already been done. If anything happens tonight, look at who needed that first change hidden.\n\nCorrelation:\n21:17 original rewrite → assigned EXP-17 researcher\nNeha cleared on timing (after 21:17)\nVerma planned to confront the assigned researcher\nVerma goes offline at 21:41",
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
    syncPlayerTasks(list);
    notify();
    return;
  }
  const next = [...list, id];
  if (canUseStorage()) {
    sessionStorage.setItem(TASK_KEY, JSON.stringify(next));
  }
  syncPlayerTasks(next);
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
