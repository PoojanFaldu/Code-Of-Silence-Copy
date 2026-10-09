/** Event database for player runs + leaderboard (local + disk-backed API). */

export type MurderGuessResult = "correct" | "incorrect" | "none";

export type PlayerRecord = {
  id: string;
  name: string;
  puzzlesPassed: number;
  completedTaskIds: string[];
  murderGuess: MurderGuessResult;
  murderGuessName: string | null;
  /** Mission seconds consumed (includes wrong-answer / accusation penalties). */
  timeUsedSeconds: number | null;
  timedOut: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  status: "waiting" | "playing" | "finished";
};

export type EventDb = {
  players: PlayerRecord[];
};

const DB_KEY = "cos_event_db";
const ACTIVE_PLAYER_KEY = "cos_active_player_id";
export const EVENT_DB_EVENT = "cos-event-db";
export const MISSION_DURATION_SECONDS = 2700; // 45 minutes

const DEFAULT_ADMIN_PASSWORD = "2345";

export function getAdminPassword(): string {
  return (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim() || DEFAULT_ADMIN_PASSWORD;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT_DB_EVENT));
  }
}

function saveLocal(db: EventDb) {
  if (!canUseStorage()) return;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  notify();
}

export function loadEventDb(): EventDb {
  if (!canUseStorage()) return { players: [] };
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return { players: [] };
    const parsed = JSON.parse(raw) as EventDb;
    return { players: Array.isArray(parsed.players) ? parsed.players : [] };
  } catch {
    return { players: [] };
  }
}

/** Push local DB to disk-backed API (survives server restart). */
async function pushToServer(db: EventDb) {
  try {
    await fetch("/api/event-db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(db),
    });
  } catch {
    /* static hosts / offline — localStorage remains */
  }
}

function saveEventDb(db: EventDb) {
  saveLocal(db);
  void pushToServer(db);
}

/** Pull disk-backed leaderboard on boot (merges with local by player id). */
export async function hydrateEventDbFromServer(): Promise<void> {
  if (!canUseStorage()) return;
  try {
    const res = await fetch("/api/event-db");
    if (!res.ok) return;
    const remote = (await res.json()) as EventDb;
    const remotePlayers = Array.isArray(remote.players) ? remote.players : [];
    if (remotePlayers.length === 0) {
      // Seed server from local if server empty
      const local = loadEventDb();
      if (local.players.length > 0) await pushToServer(local);
      return;
    }
    const local = loadEventDb();
    const byId = new Map<string, PlayerRecord>();
    local.players.forEach((p) => byId.set(p.id, p));
    remotePlayers.forEach((p) => {
      const existing = byId.get(p.id);
      if (!existing) {
        byId.set(p.id, p);
        return;
      }
      // Prefer the record with a later finishedAt / more progress
      const remoteScore = (p.puzzlesPassed ?? 0) + (p.finishedAt ? 1000 : 0);
      const localScore = (existing.puzzlesPassed ?? 0) + (existing.finishedAt ? 1000 : 0);
      byId.set(p.id, remoteScore >= localScore ? p : existing);
    });
    const merged: EventDb = { players: [...byId.values()] };
    saveLocal(merged);
    await pushToServer(merged);
  } catch {
    /* ignore */
  }
}

/** Server-side password check when API is available; falls back to client env. */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const data = (await res.json()) as { ok?: boolean };
      return Boolean(data.ok);
    }
    if (res.status === 401) return false;
  } catch {
    /* fall through */
  }
  return password === getAdminPassword();
}

function uid() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Normalize typed/partial suspect names to consistent full display names. */
export function normalizeSuspectFullName(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[.,']/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^dr\s+/, "")
    .trim();

  if (s === "arjun" || s === "mehta" || s === "arjun mehta" || s === "mehta arjun") {
    return "Arjun Mehta";
  }
  if (s === "neha" || s === "rao" || s === "neha rao" || s === "rao neha") {
    return "Neha Rao";
  }
  if (s === "karan" || s === "patel" || s === "karan patel" || s === "patel karan") {
    return "Karan Patel";
  }
  if (s === "rohan" || s === "desai" || s === "rohan desai" || s === "desai rohan") {
    return "Rohan Desai";
  }
  if (s === "sameer" || s === "shah" || s === "sameer shah" || s === "shah sameer") {
    return "Sameer Shah";
  }
  if (!s || s === "(timed out)") return "(timed out)";
  return raw
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function formatTimeUsed(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/** Create a new run entry for this name (always a fresh leaderboard row). */
export function startGameAsPlayer(name: string): PlayerRecord {
  const trimmed = name.trim();
  const db = loadEventDb();
  const player: PlayerRecord = {
    id: uid(),
    name: trimmed,
    puzzlesPassed: 0,
    completedTaskIds: [],
    murderGuess: "none",
    murderGuessName: null,
    timeUsedSeconds: null,
    timedOut: false,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    status: "playing",
  };
  db.players.push(player);
  saveEventDb(db);
  setActivePlayerId(player.id);
  return player;
}

export function getActivePlayerId(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(ACTIVE_PLAYER_KEY);
}

export function setActivePlayerId(id: string | null) {
  if (!canUseStorage()) return;
  if (id) localStorage.setItem(ACTIVE_PLAYER_KEY, id);
  else localStorage.removeItem(ACTIVE_PLAYER_KEY);
  notify();
}

export function getActivePlayer(): PlayerRecord | null {
  const id = getActivePlayerId();
  if (!id) return null;
  return loadEventDb().players.find((p) => p.id === id) ?? null;
}

export function syncPlayerTasks(taskIds: string[]) {
  const id = getActivePlayerId();
  if (!id) return;
  const db = loadEventDb();
  const p = db.players.find((x) => x.id === id);
  if (!p || p.status === "finished") return;
  p.completedTaskIds = [...taskIds];
  p.puzzlesPassed = taskIds.filter((t) => t !== "accusation").length;
  if (p.status === "waiting") {
    p.status = "playing";
    p.startedAt = p.startedAt ?? new Date().toISOString();
  }
  saveEventDb(db);
}

export function recordMurderGuess(guessName: string, correct: boolean, timeUsedSeconds: number) {
  const id = getActivePlayerId();
  if (!id) return;
  const db = loadEventDb();
  const p = db.players.find((x) => x.id === id);
  if (!p) return;
  p.murderGuessName = normalizeSuspectFullName(guessName);
  p.murderGuess = correct ? "correct" : "incorrect";
  p.timeUsedSeconds = Math.max(0, Math.floor(timeUsedSeconds));
  if (correct) {
    p.status = "finished";
    p.finishedAt = new Date().toISOString();
    p.timedOut = false;
  }
  saveEventDb(db);
}

export function recordTimeout(timeUsedSeconds: number = MISSION_DURATION_SECONDS) {
  const id = getActivePlayerId();
  if (!id) return;
  const db = loadEventDb();
  const p = db.players.find((x) => x.id === id);
  if (!p || p.status === "finished") return;
  p.timedOut = true;
  p.status = "finished";
  p.finishedAt = new Date().toISOString();
  p.timeUsedSeconds = Math.max(0, Math.floor(timeUsedSeconds));
  if (p.murderGuess === "none") {
    p.murderGuess = "incorrect";
    p.murderGuessName = p.murderGuessName
      ? normalizeSuspectFullName(p.murderGuessName)
      : "(timed out)";
  }
  saveEventDb(db);
}

export function formatFinishTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
