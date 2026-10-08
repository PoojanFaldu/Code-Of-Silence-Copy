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
  | "wires"
  | "cctv"
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
  | "uv_archive"
  | "wires_signal";

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
      { id: "wires", label: "Wires" },
      { id: "cctv", label: "CCTV" },
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
    body: "20:56  Professor Dev Verma\n21:03  Dr. Arjun Mehta\n21:17  FILE CHANGE\n21:29  Neha Rao\n21:36  UNKNOWN\n21:42  RECORD UNAVAILABLE\n\nProtocol: EXP-17 baseline revisions require the assigned researcher — Dr. Arjun Mehta.\n\nStaff notes:\nRohan Desai — IT/security admin\nKaran Patel — network technician\nNeha Rao — archives",
  },
  {
    id: "exp17_report",
    title: "Experiment 17",
    body: "EXP-17 VERSION HISTORY\n20:56 — VERMA\n21:03 — A. MEHTA\n21:17 — A. MEHTA  (COMMIT 7F3A · MODIFY EXP17_BASELINE · 84.2% → 91.7%)\n21:29 — N. RAO\n21:36 — UNKNOWN\n21:41 — INTERRUPT\n21:42 — UNAVAILABLE",
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
    body: "ARCHIVE TERMINAL\n\nresults.txt — Expected 84.2%, Found 91.7% (DOES NOT MATCH ORIGINAL)\nbackup.txt — STATUS: ORIGINAL\n\nAssigned researcher: Dr. Arjun Mehta\nBaseline updates required the assigned researcher.",
  },
  {
    id: "session_full",
    title: "Session Verified",
    body: "SYSTEM ACCESS\nUSER IDENTIFICATION COMPLETE\n\nACCOUNT: Neha Rao\nAccess granted via binary username decode.",
  },
  {
    id: "uv_archive",
    title: "UV Archive",
    body: "20:56  VERMA — online\n21:03  A. MEHTA — lab access\n21:17  EXP-17 BASELINE MODIFIED · 84.2% → 91.7%\n21:29  N. RAO — record access\n21:36  N. RAO — server access\n21:41  VERMA TERMINAL DISCONNECTED\n21:42  SESSION CLOSED\n21:44  ADMIN RESTART — R. DESAI\n\nNetwork 21:31: LAB-02 → SERVER (MEHTA-PC)\n\nVerma's note:\nHe knows I found it.\nWe need to speak tonight.\n\n21:17 → assigned researcher A. Mehta.\nRelay, then wall monitor.",
  },
  {
    id: "wires_signal",
    title: "Relay Signal",
    body: "Server relay circuit restored.\nPath settles on glyph: 7\n\nMonitor lock wants the original baseline figures, then this glyph.",
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

/** Dev/test: mark rooms 1–3 done so the Server Room HUD looks progressed. */
export function seedProgressThroughArchives() {
  const tasks: TaskId[] = [
    "laser",
    "drawer",
    "cipher",
    "folder",
    "logic",
    "report",
    "timeline",
    "archive",
    "hash",
    "overlay",
  ];
  const logs: LogId[] = [
    "drawer_note",
    "folder_log",
    "exp17_report",
    "timeline_order",
    "archive_access",
    "hash_diff",
    "overlay_stamp",
  ];
  if (canUseStorage()) {
    sessionStorage.setItem(TASK_KEY, JSON.stringify(tasks));
    sessionStorage.setItem(LOG_KEY, JSON.stringify(logs));
  }
  syncPlayerTasks(tasks);
  notify();
}

export function isTaskDone(id: TaskId, completed = getCompletedTasks()) {
  return completed.includes(id);
}
