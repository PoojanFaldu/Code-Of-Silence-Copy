import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { RoomThree3DObjects, ROOM3_TARGET_POSITIONS } from "./room3/RoomThree3DObjects";
import { VermaNotebookModal } from "./room3/VermaNotebookModal";
import { HashFingerprintPuzzle } from "./room3/HashFingerprintPuzzle";
import { OverlayMaskPuzzle } from "./room3/OverlayMaskPuzzle";
import { CaseDossierModal } from "./room3/CaseDossierModal";
import EvidenceTrailModal from "@/components/rooms/EvidenceTrailModal";
import { playKeyClick, playPaperSlide } from "./room3/audio";
import FirstPersonController from "@/components/rooms/interaction/FirstPersonController";
import FocusDetector from "@/components/rooms/interaction/FocusDetector";
import CrosshairHud from "@/components/rooms/interaction/CrosshairHud";
import ActivePulse from "@/components/rooms/interaction/ActivePulse";
import type { FocusedInteractable, InteractTarget } from "@/components/rooms/interaction/types";
import { setInvestigationState } from "@/lib/investigationState";

/** 0 notebook → 1 hash → 2 overlay → 3 dossier → 4 complete */
type Step = 0 | 1 | 2 | 3 | 4;

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

  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isHashPuzzleOpen, setIsHashPuzzleOpen] = useState(false);
  const [isOverlayPuzzleOpen, setIsOverlayPuzzleOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [focused, setFocused] = useState<FocusedInteractable>(null);
  const [showTrail, setShowTrail] = useState(false);
  const [step, setStep] = useState<Step>(0);

  const [isHashSolved, setIsHashSolved] = useState(false);
  const [isOverlaySolved, setIsOverlaySolved] = useState(false);

  const handleHashSolved = () => {
    setIsHashSolved(true);
    setStep(2);
    setInvestigationState({ nehaRedHerringRevealed: true, arjunEvidenceFound: true });
  };

  const handleOverlaySolved = () => {
    setIsOverlaySolved(true);
    setStep(3);
    setInvestigationState({
      nehaRedHerringRevealed: true,
      arjunEvidenceFound: true,
    });
  };

  const handleProceedToServerRoom = () => {
    playKeyClick();
    setStep(4);
    setInvestigationState({
      room3Complete: true,
      arjunEvidenceFound: true,
      nehaRedHerringRevealed: true,
      finalUnlocked: true,
    });
    setIsOverlayPuzzleOpen(false);
    setIsDossierOpen(false);
    setIsHashPuzzleOpen(false);
    setShowTrail(true);
  };

  const isAnyModalOpen = isNotebookOpen || isHashPuzzleOpen || isOverlayPuzzleOpen || isDossierOpen || showTrail;
  const controlsEnabled = !isAnyModalOpen;

  const activePos =
    step === 0
      ? ROOM3_TARGET_POSITIONS.notebook
      : step === 1
        ? ROOM3_TARGET_POSITIONS.hash
        : step === 2
          ? ROOM3_TARGET_POSITIONS.overlay
          : step === 3
            ? ROOM3_TARGET_POSITIONS.dossier
            : null;

  const targets: InteractTarget[] = useMemo(
    () => [
      {
        id: "notebook",
        label: "Verma's Notebook",
        position: ROOM3_TARGET_POSITIONS.notebook,
        active: step === 0,
        maxDistance: 2.8,
      },
      {
        id: "hash",
        label: "Archive terminal",
        position: ROOM3_TARGET_POSITIONS.hash,
        active: step === 1,
        maxDistance: 3.0,
      },
      {
        id: "overlay",
        label: "Overlay lightbox",
        position: ROOM3_TARGET_POSITIONS.overlay,
        active: step === 2,
        maxDistance: 2.8,
      },
      {
        id: "dossier",
        label: "Case file",
        position: ROOM3_TARGET_POSITIONS.dossier,
        active: step === 3,
        maxDistance: 2.8,
      },
    ],
    [step]
  );

  const handleInteract = (id: string) => {
    if (id === "notebook" && step === 0) {
      playPaperSlide();
      setIsNotebookOpen(true);
    }
    if (id === "hash" && step === 1) {
      playKeyClick();
      setIsHashPuzzleOpen(true);
    }
    if (id === "overlay" && step === 2) {
      playPaperSlide();
      setIsOverlayPuzzleOpen(true);
    }
    if (id === "dossier" && step === 3) {
      playKeyClick();
      setIsDossierOpen(true);
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
          <RoomThree3DObjects isHashSolved={isHashSolved} isOverlaySolved={isOverlaySolved} />
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

      <div className="absolute top-4 left-1/2 z-30 -translate-x-1/2 pointer-events-none">
        <div className="flex items-center gap-3 rounded-full border border-cyan-500/30 bg-black/85 px-5 py-2.5 shadow-2xl backdrop-blur-md">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-white sm:text-sm">
            Archives
          </span>
          <span className="text-white/40 text-xs">|</span>
          <span className="font-mono text-xs text-cyan-300">Aim · Press E</span>
        </div>
      </div>

      <CrosshairHud focused={focused} visible={controlsEnabled && !showTrail} />

      {showTrail && (
        <EvidenceTrailModal
          findings={[
            "Neha altered later EXP-17 records — but she did not create the original falsification.",
            "Original EXP-17 baseline / reviewer: Dr. Arjun Mehta.",
            "Digital modification logs that identify the first change are stored in the Server Room.",
          ]}
          nextRoomLabel="Server Room"
          onStay={() => setShowTrail(false)}
          onProceed={() => navigate("/game?room=server")}
        />
      )}

      <VermaNotebookModal
        isOpen={isNotebookOpen}
        onClose={() => {
          setIsNotebookOpen(false);
          if (step === 0) setStep(1);
        }}
        onOpenHashPuzzle={() => {
          setIsNotebookOpen(false);
          if (step === 0) setStep(1);
        }}
      />

      <HashFingerprintPuzzle
        isOpen={isHashPuzzleOpen}
        onClose={() => setIsHashPuzzleOpen(false)}
        onSolved={handleHashSolved}
        onProceedToOverlay={() => {
          setIsHashPuzzleOpen(false);
        }}
        onOpenNotebook={() => {
          setIsHashPuzzleOpen(false);
        }}
        initialSolved={isHashSolved}
      />

      <OverlayMaskPuzzle
        isOpen={isOverlayPuzzleOpen}
        onClose={() => setIsOverlayPuzzleOpen(false)}
        onSolved={handleOverlaySolved}
        onProceedToServerRoom={handleProceedToServerRoom}
        initialSolved={isOverlaySolved}
      />

      <CaseDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        isHashSolved={isHashSolved}
        isOverlaySolved={isOverlaySolved}
        onProceedToServerRoom={handleProceedToServerRoom}
      />
    </div>
  );
};

export default RoomThree;
