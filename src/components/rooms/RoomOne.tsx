import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import LaserDeflectionPuzzle from "@/components/rooms/roomOne/LaserDeflectionPuzzle";
import DrawerNote from "@/components/rooms/roomOne/DrawerNote";
import CipherPuzzle from "@/components/rooms/roomOne/CipherPuzzle";
import BlueFolderReveal from "@/components/rooms/roomOne/BlueFolderReveal";
import EvidenceTrailModal from "@/components/rooms/EvidenceTrailModal";
import FirstPersonController from "@/components/rooms/interaction/FirstPersonController";
import FocusDetector from "@/components/rooms/interaction/FocusDetector";
import CrosshairHud from "@/components/rooms/interaction/CrosshairHud";
import type { FocusedInteractable, InteractTarget } from "@/components/rooms/interaction/types";
import { setInvestigationState } from "@/lib/investigationState";

type Overlay = null | "laser" | "drawer" | "cipher" | "folder";

type Progress = {
  laserSolved: boolean;
  cipherSolved: boolean;
  folderOpened: boolean;
};

const DESK_DEVICE_POS: [number, number, number] = [1.28, 2.205, 0.62];
const DRAWER_POS: [number, number, number] = [1.42, 1.95, 0.85];
const FOLDER_POS: [number, number, number] = [0.98, 2.22, 1.05];

const ROOM1_BOUNDARY = {
  minX: -1.65,
  maxX: 1.52,
  minZ: -1.58,
  maxZ: 1.97,
  y: 3.0,
};

const LoadModel = ({
  position = [0, 2, 0] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number],
}) => {
  const ModelRef = useRef<THREE.Object3D>(null);
  const { scene } = useGLTF("/model/RoomOneModel.glb");

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

  return (
    <group position={position} rotation={rotation} scale={0.1}>
      <primitive ref={ModelRef} object={scene} />
    </group>
  );
};

