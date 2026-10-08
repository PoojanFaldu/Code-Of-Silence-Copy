/** Local event database for player runs + leaderboard. */

export type MurderGuessResult = "correct" | "incorrect" | "none";

export type PlayerRecord = {
  id: string;
  name: string;
  puzzlesPassed: number;
  completedTaskIds: string[];
  murderGuess: MurderGuessResult;
  murderGuessName: string | null;
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

const DEFAULT_ADMIN_PASSWORD = "csi-admin-2026";

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

function saveEventDb(db: EventDb) {
  if (!canUseStorage()) return;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  notify();
}

function uid() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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

export function recordMurderGuess(guessName: string, correct: boolean) {
  const id = getActivePlayerId();
  if (!id) return;
  const db = loadEventDb();
  const p = db.players.find((x) => x.id === id);
  if (!p) return;
  p.murderGuessName = guessName.trim();
  p.murderGuess = correct ? "correct" : "incorrect";
  if (correct) {
    p.status = "finished";
    p.finishedAt = new Date().toISOString();
    p.timedOut = false;
  }
  saveEventDb(db);
}

export function recordTimeout() {
  const id = getActivePlayerId();
  if (!id) return;
  const db = loadEventDb();
  const p = db.players.find((x) => x.id === id);
  if (!p || p.status === "finished") return;
  p.timedOut = true;
  p.status = "finished";
  p.finishedAt = new Date().toISOString();
  if (p.murderGuess === "none") {
    p.murderGuess = "incorrect";
    p.murderGuessName = p.murderGuessName ?? "(timed out)";
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
