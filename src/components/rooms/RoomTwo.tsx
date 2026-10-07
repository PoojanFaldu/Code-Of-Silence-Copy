import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import LogicGatesPuzzle from "@/components/rooms/roomTwo/LogicGatesPuzzle";
import ResearchReport from "@/components/rooms/roomTwo/ResearchReport";
import NetworkPortPuzzle from "@/components/rooms/roomTwo/NetworkPortPuzzle";
import ArchiveReveal from "@/components/rooms/roomTwo/ArchiveReveal";
import EvidenceTrailModal from "@/components/rooms/EvidenceTrailModal";
import FirstPersonController from "@/components/rooms/interaction/FirstPersonController";
import FocusDetector from "@/components/rooms/interaction/FocusDetector";
import CrosshairHud from "@/components/rooms/interaction/CrosshairHud";
import ActivePulse from "@/components/rooms/interaction/ActivePulse";
import type { FocusedInteractable, InteractTarget } from "@/components/rooms/interaction/types";
import { setInvestigationState } from "@/lib/investigationState";

type Overlay = null | "logic" | "report" | "network" | "archive";

/** 0 logic → 1 report → 2 network → 3 archive → 4 complete */
type Step = 0 | 1 | 2 | 3 | 4;

// Resting on the white workstation desk (left console)
const LOGIC_POS: [number, number, number] = [-0.55, 3.02, 4.35];
const MONITOR_POS: [number, number, number] = [0.55, 2.85, 5.35];

const ROOM2_BOUNDARY = {
  minX: -1.875,
  maxX: 1.8,
  minZ: 2.225,
  maxZ: 8.05,
  y: 4,
};

const LoadModel = () => {
  const { scene } = useGLTF("/model/RoomTwoModel.glb");
  useEffect(() => {
    if (scene) {
      scene.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene]);
  return <primitive object={scene} position={[-1, 2.8, 4]} scale={0.8} />;
};

function LogicTerminal({ solved }: { solved: boolean }) {
  return (
    // Flat on the desk, screen facing up toward the player
    <group position={LOGIC_POS} rotation={[-Math.PI / 2 + 0.18, 0.35, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.42, 0.28, 0.04]} />
        <meshStandardMaterial color="#0f172a" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.022]}>
        <boxGeometry args={[0.34, 0.22, 0.008]} />
        <meshStandardMaterial color={solved ? "#14532d" : "#111827"} />
      </mesh>
    </group>
  );
}

function ArchiveWorkstation({ unlocked, restored }: { unlocked: boolean; restored: boolean }) {
  return (
    <group position={MONITOR_POS} rotation={[0, -0.4, 0]}>
      <mesh position={[0, -0.18, 0.02]} castShadow>
        <boxGeometry args={[0.3, 0.04, 0.18]} />
        <meshStandardMaterial color="#334155" metalness={0.35} roughness={0.5} />
      </mesh>
      <mesh castShadow>
        <boxGeometry args={[0.52, 0.34, 0.05]} />
        <meshStandardMaterial color="#0f172a" metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.44, 0.26, 0.01]} />
        <meshStandardMaterial
          color={restored ? "#0c4a6e" : unlocked ? "#172554" : "#111827"}
        />
      </mesh>
    </group>
  );
}

