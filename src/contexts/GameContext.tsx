import { createContext, useCallback, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { resetInvestigationState } from "@/lib/investigationState";
import { resetProgressHud } from "@/lib/investigationProgress";
import { MISSION_DURATION_SECONDS, recordTimeout } from "@/lib/eventDb";

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

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [missionStarted, setMissionStarted] = useState(false);
  const [puzzleSolved, setPuzzleSolvedState] = useState<boolean>(false);
  const [websiteUrl, setWebsiteUrlState] = useState<string>(DEFAULT_WEBSITE_URL);
  const [timeRemaining, setTimeRemaining] = useState<number>(GAME_DURATION);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!missionStarted || timedOut || gameStartTime == null) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setTimedOut(true);
        // Full mission budget consumed (includes prior penalties baked into start time).
        recordTimeout(GAME_DURATION);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [gameStartTime, missionStarted, timedOut]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("d2_solved");
      sessionStorage.removeItem("d3_solved");
    }
  }, []);

  const setPuzzleSolved = (solved: boolean) => {
    setPuzzleSolvedState(solved);
  };

  const setWebsiteUrl = (url: string) => {
    setWebsiteUrlState(url);
  };

  const deductTime = useCallback(
    (seconds: number) => {
      if (!missionStarted) return;
      setGameStartTime((prev) => (prev == null ? prev : prev - seconds * 1000));
      setTimeRemaining((prev) => {
        const next = Math.max(0, prev - seconds);
        if (next <= 0) {
          setTimedOut(true);
          recordTimeout(GAME_DURATION);
        }
        return next;
      });
    },
    [missionStarted]
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

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("d2_solved");
      sessionStorage.removeItem("d3_solved");
      resetInvestigationState();
      resetProgressHud();
    }
  };

  const startMission = useCallback(() => {
    setTimedOut(false);
    setPuzzleSolvedState(false);
    setTimeRemaining(GAME_DURATION);
    setGameStartTime(Date.now());
    setMissionStarted(true);
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
