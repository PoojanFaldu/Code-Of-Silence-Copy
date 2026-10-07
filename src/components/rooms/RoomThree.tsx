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
import type { FocusedInteractable, InteractTarget } from "@/components/rooms/interaction/types";
import { setInvestigationState } from "@/lib/investigationState";

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

  const [isHashSolved, setIsHashSolved] = useState(() => {
    return sessionStorage.getItem("room3_puzzle5_solved") === "true";
  });
  const [isOverlaySolved, setIsOverlaySolved] = useState(() => {
    return sessionStorage.getItem("room3_puzzle6_solved") === "true";
  });

  const handleHashSolved = () => {
    setIsHashSolved(true);
    setInvestigationState({ nehaRedHerringRevealed: true, arjunEvidenceFound: true });
  };

  const handleOverlaySolved = () => {
    setIsOverlaySolved(true);
    setInvestigationState({
      room3Complete: true,
      nehaRedHerringRevealed: true,
      arjunEvidenceFound: true,
      finalUnlocked: true,
    });
  };

  const handleProceedToServerRoom = () => {
    playKeyClick();
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

  const statusText =
    isHashSolved && isOverlaySolved
      ? "Original manipulation predates Neha — Server Room next"
      : isHashSolved
        ? "Neha changed a later copy — find the overlay mask"
        : "Search the archives. Aim at objects and press E.";

  const targets: InteractTarget[] = useMemo(
    () => [
      {
        id: "notebook",
        label: "Verma's Notebook",
        position: ROOM3_TARGET_POSITIONS.notebook,
        active: true,
        maxDistance: 2.8,
      },
      {
        id: "dossier",
        label: "Case File",
        position: ROOM3_TARGET_POSITIONS.dossier,
        active: true,
        maxDistance: 2.8,
      },
      {
        id: "hash",
        label: isHashSolved ? "Hash Terminal (solved)" : "Hash Verification Terminal",
        position: ROOM3_TARGET_POSITIONS.hash,
        active: true,
        maxDistance: 3.0,
      },
      {
        id: "overlay",
        label: isOverlaySolved ? "Overlay Lightbox (solved)" : "Overlay Mask Lightbox",
        position: ROOM3_TARGET_POSITIONS.overlay,
        active: true,
        maxDistance: 2.8,
      },
    ],
    [isHashSolved, isOverlaySolved]
  );

  const handleInteract = (id: string) => {
    if (id === "notebook") {
      playPaperSlide();
      setIsNotebookOpen(true);
    }
    if (id === "dossier") {
      playKeyClick();
      setIsDossierOpen(true);
    }
    if (id === "hash") {
      playKeyClick();
      setIsHashPuzzleOpen(true);
    }
    if (id === "overlay") {
      playPaperSlide();
      setIsOverlayPuzzleOpen(true);
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
          <FirstPersonController
            boundary={ROOM3_BOUNDARY}
            controlsEnabled={controlsEnabled}
            moveSpeed={0.012}
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
            Room 3 — The Archives
          </span>
          <span className="text-white/40 text-xs">|</span>
          <span className="font-mono text-xs text-cyan-300">{statusText}</span>
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
        onClose={() => setIsNotebookOpen(false)}
        onOpenHashPuzzle={() => {
          setIsNotebookOpen(false);
          setIsHashPuzzleOpen(true);
        }}
      />

      <HashFingerprintPuzzle
        isOpen={isHashPuzzleOpen}
        onClose={() => setIsHashPuzzleOpen(false)}
        onSolved={handleHashSolved}
        onProceedToOverlay={() => {
          setIsHashPuzzleOpen(false);
          setIsOverlayPuzzleOpen(true);
        }}
        onOpenNotebook={() => {
          setIsHashPuzzleOpen(false);
          setIsNotebookOpen(true);
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