function LaserDevice({ solved }: { solved: boolean }) {
  return (
    <group position={DESK_DEVICE_POS} rotation={[0, -0.35, 0]}>
      <mesh castShadow position={[0, 0.025, 0]}>
        <boxGeometry args={[0.26, 0.05, 0.18]} />
        <meshStandardMaterial color="#1f2937" metalness={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[-0.07, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.028, 0.09, 12]} />
        <meshStandardMaterial color={solved ? "#0ea5e9" : "#334155"} metalness={0.4} roughness={0.45} />
      </mesh>
      <mesh position={[0.05, 0.055, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.1, 0.008, 0.07]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  );
}

function ConcealedDrawer({ unlocked }: { unlocked: boolean }) {
  const openZ = unlocked ? 0.1 : 0;
  return (
    <group position={DRAWER_POS}>
      <mesh position={[0, 0, openZ]} castShadow>
        <boxGeometry args={[0.32, 0.07, 0.2]} />
        <meshStandardMaterial color={unlocked ? "#4a3728" : "#2a2118"} />
      </mesh>
      <mesh position={[0, 0, openZ + 0.11]}>
        <boxGeometry args={[0.05, 0.012, 0.018]} />
        <meshStandardMaterial color="#c4a574" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function BlueFolderProp({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <group position={FOLDER_POS} rotation={[-0.05, 0.35, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.2, 0.015, 0.26]} />
        <meshStandardMaterial color="#1d4ed8" />
      </mesh>
      <mesh position={[0, 0.01, -0.02]}>
        <boxGeometry args={[0.18, 0.004, 0.22]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
    </group>
  );
}

function DeskNote({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <group position={[1.0, 2.16, 0.78]} rotation={[-0.1, 0.4, 0.05]}>
      <mesh castShadow>
        <boxGeometry args={[0.18, 0.002, 0.12]} />
        <meshStandardMaterial color="#f5e6c8" />
      </mesh>
    </group>
  );
}

const RoomOne = () => {
  const navigate = useNavigate();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [focused, setFocused] = useState<FocusedInteractable>(null);
  const [showTrail, setShowTrail] = useState(false);
  const [progress, setProgress] = useState<Progress>({
    laserSolved: false,
    cipherSolved: false,
    folderOpened: false,
  });

  const statusText = progress.folderOpened
    ? "Neha looks suspicious. Experiment 17 leads to the Research Lab."
    : progress.cipherSolved
      ? "Decoded. Open the blue folder on the desk."
      : progress.laserSolved
        ? "Drawer unlocked. Read Verma's encrypted note."
        : "Look around Verma's desk. Aim at objects and press E.";

  const targets: InteractTarget[] = useMemo(
    () => [
      {
        id: "laser",
        label: "Optical device",
        position: DESK_DEVICE_POS,
        active: true,
        maxDistance: 2.6,
      },
      {
        id: "drawer",
        label: "Concealed drawer",
        position: [DRAWER_POS[0], DRAWER_POS[1] + 0.05, DRAWER_POS[2]],
        active: progress.laserSolved,
        maxDistance: 2.6,
      },
      {
        id: "folder",
        label: "Blue folder",
        position: FOLDER_POS,
        active: progress.cipherSolved,
        maxDistance: 2.6,
      },
    ],
    [progress.laserSolved, progress.cipherSolved]
  );

  const handleInteract = (id: string) => {
    if (id === "laser") setOverlay("laser");
    if (id === "drawer") setOverlay("drawer");
    if (id === "folder") setOverlay("folder");
  };

  const controlsEnabled = overlay === null;

  return (
    <div className="h-screen w-screen bg-black relative">
      <div className="absolute top-4 right-4 z-20 max-w-xs rounded-lg border border-cyan-400/30 bg-black/80 px-4 py-3 text-sm text-slate-200 pointer-events-none">
        <p className="text-[11px] uppercase tracking-wider text-cyan-300 mb-1">Room 1 · Dr. Verma&apos;s Office</p>
        <p>{statusText}</p>
      </div>

      <Canvas gl={{ antialias: true, alpha: true }} camera={{ position: [0, 3, 0], fov: 75 }}>
        <PerspectiveCamera makeDefault position={[0, 3, 0]} fov={75} near={0.1} far={1000} />
        <ambientLight intensity={0.09} />
        <directionalLight position={[2, 5, 1]} intensity={0.1} color="#8da6ce" castShadow />
        <pointLight position={[0, 3, 0]} intensity={0.2} color="#ffecd6" distance={10} decay={2} />
        <spotLight color="#ff00a6ff" intensity={5} position={[1, -1, 0]} distance={3} decay={2} castShadow />
        <fog attach="fog" args={["#1a2332", 5, 15]} />

        <Suspense fallback={null}>
          <LoadModel />
          <DeskNote visible={!progress.laserSolved} />
          <LaserDevice solved={progress.laserSolved} />
          <ConcealedDrawer unlocked={progress.laserSolved} />
          <BlueFolderProp visible={progress.cipherSolved} />

          <FirstPersonController boundary={ROOM1_BOUNDARY} controlsEnabled={controlsEnabled} moveSpeed={0.028} />
          <FocusDetector
            targets={targets}
            enabled={controlsEnabled}
            onFocusChange={setFocused}
            onInteract={handleInteract}
          />
        </Suspense>
      </Canvas>

      <CrosshairHud focused={focused} visible={controlsEnabled} />

      {overlay === "laser" && (
        <LaserDeflectionPuzzle
          onClose={() => setOverlay(null)}
          onSolved={() => {
            setProgress((p) => ({ ...p, laserSolved: true }));
            setOverlay("drawer");
          }}
        />
      )}

      {overlay === "drawer" && (
        <DrawerNote
          onClose={() => setOverlay(null)}
          onContinue={() => setOverlay(progress.cipherSolved ? null : "cipher")}
        />
      )}

      {overlay === "cipher" && (
        <CipherPuzzle
          onClose={() => setOverlay(null)}
          onSolved={() => {
            setProgress((p) => ({ ...p, cipherSolved: true }));
            setOverlay("folder");
          }}
        />
      )}

      {overlay === "folder" && (
        <BlueFolderReveal
          onClose={() => setOverlay(null)}
          onComplete={() => {
            setProgress((p) => ({ ...p, folderOpened: true }));
            setOverlay(null);
            setInvestigationState({
              room1Complete: true,
              nehaSuspect: true,
            });
            sessionStorage.setItem("room1_neha_suspect", "true");
            sessionStorage.setItem("room1_to_lab", "true");
            setShowTrail(true);
          }}
        />
      )}

      {showTrail && (
        <EvidenceTrailModal
          findings={[
            "Verma was investigating research-data manipulation.",
            "Neha Rao appears repeatedly in his notes — she looks suspicious.",
            "Experiment 17 is stored in the Research Laboratory.",
          ]}
          nextRoomLabel="Research Lab"
          onStay={() => setShowTrail(false)}
          onProceed={() => navigate("/game?room=research")}
        />
      )}
    </div>
  );
};

export default RoomOne;
