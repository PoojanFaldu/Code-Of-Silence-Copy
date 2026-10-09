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
      { id: "folder", label: "Badges" },
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
    body: "NOTE — Professor Dev Verma\n\nExperiment 17 was altered before the later record changes.\nI finally know where the original discrepancy came from.\nI did not expect it would be one of my own colleagues.\nI have to settle this tonight — before the file is rewritten again.\n\nPERSONAL SCRAP\nDr. Sameer Shah came by again today.\nWe argued about the publication.\nI will not let him pressure me into changing the results.",
  },
  {
    id: "folder_log",
    title: "Security Cabinet",
    body: "BADGE & CALLSIGN REGISTRY\n\nDr. Arjun Mehta → A-17 (ALPHA · ROMEO · JULIETT · UNIFORM · NOVEMBER)\nNeha Rao → B-04 (NOVEMBER · ECHO · HOTEL · ALPHA)\nKaran Patel → C-22 (KILO · ALPHA · ROMEO · ALPHA · NOVEMBER)\nRohan Desai → D-09 (ROMEO · OSCAR · HOTEL · ALPHA · NOVEMBER)\n\nBADGE C-22\nOWNER: Karan Patel\nACCESS: Technical\nAUTHORIZED AREA: Network Room\n\nBadge C-22 was recovered near the Network Room.\n\nAlso on file:\nDr. Sameer Shah — research partner of Professor Dev Verma.\nRecent disagreement over publication ownership.",
  },
  {
    id: "exp17_report",
    title: "Experiment 17",
    body: "EXP-17 RESEARCH NOTE\n\nThe recorded result for Experiment 17 does not match\nthe original research notes.\n\nExpected result: 84.2%\nRecorded result: 91.7%\n\nAssigned researcher: Dr. Arjun Mehta\n\nProfessor Dev Verma flagged the mismatch and planned\nto speak with the person responsible.",
  },
  {
    id: "timeline_order",
    title: "Timeline",
    body: "VERMA — SESSION OPENED\nARJUN — RESEARCH ACCESS\nFILE — MODIFIED\nNEHA — RECORD ACCESS\nUNKNOWN — TERMINAL\nRECORD — INTERRUPTED",
  },
  {
    id: "archive_access",
    title: "Archive Access",
    body: "ARCHIVE ACCESS NOTE\n\nAccount: Neha Rao\nAction: REVIEW\n\nNeha Rao opened Professor Dev Verma's research records on her own.\nThat activity looks secretive at first.\n\nRESEARCH COLLABORATION NOTE\n\nProfessor Dev Verma and Dr. Sameer Shah\nwere collaborating on related research.\n\nRecent disagreement:\nPublication ownership / research credit.\n\nStatus: Unresolved.\n\nVerma was preparing a publication that would undermine\npart of Dr. Sameer Shah's research.",
  },
  {
    id: "hash_diff",
    title: "Hash Discrepancy",
    body: "TAMPERING IDENTIFIED in EXP17_FINAL_REPORT.enc:\nTerminal Hash:  D26A-8B1E-F407-3C9A-5E82-71B4-9A3B-E605\nVerma's Letter: D26A-8B1E-F407-3C9A-5E82-71D4-9A3B-E605\nBlock 6 alteration (71B4 ≠ 71D4) proves the anomaly report was rewritten.\n\nSECURITY NOTE\nKaran Patel has access to restricted technical areas and equipment.\nThat knowledge could theoretically let someone interfere with systems.\nThis proves a file was rewritten — not who committed the murder.\n\nPARTNERSHIP NOTE\nA recovered memo mentions Dr. Sameer Shah:\n\"Sameer threatened to make sure this research would never be published\nwithout his name attached.\"\nThe conflict was serious — but it is about publication credit, not the murder.",
  },
  {
    id: "overlay_stamp",
    title: "Archive Recovered",
    body: "ARCHIVE TERMINAL\n\nresults.txt — Expected 84.2%, Found 91.7% (DOES NOT MATCH ORIGINAL)\nbackup.txt — STATUS: ORIGINAL\n\nAssigned researcher: Dr. Arjun Mehta\nBaseline updates required the assigned researcher.\n\nProfessor Dev Verma had already marked this discrepancy.\nThe person responsible for Experiment 17 had a strong reason\nto silence that discovery.",
  },
  {
    id: "session_full",
    title: "Session Verified",
    body: "SYSTEM ACCESS\nUSER IDENTIFICATION COMPLETE\n\nACCOUNT: Neha Rao\n\nNeha Rao's credentials open a protected research console.\nShe had been looking into Professor Dev Verma's records.\nAt first glance, this makes her look like she was hiding something.",
  },
  {
    id: "uv_archive",
    title: "UV Archive",
    body: "FINAL NOTE — Professor Dev Verma\n\"Someone has been altering the research records. I know where the discrepancy began. I need to speak with them before this goes any further.\"\n\nSUSPECT THREADS\n• Dr. Arjun Mehta [RESEARCH]: Altered Exp-17 results (84.2% → 91.7%). Verma planned to confront him.\n• Neha Rao [INVESTIGATION]: Reviewed archive to trace discrepancies; actions indicate investigation.\n• Karan Patel [NETWORK]: Server equipment access. Badge near Network Room; no murder link.\n• Rohan Desai [SECURITY]: Administered CCTV & surveillance infrastructure.\n• Dr. Sameer Shah [DISPUTE]: Heated credit dispute; strong motive, but no forensic tie.\n\nNext: Restore the relay circuit, then access the wall monitor.",
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
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readKey(key: string): string | null {
  if (!canUseStorage()) return null;
  const fromLocal = localStorage.getItem(key);
  if (fromLocal != null) return fromLocal;
  // Migrate older sessionStorage progress so refresh keeps working
  try {
    const fromSession = sessionStorage.getItem(key);
    if (fromSession != null) {
      localStorage.setItem(key, fromSession);
      return fromSession;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeKey(key: string, value: string) {
  if (!canUseStorage()) return;
  localStorage.setItem(key, value);
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(INVESTIGATION_HUD_EVENT));
  }
}

export function getCompletedTasks(): TaskId[] {
  if (!canUseStorage()) return [];
  try {
    const raw = readKey(TASK_KEY);
    return raw ? (JSON.parse(raw) as TaskId[]) : [];
  } catch {
    return [];
  }
}

export function getUnlockedLogs(): LogId[] {
  if (!canUseStorage()) return [];
  try {
    const raw = readKey(LOG_KEY);
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
  writeKey(TASK_KEY, JSON.stringify(next));
  syncPlayerTasks(next);
  notify();
}

export function unlockLog(id: LogId) {
  const list = getUnlockedLogs();
  if (list.includes(id)) {
    notify();
    return;
  }
  writeKey(LOG_KEY, JSON.stringify([...list, id]));
  notify();
}

export function resetProgressHud() {
  if (!canUseStorage()) return;
  localStorage.removeItem(TASK_KEY);
  localStorage.removeItem(LOG_KEY);
  try {
    sessionStorage.removeItem(TASK_KEY);
    sessionStorage.removeItem(LOG_KEY);
  } catch {
    /* ignore */
  }
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
  writeKey(TASK_KEY, JSON.stringify(tasks));
  writeKey(LOG_KEY, JSON.stringify(logs));
  syncPlayerTasks(tasks);
  notify();
}

export function isTaskDone(id: TaskId, completed = getCompletedTasks()) {
  return completed.includes(id);
}
