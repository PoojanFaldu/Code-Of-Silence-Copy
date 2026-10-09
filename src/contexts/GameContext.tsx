import { createContext, useCallback, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { toast } from "sonner";
import { resetInvestigationState } from "@/lib/investigationState";
import { resetProgressHud } from "@/lib/investigationProgress";
import { getActivePlayerId, MISSION_DURATION_SECONDS, recordTimeout } from "@/lib/eventDb";
import { clearRunSession, loadRunSession, saveRunSession } from "@/lib/runSession";

/** Deducted from the mission timer on each wrong puzzle guess. */
export const WRONG_ANSWER_PENALTY_SECONDS = 120;
/** Deducted on each wrong final murderer accusation. */
export const WRONG_ACCUSATION_PENALTY_SECONDS = 600;

interface GameContextType {
  timeRemaining: number;
  timedOut: boolean;
  /** True only after admin starts a run with password + player name. */
  missionStarted: boolean;
  puzzleSolved: boolean;
  setPuzzleSolved: (solved: boolean) => void;
  websiteUrl: string;
  setWebsiteUrl: (url: string) => void;
  resetGame: () => void;
  /** Call after admin password + name succeed — starts the 60:00 countdown. */
  startMission: () => void;
  deductTime: (seconds: number) => void;
  penalizeWrongAnswer: () => void;
  penalizeWrongAccusation: () => void;
  clearTimedOut: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const GAME_DURATION = MISSION_DURATION_SECONDS;
const DEFAULT_WEBSITE_URL = "https://code-of-silence-unlocked-53719-03265-76-14967.lovable.app/";

function initialFromSession() {
  const s = loadRunSession();
  const activeId = getActivePlayerId();
  const resumable =
    s.missionStarted &&
    s.gameStartTime != null &&
    !s.timedOut &&
    (activeId ? (s.playerId == null || s.playerId === activeId) : true);

  if (!resumable) {
    return {
      gameStartTime: null as number | null,
      missionStarted: false,
      puzzleSolved: false,
      timeRemaining: GAME_DURATION,
      timedOut: false,
    };
  }

  const elapsed = Math.floor((Date.now() - (s.gameStartTime as number)) / 1000);
  const remaining = Math.max(0, GAME_DURATION - elapsed);
  return {
    gameStartTime: s.gameStartTime,
    missionStarted: true,
    puzzleSolved: s.puzzleSolved,
    timeRemaining: remaining,
    timedOut: remaining <= 0 || s.timedOut,
  };
}

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const boot = initialFromSession();
  const [gameStartTime, setGameStartTime] = useState<number | null>(boot.gameStartTime);
  const [missionStarted, setMissionStarted] = useState(boot.missionStarted);
  const [puzzleSolved, setPuzzleSolvedState] = useState<boolean>(boot.puzzleSolved);
  const [websiteUrl, setWebsiteUrlState] = useState<string>(DEFAULT_WEBSITE_URL);
  const [timeRemaining, setTimeRemaining] = useState<number>(boot.timeRemaining);
  const [timedOut, setTimedOut] = useState(boot.timedOut);
  const timeRemainingRef = useRef(boot.timeRemaining);
  timeRemainingRef.current = timeRemaining;

  useEffect(() => {
    if (!missionStarted || timedOut || gameStartTime == null) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setTimedOut(true);
        saveRunSession({ timedOut: true, missionStarted: true, gameStartTime });
        recordTimeout(GAME_DURATION);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [gameStartTime, missionStarted, timedOut]);

  useEffect(() => {
    if (!missionStarted || gameStartTime == null) return;
    saveRunSession({
      missionStarted: true,
      gameStartTime,
      timedOut,
      puzzleSolved,
      playerId: getActivePlayerId(),
    });
  }, [missionStarted, gameStartTime, timedOut, puzzleSolved]);

  const setPuzzleSolved = (solved: boolean) => {
    setPuzzleSolvedState(solved);
    saveRunSession({ puzzleSolved: solved });
  };

  const setWebsiteUrl = (url: string) => {
    setWebsiteUrlState(url);
  };

  const deductTime = useCallback(
    (seconds: number) => {
      const now = Date.now();
      setMissionStarted(true);
      setGameStartTime((prev) => {
        const base = prev ?? (now - (GAME_DURATION - timeRemainingRef.current) * 1000);
        const next = base - seconds * 1000;
        saveRunSession({ gameStartTime: next, missionStarted: true });
        return next;
      });
      setTimeRemaining((prev) => {
        const next = Math.max(0, prev - seconds);
        if (next <= 0) {
          setTimedOut(true);
          saveRunSession({ timedOut: true });
          recordTimeout(GAME_DURATION);
        }
        return next;
      });
    },
    []
  );

  const penalizeWrongAnswer = useCallback(() => {
    deductTime(WRONG_ANSWER_PENALTY_SECONDS);
    toast.error("−2:00 deducted from mission timer.");
  }, [deductTime]);

  const penalizeWrongAccusation = useCallback(() => {
    deductTime(WRONG_ACCUSATION_PENALTY_SECONDS);
    toast.error("−10:00 deducted from mission timer.");
  }, [deductTime]);

  const clearTimedOut = useCallback(() => {
    setTimedOut(false);
  }, []);

  const resetGame = () => {
    setGameStartTime(null);
    setMissionStarted(false);
    setPuzzleSolvedState(false);
    setWebsiteUrlState(DEFAULT_WEBSITE_URL);
    setTimeRemaining(GAME_DURATION);
    setTimedOut(false);
    clearRunSession();
    resetInvestigationState();
    resetProgressHud();
  };

  const startMission = useCallback(() => {
    const existing = loadRunSession();
    const start = existing.gameStartTime ?? Date.now();
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const remaining = Math.max(0, GAME_DURATION - elapsed);
    setTimedOut(false);
    setPuzzleSolvedState(existing.puzzleSolved ?? false);
    setTimeRemaining(existing.gameStartTime ? remaining : GAME_DURATION);
    setGameStartTime(start);
    setMissionStarted(true);
    saveRunSession({
      missionStarted: true,
      gameStartTime: start,
      timedOut: false,
      puzzleSolved: existing.puzzleSolved ?? false,
      playerId: getActivePlayerId(),
    });
  }, []);

  return (
    <GameContext.Provider
      value={{
        timeRemaining,
        timedOut,
        missionStarted,
        puzzleSolved,
        setPuzzleSolved,
        websiteUrl,
        setWebsiteUrl,
        resetGame,
        startMission,
        deductTime,
        penalizeWrongAnswer,
        penalizeWrongAccusation,
        clearTimedOut,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
