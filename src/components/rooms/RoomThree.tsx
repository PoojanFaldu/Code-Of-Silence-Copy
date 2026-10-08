import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { RoomThree3DObjects, ROOM3_TARGET_POSITIONS } from "./room3/RoomThree3DObjects";
import { HashFingerprintPuzzle } from "./room3/HashFingerprintPuzzle";
import { ArchiveComparisonPuzzle } from "./room3/ArchiveComparisonPuzzle";
import EvidenceTrailModal from "@/components/rooms/EvidenceTrailModal";
import { playKeyClick, playPaperSlide } from "./room3/audio";
import FirstPersonController from "@/components/rooms/interaction/FirstPersonController";
import FocusDetector from "@/components/rooms/interaction/FocusDetector";
import CrosshairHud from "@/components/rooms/interaction/CrosshairHud";
import ActivePulse from "@/components/rooms/interaction/ActivePulse";
import type { FocusedInteractable, InteractTarget } from "@/components/rooms/interaction/types";
import { setInvestigationState } from "@/lib/investigationState";
import { completeTask, unlockLog } from "@/lib/investigationProgress";

/** 0 hash → 1 archive comparison → 2 complete */
type Step = 0 | 1 | 2;

const ROOM3_BOUNDARY = {
  minX: -1.357,
  maxX: 1.123,
  minZ: 3.772,
  maxZ: 7.491,
  y: 3,
};

const LoadModel = () => {
  const { scene } = useGLTF("/model/RoomThreeModel.glb");

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

  return <primitive object={scene} position={[0, 2.3, 5]} scale={0.5} />;
};

const RoomThree = () => {
  const navigate = useNavigate();

  const [isHashPuzzleOpen, setIsHashPuzzleOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [focused, setFocused] = useState<FocusedInteractable>(null);
  const [showTrail, setShowTrail] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [isHashSolved, setIsHashSolved] = useState(false);
  const [isArchiveSolved, setIsArchiveSolved] = useState(false);

  const handleProceedToServerRoom = () => {
    playKeyClick();
    completeTask("overlay");
    unlockLog("overlay_stamp");
    setStep(2);
    setInvestigationState({
      room3Complete: true,
      arjunEvidenceFound: true,
      nehaRedHerringRevealed: true,
      finalUnlocked: true,
    });
    setIsArchiveOpen(false);
    setIsHashPuzzleOpen(false);
    setShowTrail(true);
  };

  const isAnyModalOpen = isHashPuzzleOpen || isArchiveOpen || showTrail;
  const controlsEnabled = !isAnyModalOpen;

  const activePos =
    step === 0
      ? ROOM3_TARGET_POSITIONS.hash
      : step === 1
        ? ROOM3_TARGET_POSITIONS.archive
        : null;

  const targets: InteractTarget[] = useMemo(
    () => [
      {
        id: "hash",
        label: "Archive terminal",
        position: ROOM3_TARGET_POSITIONS.hash,
        active: step === 0,
        maxDistance: 3.0,
      },
      {
        id: "archive",
        label: "Archive comparison station",
        position: ROOM3_TARGET_POSITIONS.archive,
        active: step === 1,
        maxDistance: 2.8,
      },
    ],
    [step]
  );

  const handleInteract = (id: string) => {
    if (id === "hash" && step === 0) {
      playKeyClick();
      setIsHashPuzzleOpen(true);
    }
    if (id === "archive" && step === 1) {
      playPaperSlide();
      setIsArchiveOpen(true);
    }
  };

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden select-none">
      <Canvas camera={{ position: [0, 3, 5], fov: 75 }}>
        <PerspectiveCamera makeDefault position={[0, 3, 5]} fov={75} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-5, 4, 3]} intensity={0.6} />
        <pointLight position={[0, 4.5, 4.5]} intensity={0.8} color="#94a3b8" />

        <Suspense fallback={null}>
          <LoadModel />
          <RoomThree3DObjects isHashSolved={isHashSolved} isOverlaySolved={isArchiveSolved} />
          {activePos && <ActivePulse position={activePos} visible={controlsEnabled} />}
          <FirstPersonController
            boundary={ROOM3_BOUNDARY}
            controlsEnabled={controlsEnabled}
            moveSpeed={0.009}
          />
          <FocusDetector
            targets={targets}
            enabled={controlsEnabled}
            onFocusChange={setFocused}
            onInteract={handleInteract}
          />
        </Suspense>
      </Canvas>

      <CrosshairHud focused={focused} visible={controlsEnabled && !showTrail} />

      {showTrail && (
        <EvidenceTrailModal
          findings={["Records were altered.", "An offline session log remains."]}
          nextRoomLabel="Server Room"
          onStay={() => setShowTrail(false)}
          onProceed={() => navigate("/game?room=server")}
        />
      )}

      <HashFingerprintPuzzle
        isOpen={isHashPuzzleOpen}
        onClose={() => setIsHashPuzzleOpen(false)}
        onSolved={() => {
          completeTask("hash");
          unlockLog("hash_diff");
          setIsHashSolved(true);
          setStep(1);
        }}
        onProceedToArchive={() => {
          setIsHashPuzzleOpen(false);
          setIsArchiveOpen(true);
        }}
        initialSolved={isHashSolved}
      />

      <ArchiveComparisonPuzzle
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onSolved={() => {
          completeTask("overlay");
          unlockLog("overlay_stamp");
          setIsArchiveSolved(true);
        }}
        onProceedToServerRoom={handleProceedToServerRoom}
        initialSolved={isArchiveSolved}
      />
    </div>
  );
};

export default RoomThree;
