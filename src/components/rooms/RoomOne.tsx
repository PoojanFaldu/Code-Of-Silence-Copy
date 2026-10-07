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
import ActivePulse from "@/components/rooms/interaction/ActivePulse";
import type { FocusedInteractable, InteractTarget } from "@/components/rooms/interaction/types";
import { setInvestigationState } from "@/lib/investigationState";

type Overlay = null | "laser" | "drawer" | "cipher" | "folder";

/** 0 laser → 1 drawer → 2 cipher → 3 folder → 4 complete */
type Step = 0 | 1 | 2 | 3 | 4;

const DESK_DEVICE_POS: [number, number, number] = [1.28, 2.205, 0.62];
const DRAWER_POS: [number, number, number] = [1.42, 1.95, 0.85];
const CIPHER_POS: [number, number, number] = [1.15, 2.21, 0.88];
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

function CipherScrap({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <group position={CIPHER_POS} rotation={[-0.12, 0.5, 0.02]}>
      <mesh castShadow>
        <boxGeometry args={[0.14, 0.002, 0.1]} />
        <meshStandardMaterial color="#efe6d5" />
      </mesh>
    </group>
  );
}

const RoomOne = () => {
  const navigate = useNavigate();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [focused, setFocused] = useState<FocusedInteractable>(null);
  const [showTrail, setShowTrail] = useState(false);
  const [step, setStep] = useState<Step>(0);

  const activePos =
    step === 0
      ? DESK_DEVICE_POS
      : step === 1
        ? ([DRAWER_POS[0], DRAWER_POS[1] + 0.05, DRAWER_POS[2]] as [number, number, number])
        : step === 2
          ? CIPHER_POS
          : step === 3
            ? FOLDER_POS
            : null;

  const targets: InteractTarget[] = useMemo(
    () => [
      {
        id: "laser",
        label: "Optical device",
        position: DESK_DEVICE_POS,
        active: step === 0,
        maxDistance: 2.6,
      },
      {
        id: "drawer",
        label: "Concealed drawer",
        position: [DRAWER_POS[0], DRAWER_POS[1] + 0.05, DRAWER_POS[2]],
        active: step === 1,
        maxDistance: 2.6,
      },
      {
        id: "cipher",
        label: "Encrypted scrap",
        position: CIPHER_POS,
        active: step === 2,
        maxDistance: 2.6,
      },
      {
        id: "folder",
        label: "Blue folder",
        position: FOLDER_POS,
        active: step === 3,
        maxDistance: 2.6,
      },
    ],
    [step]
  );

  const handleInteract = (id: string) => {
    if (id === "laser" && step === 0) setOverlay("laser");
    if (id === "drawer" && step === 1) setOverlay("drawer");
    if (id === "cipher" && step === 2) setOverlay("cipher");
    if (id === "folder" && step === 3) setOverlay("folder");
  };

  const controlsEnabled = overlay === null && !showTrail;

  return (
    <div className="h-screen w-screen bg-black relative">
      <div className="absolute top-4 right-4 z-20 max-w-xs rounded-lg border border-cyan-400/25 bg-black/75 px-4 py-3 text-sm text-slate-300 pointer-events-none">
        <p className="text-[11px] uppercase tracking-wider text-cyan-300/90 mb-1">Dr. Verma&apos;s Office</p>
        <p className="text-xs text-slate-400">Search the desk. Aim · Press E</p>
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
          <LaserDevice solved={step > 0} />
          <ConcealedDrawer unlocked={step >= 1} />
          <CipherScrap visible={step >= 2} />
          <BlueFolderProp visible={step >= 3} />
          {activePos && <ActivePulse position={activePos} visible={controlsEnabled} />}

          <FirstPersonController boundary={ROOM1_BOUNDARY} controlsEnabled={controlsEnabled} moveSpeed={0.02} />
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
            setStep(1);
            setOverlay(null);
          }}
        />
      )}

      {overlay === "drawer" && (
        <DrawerNote
          onClose={() => setOverlay(null)}
          onContinue={() => {
            setStep(2);
            setOverlay(null);
          }}
        />
      )}

      {overlay === "cipher" && (
        <CipherPuzzle
          onClose={() => setOverlay(null)}
          onSolved={() => {
            setStep(3);
            setOverlay(null);
          }}
        />
      )}

      {overlay === "folder" && (
        <BlueFolderReveal
          onClose={() => setOverlay(null)}
          onComplete={() => {
            setStep(4);
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
            "Verma was auditing research-data inconsistencies.",
            "One name appears often in his notes: Neha Rao.",
            "Experiment 17 records are kept in the Research Laboratory.",
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
