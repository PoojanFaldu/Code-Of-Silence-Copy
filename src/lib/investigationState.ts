/** Lightweight persistent investigation state for Code of Silence */

import { resetProgressHud } from "@/lib/investigationProgress";

export type RoomKey = "verma" | "research" | "archive" | "server";

export type InvestigationState = {
  room1Complete: boolean;
  room2Complete: boolean;
  room3Complete: boolean;
  room4Complete: boolean;
  nehaSuspect: boolean;
  nehaRedHerringRevealed: boolean;
  arjunEvidenceFound: boolean;
  finalUnlocked: boolean;
  caseSolved: boolean;
};

const STORAGE_KEY = "the_last_session_investigation";

const DEFAULT_STATE: InvestigationState = {
  room1Complete: false,
  room2Complete: false,
  room3Complete: false,
  room4Complete: false,
  nehaSuspect: false,
  nehaRedHerringRevealed: false,
  arjunEvidenceFound: false,
  finalUnlocked: false,
  caseSolved: false,
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function getInvestigationState(): InvestigationState {
  if (!canUseStorage()) return { ...DEFAULT_STATE };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function setInvestigationState(patch: Partial<InvestigationState>): InvestigationState {
  const next = { ...getInvestigationState(), ...patch };
  if (canUseStorage()) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function resetInvestigationState() {
  if (canUseStorage()) {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("room1_neha_suspect");
    sessionStorage.removeItem("room1_to_lab");
    sessionStorage.removeItem("room2_neha_suspect");
    sessionStorage.removeItem("room2_exp17_archive");
    sessionStorage.removeItem("room2_history_missing");
    sessionStorage.removeItem("room3_puzzle5_solved");
    sessionStorage.removeItem("room3_puzzle6_solved");
  }
  resetProgressHud();
}

/** Dev/test: unlock the Server Room without replaying earlier sites. */
export function unlockServerRoomForTesting() {
  setInvestigationState({
    room1Complete: true,
    room2Complete: true,
    room3Complete: true,
    nehaSuspect: true,
    nehaRedHerringRevealed: true,
    arjunEvidenceFound: false,
    finalUnlocked: false,
    caseSolved: false,
    room4Complete: false,
  });
  if (canUseStorage()) {
    sessionStorage.setItem("room1_neha_suspect", "true");
    sessionStorage.setItem("room1_to_lab", "true");
    sessionStorage.setItem("room2_neha_suspect", "true");
    sessionStorage.setItem("room2_exp17_archive", "true");
    sessionStorage.setItem("room2_history_missing", "true");
    sessionStorage.setItem("room3_puzzle5_solved", "true");
    sessionStorage.setItem("room3_puzzle6_solved", "true");
  }
}

/** Room unlock rules for continuous investigation */
export function isRoomUnlocked(room: RoomKey, state = getInvestigationState()): boolean {
  switch (room) {
    case "verma":
      return true;
    case "research":
      return state.room1Complete;
    case "archive":
      return state.room2Complete;
    case "server":
      return state.room3Complete;
    default:
      return false;
  }
}

export function isRoomComplete(room: RoomKey, state = getInvestigationState()): boolean {
  switch (room) {
    case "verma":
      return state.room1Complete;
    case "research":
      return state.room2Complete;
    case "archive":
      return state.room3Complete;
    case "server":
      return state.room4Complete;
    default:
      return false;
  }
}

export function mapLocationIdToRoom(id: string): RoomKey | null {
  switch (id) {
    case "office":
    case "verma":
      return "verma";
    case "lab":
    case "research":
      return "research";
    case "archive":
    case "archives":
      return "archive";
    case "server":
      return "server";
    default:
      return null;
  }
}

export function getRoomStatusLabel(room: RoomKey, state = getInvestigationState()): string {
  if (isRoomComplete(room, state)) return "COMPLETE";
  if (isRoomUnlocked(room, state)) return "AVAILABLE";
  return "LOCKED";
}

/** Acceptable answers for final accusation */
export function isCorrectMurderer(answer: string): boolean {
  const n = answer.toLowerCase().trim().replace(/\s+/g, " ");
  return (
    n === "arjun" ||
    n === "arjun mehta" ||
    n === "dr arjun mehta" ||
    n === "dr. arjun mehta" ||
    n === "doctor arjun mehta"
  );
}

export function isNehaAccusation(answer: string): boolean {
  const n = answer.toLowerCase().trim().replace(/\s+/g, " ");
  return n === "neha" || n === "neha rao" || n === "n. rao" || n === "n rao";
}
