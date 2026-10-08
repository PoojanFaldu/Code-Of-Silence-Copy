import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import Game from "./pages/Game";
import NotFound from "./pages/NotFound";
import CodeOfSilence from "./pages/CodeOfSilence";
import { useGame } from "./contexts/GameContext";
import GlobalTimer from "./components/common/GlobalTimer";

const queryClient = new QueryClient();

const TimerRedirect = () => {
  const { timeRemaining, resetGame } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    if (timeRemaining <= 0) {
      resetGame();
      navigate("/", { replace: true });
    }
  }, [timeRemaining, resetGame, navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TimerRedirect />
        <GlobalTimer />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/game" element={<Game />} />
          <Route path="/code-of-silence" element={<CodeOfSilence />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
