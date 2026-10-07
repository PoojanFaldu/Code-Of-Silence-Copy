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
import type { FocusedInteractable, InteractTarget } from "@/components/rooms/interaction/types";
import { setInvestigationState } from "@/lib/investigationState";

type Overlay = null | "logic" | "report" | "network" | "archive";

type Progress = {
  logicSolved: boolean;
  reportSeen: boolean;
  networkSolved: boolean;
  archiveLogged: boolean;
};

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
  const [progress, setProgress] = useState<Progress>({
    logicSolved: false,
    reportSeen: false,
    networkSolved: false,
    archiveLogged: false,
  });

  const statusText = progress.archiveLogged
    ? "Neha looks like the killer — but the original modification history is still missing."
    : progress.networkSolved
      ? "Archive open — review the access log."
      : progress.reportSeen
        ? "Neha's section was altered. Find the secure archive workstation."
        : progress.logicSolved
          ? "Terminal unlocked — read the Experiment 17 report."
          : "Office notes pointed here. Find the logic gate control panel.";

  const targets: InteractTarget[] = useMemo(
    () => [
      {
        id: "logic",
        label: progress.logicSolved && !progress.reportSeen ? "Research terminal" : "Logic gate panel",
        position: LOGIC_POS,
        active: true,
        maxDistance: 2.8,
      },
      {
        id: "archive",
        label: progress.networkSolved ? "Archive log" : "Secure archive",
        position: MONITOR_POS,
        active: progress.reportSeen,
        maxDistance: 2.8,
      },
    ],
    [progress.logicSolved, progress.reportSeen, progress.networkSolved]
  );

  const handleInteract = (id: string) => {
    if (id === "logic") {
      setOverlay(progress.logicSolved && !progress.reportSeen ? "report" : "logic");
    }
    if (id === "archive") {
      setOverlay(progress.networkSolved ? "archive" : "network");
    }
  };

  const controlsEnabled = overlay === null;

  return (
    <div className="h-screen w-screen bg-black relative">
      <div className="absolute top-4 right-4 z-20 max-w-xs rounded-lg border border-emerald-400/30 bg-black/80 px-4 py-3 text-sm text-slate-200 pointer-events-none">
        <p className="text-[11px] uppercase tracking-wider text-emerald-300 mb-1">Room 2 · Research Lab</p>
        <p>{statusText}</p>
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
          <LogicTerminal solved={progress.logicSolved} />
          <ArchiveWorkstation unlocked={progress.reportSeen} restored={progress.networkSolved} />

          <FirstPersonController boundary={ROOM2_BOUNDARY} controlsEnabled={controlsEnabled} moveSpeed={0.025} />
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
            setProgress((p) => ({ ...p, logicSolved: true }));
            setOverlay("report");
          }}
        />
      )}

      {overlay === "report" && (
        <ResearchReport
          onClose={() => {
            setProgress((p) => ({ ...p, reportSeen: true }));
            setOverlay(null);
          }}
          onContinue={() => {
            setProgress((p) => ({ ...p, reportSeen: true }));
            setOverlay("network");
          }}
        />
      )}

      {overlay === "network" && (
        <NetworkPortPuzzle
          onClose={() => setOverlay(null)}
          onSolved={() => {
            setProgress((p) => ({ ...p, networkSolved: true }));
            setOverlay("archive");
          }}
        />
      )}

      {overlay === "archive" && (
        <ArchiveReveal
          onClose={() => setOverlay(null)}
          onComplete={() => {
            setProgress((p) => ({ ...p, archiveLogged: true }));
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
            "Neha altered EXP-17 and accessed the archive at 21:17.",
            "Original modification history is still unavailable.",
            "EXP-17 references archived experimental records — physical archive index required.",
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