const RoomTwo = () => {
  const navigate = useNavigate();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [focused, setFocused] = useState<FocusedInteractable>(null);
  const [showTrail, setShowTrail] = useState(false);
  const [step, setStep] = useState<Step>(0);

  const activePos = step === 0 || step === 1 ? LOGIC_POS : step === 2 || step === 3 ? MONITOR_POS : null;

  const targets: InteractTarget[] = useMemo(
    () => [
      {
        id: "logic",
        label: "Logic gate panel",
        position: LOGIC_POS,
        active: step === 0,
        maxDistance: 2.8,
      },
      {
        id: "report",
        label: "Research terminal",
        position: LOGIC_POS,
        active: step === 1,
        maxDistance: 2.8,
      },
      {
        id: "network",
        label: "Archive gateway",
        position: MONITOR_POS,
        active: step === 2,
        maxDistance: 2.8,
      },
      {
        id: "archive",
        label: "Access log",
        position: MONITOR_POS,
        active: step === 3,
        maxDistance: 2.8,
      },
    ],
    [step]
  );

  const handleInteract = (id: string) => {
    if (id === "logic" && step === 0) setOverlay("logic");
    if (id === "report" && step === 1) setOverlay("report");
    if (id === "network" && step === 2) setOverlay("network");
    if (id === "archive" && step === 3) setOverlay("archive");
  };

  const controlsEnabled = overlay === null && !showTrail;

  return (
    <div className="h-screen w-screen bg-black relative">
      <div className="absolute top-4 right-4 z-20 max-w-xs rounded-lg border border-emerald-400/25 bg-black/75 px-4 py-3 text-sm text-slate-300 pointer-events-none">
        <p className="text-[11px] uppercase tracking-wider text-emerald-300/90 mb-1">Research Lab</p>
        <p className="text-xs text-slate-400">Search the lab. Aim · Press E</p>
      </div>

      <Canvas camera={{ position: [0, 4, 8], fov: 75 }}>
        <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={75} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <directionalLight position={[-10, 10, -10]} intensity={0.8} />
        <pointLight position={[0, 6, 0]} intensity={2} />
        <pointLight position={[5, 4, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-5, 4, -5]} intensity={1.5} color="#ffffff" />

        <Suspense fallback={null}>
          <LoadModel />
          <LogicTerminal solved={step > 0} />
          <ArchiveWorkstation unlocked={step >= 2} restored={step >= 3} />
          {activePos && <ActivePulse position={activePos} visible={controlsEnabled} />}

          <FirstPersonController boundary={ROOM2_BOUNDARY} controlsEnabled={controlsEnabled} moveSpeed={0.018} />
          <FocusDetector
            targets={targets}
            enabled={controlsEnabled}
            onFocusChange={setFocused}
            onInteract={handleInteract}
          />
        </Suspense>
      </Canvas>

      <CrosshairHud focused={focused} visible={controlsEnabled} />

      {overlay === "logic" && (
        <LogicGatesPuzzle
          onClose={() => setOverlay(null)}
          onSolved={() => {
            setStep(1);
            setOverlay(null);
          }}
        />
      )}

      {overlay === "report" && (
        <ResearchReport
          onClose={() => {
            setStep(2);
            setOverlay(null);
          }}
          onContinue={() => {
            setStep(2);
            setOverlay(null);
          }}
        />
      )}

      {overlay === "network" && (
        <NetworkPortPuzzle
          onClose={() => setOverlay(null)}
          onSolved={() => {
            setStep(3);
            setOverlay(null);
          }}
        />
      )}

      {overlay === "archive" && (
        <ArchiveReveal
          onClose={() => setOverlay(null)}
          onComplete={() => {
            setStep(4);
            setOverlay(null);
            setInvestigationState({
              room2Complete: true,
              nehaSuspect: true,
            });
            sessionStorage.setItem("room2_neha_suspect", "true");
            sessionStorage.setItem("room2_exp17_archive", "true");
            sessionStorage.setItem("room2_history_missing", "true");
            setShowTrail(true);
          }}
        />
      )}

      {showTrail && (
        <EvidenceTrailModal
          findings={[
            "EXP-17 current values do not match the baseline.",
            "Neha Rao is linked to the latest archive access.",
            "Physical archived copies of EXP-17 may explain the missing history.",
          ]}
          nextRoomLabel="Archives"
          onStay={() => setShowTrail(false)}
          onProceed={() => navigate("/game?room=archive")}
        />
      )}
    </div>
  );
};

export default RoomTwo;
