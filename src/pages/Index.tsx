import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TitleScreen } from "@/components/intro/TitleScreen";
import { LogoReveal } from "@/components/intro/LogoReveal";
import { TeamIdentification } from "@/components/intro/TeamIdentification";
import { InvestigationMap } from "@/components/intro/InvestigationMap";

type Phase = "title" | "logo" | "team" | "investigation";

const Index = () => {
  const [searchParams] = useSearchParams();
  const skipToMap = searchParams.get("skipIntro") === "true";
  const newPlayer = searchParams.get("newPlayer") === "1";

  const [phase, setPhase] = useState<Phase>(() => {
    if (newPlayer) return "team";
    if (skipToMap) return "investigation";
    return "title";
  });

  const handleTeamComplete = (_name: string) => {
    setPhase("investigation");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {phase === "title" && <TitleScreen onComplete={() => setPhase("logo")} />}
      {phase === "logo" && <LogoReveal onComplete={() => setPhase("team")} />}
      {phase === "team" && <TeamIdentification onComplete={handleTeamComplete} />}
      {phase === "investigation" && <InvestigationMap />}
    </main>
  );
};

export default Index;
