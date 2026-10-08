import { createContext, useCallback, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { resetInvestigationState } from "@/lib/investigationState";

/** Deducted from the mission timer on each wrong puzzle / accusation guess. */
export const WRONG_ANSWER_PENALTY_SECONDS = 120;

interface GameContextType {
  timeRemaining: number;
  puzzleSolved: boolean;
  setPuzzleSolved: (solved: boolean) => void;
  websiteUrl: string;
  setWebsiteUrl: (url: string) => void;
  resetGame: () => void;
  deductTime: (seconds: number) => void;
  penalizeWrongAnswer: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const GAME_DURATION = 3600; // 60 minutes in seconds
const DEFAULT_WEBSITE_URL = "https://code-of-silence-unlocked-53719-03265-76-14967.lovable.app/";

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameStartTime, setGameStartTime] = useState<number>(() => Date.now());
  const [puzzleSolved, setPuzzleSolvedState] = useState<boolean>(false);
  const [websiteUrl, setWebsiteUrlState] = useState<string>(DEFAULT_WEBSITE_URL);
  const [timeRemaining, setTimeRemaining] = useState<number>(GAME_DURATION);

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStartTime]);

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

  const deductTime = useCallback((seconds: number) => {
    setGameStartTime((prev) => prev - seconds * 1000);
    setTimeRemaining((prev) => Math.max(0, prev - seconds));
  }, []);

  const penalizeWrongAnswer = useCallback(() => {
    deductTime(WRONG_ANSWER_PENALTY_SECONDS);
    toast.error("−2:00 deducted from mission timer.");
  }, [deductTime]);

  const resetGame = () => {
    const newStartTime = Date.now();
    setGameStartTime(newStartTime);
    setPuzzleSolvedState(false);
    setWebsiteUrlState(DEFAULT_WEBSITE_URL);
    setTimeRemaining(GAME_DURATION);

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("d2_solved");
      sessionStorage.removeItem("d3_solved");
      resetInvestigationState();
    }
  };

  return (
    <GameContext.Provider
      value={{
        timeRemaining,
        puzzleSolved,
        setPuzzleSolved,
        websiteUrl,
        setWebsiteUrl,
        resetGame,
        deductTime,
        penalizeWrongAnswer,
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
