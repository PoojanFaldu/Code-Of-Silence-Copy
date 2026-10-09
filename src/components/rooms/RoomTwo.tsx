import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import LogicGatesPuzzle from "@/components/rooms/roomTwo/LogicGatesPuzzle";
import ResearchReport from "@/components/rooms/roomTwo/ResearchReport";
import TimelineReconstructionPuzzle from "@/components/rooms/roomTwo/TimelineReconstructionPuzzle";
import ArchiveReveal from "@/components/rooms/roomTwo/ArchiveReveal";
import EvidenceTrailModal from "@/components/rooms/EvidenceTrailModal";
import FirstPersonController from "@/components/rooms/interaction/FirstPersonController";
import FocusDetector from "@/components/rooms/interaction/FocusDetector";
import CrosshairHud from "@/components/rooms/interaction/CrosshairHud";
import ActivePulse from "@/components/rooms/interaction/ActivePulse";
import type { FocusedInteractable, InteractTarget } from "@/components/rooms/interaction/types";
import { setInvestigationState } from "@/lib/investigationState";
import { completeTask, unlockLog } from "@/lib/investigationProgress";
import { loadRunSession, setRoomStep } from "@/lib/runSession";

type Overlay = null | "logic" | "report" | "timeline" | "archive";

/** 0 logic → 1 report → 2 timeline → 3 archive → 4 complete */
type Step = 0 | 1 | 2 | 3 | 4;

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
      {/* Laptop Base (Keyboard Deck & Palm Rest) */}
      <mesh position={[0, -0.192, 0.01]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.016, 0.28]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Recessed Keyboard Well */}
      <mesh position={[0, -0.183, -0.025]}>
        <boxGeometry args={[0.35, 0.002, 0.13]} />
        <meshStandardMaterial color="#090d16" roughness={0.8} />
      </mesh>

      {/* Keyboard Keybed */}
      <mesh position={[0, -0.181, -0.025]}>
        <boxGeometry args={[0.34, 0.003, 0.12]} />
        <meshStandardMaterial color="#172033" metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Spacebar Accent */}
      <mesh position={[0, -0.179, 0.022]}>
        <boxGeometry args={[0.12, 0.002, 0.018]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* Touchpad */}
      <mesh position={[0, -0.183, 0.082]}>
        <boxGeometry args={[0.13, 0.002, 0.08]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Front Lip Opening Groove */}
      <mesh position={[0, -0.183, 0.148]}>
        <boxGeometry args={[0.07, 0.003, 0.006]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {/* Chassis Side LED Indicator */}
      <mesh position={[0.211, -0.192, 0.06]}>
        <sphereGeometry args={[0.0025, 8, 8]} />
        <meshBasicMaterial color={restored ? "#38bdf8" : unlocked ? "#22c55e" : "#0284c7"} />
      </mesh>

      {/* Display Clamshell Lid & Screen (Pivoting from back hinge) */}
      <group position={[0, -0.184, -0.13]} rotation={[-0.32, 0, 0]}>
        {/* Cylindrical Display Hinge */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.007, 0.007, 0.38, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Outer Lid Aluminum Backing */}
        <mesh position={[0, 0.13, -0.005]} castShadow>
          <boxGeometry args={[0.42, 0.27, 0.01]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.25} />
        </mesh>

        {/* Display Inner Bezel */}
        <mesh position={[0, 0.13, 0.001]}>
          <boxGeometry args={[0.40, 0.255, 0.002]} />
          <meshStandardMaterial color="#0a0e17" roughness={0.7} />
        </mesh>

        {/* Active Screen Display (lit/glowing activity log) */}
        <mesh position={[0, 0.13, 0.003]}>
          <planeGeometry args={[0.38, 0.23]} />
          <meshStandardMaterial
            color={restored ? "#38bdf8" : unlocked ? "#0284c7" : "#0f172a"}
            emissive={restored ? "#0284c7" : unlocked ? "#0369a1" : "#070d18"}
            emissiveIntensity={restored ? 1.5 : unlocked ? 1.0 : 0.25}
            roughness={0.2}
          />
        </mesh>

        {/* Top Bezel HD Webcam Lens */}
        <mesh position={[0, 0.25, 0.003]}>
          <circleGeometry args={[0.0025, 10]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>

        {/* Bottom Bezel Manufacturer Badge */}
        <mesh position={[0, 0.014, 0.003]}>
          <boxGeometry args={[0.04, 0.004, 0.001]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

const RoomTwo = () => {
  const navigate = useNavigate();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [focused, setFocused] = useState<FocusedInteractable>(null);
  const [showTrail, setShowTrail] = useState(false);
  const [step, setStepState] = useState<Step>(() => {
    return Math.min(4, Math.max(0, loadRunSession().rooms.research.step)) as Step;
  });
  const setStep = (next: Step) => {
    setStepState(next);
    setRoomStep("research", next);
  };

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
        id: "timeline",
        label: "Activity log",
        position: MONITOR_POS,
        active: step === 2,
        maxDistance: 2.8,
      },
      {
        id: "archive",
        label: "Archive access",
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
    if (id === "timeline" && step === 2) setOverlay("timeline");
    if (id === "archive" && step === 3) setOverlay("archive");
  };

  const controlsEnabled = overlay === null && !showTrail;

  return (
    <div className="h-screen w-screen bg-black relative">

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
            completeTask("logic");
            setStep(1);
            setOverlay(null);
          }}
        />
      )}

      {overlay === "report" && (
        <ResearchReport
          onClose={() => setOverlay(null)}
          onContinue={() => {
            completeTask("report");
            unlockLog("exp17_report");
            setStep(2);
            setOverlay(null);
          }}
        />
      )}

      {overlay === "timeline" && (
        <TimelineReconstructionPuzzle
          onClose={() => setOverlay(null)}
          onSolved={() => {
            completeTask("timeline");
            unlockLog("timeline_order");
            setStep(3);
            setOverlay(null);
          }}
        />
      )}

      {overlay === "archive" && (
        <ArchiveReveal
          onClose={() => setOverlay(null)}
          onComplete={() => {
            completeTask("archive");
            unlockLog("archive_access");
            setStep(4);
            setOverlay(null);
            setInvestigationState({
              room2Complete: true,
              nehaSuspect: true,
            });
            setShowTrail(true);
          }}
        />
      )}

      {showTrail && (
        <EvidenceTrailModal
          findings={[
            "Activity during the missing period is incomplete.",
            "Someone was active after Verma's session opened.",
            "Offline copies may exist in the archives.",
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
