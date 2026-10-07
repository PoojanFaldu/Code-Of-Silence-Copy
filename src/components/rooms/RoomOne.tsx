import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Html, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import LaserDeflectionPuzzle from "@/components/rooms/roomOne/LaserDeflectionPuzzle";
import DrawerNote from "@/components/rooms/roomOne/DrawerNote";
import CipherPuzzle from "@/components/rooms/roomOne/CipherPuzzle";
import BlueFolderReveal from "@/components/rooms/roomOne/BlueFolderReveal";
import PuzzleHighlight from "@/components/rooms/PuzzleHighlight";

type Overlay = null | "laser" | "drawer" | "cipher" | "folder";

type Progress = {
  laserSolved: boolean;
  cipherSolved: boolean;
  folderOpened: boolean;
};

// Sit on the desk surface near pageOne (~y 2.20)
const DESK_DEVICE_POS: [number, number, number] = [1.28, 2.205, 0.62];
const DRAWER_POS: [number, number, number] = [1.42, 1.95, 0.85];
const FOLDER_POS: [number, number, number] = [0.98, 2.22, 1.05];

const LoadPaper = ({
  position = [1.55, 2.2, 0.95] as [number, number, number],
  rotation = [0, 1.5, 0] as [number, number, number],
  scale = 0.02,
}) => {
  const PaperRef = useRef<THREE.Object3D>(null);
  const { scene } = useGLTF("/model/pageOne.glb");
  if (!scene) return null;
  return <primitive ref={PaperRef} object={scene} position={position} rotation={rotation} scale={scale} />;
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
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#0284c7"
          emissiveIntensity={solved ? 0.55 : 0.3}
        />
      </mesh>
      <mesh position={[0.05, 0.055, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.1, 0.008, 0.07]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
      </mesh>
      <pointLight position={[0, 0.12, 0]} intensity={0.25} color="#38bdf8" distance={0.9} />
    </group>
  );
}

function ConcealedDrawer({ unlocked }: { unlocked: boolean }) {
  const openZ = unlocked ? 0.1 : 0;
  return (
    <group position={DRAWER_POS}>
      <mesh position={[0, 0, openZ]} castShadow>
        <boxGeometry args={[0.32, 0.07, 0.2]} />
        <meshStandardMaterial
          color={unlocked ? "#4a3728" : "#2a2118"}
          emissive={unlocked ? "#92400e" : "#000000"}
          emissiveIntensity={unlocked ? 0.2 : 0}
        />
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
        <meshStandardMaterial color="#1d4ed8" emissive="#1e3a8a" emissiveIntensity={0.25} />
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
      <Html center distanceFactor={5} position={[0, 0.08, 0]} style={{ pointerEvents: "none" }}>
        <div className="max-w-[150px] rounded bg-black/70 px-2 py-1 text-[10px] text-amber-100/90 border border-amber-500/30">
          The answer isn&apos;t where you are looking. It&apos;s where the light points.
        </div>
      </Html>
    </group>
  );
}

function CameraCoordinates({ position }: { position: number[] }) {
  return (
    <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-lg font-mono text-sm z-10">
      <div>Player Position:</div>
      <div>X: {position[0].toFixed(2)}</div>
      <div>Y: {position[1].toFixed(2)}</div>
      <div>Z: {position[2].toFixed(2)}</div>
    </div>
  );
}

const FirstPersonControls = ({
  onPositionUpdate,
  controlsEnabled,
}: {
  onPositionUpdate?: (pos: number[]) => void;
  controlsEnabled: boolean;
}) => {
  const { camera, gl } = useThree();
  const moveState = useRef({ forward: false, backward: false, left: false, right: false });
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const boundary = { minX: -1.65, maxX: 1.52, minZ: -1.58, maxZ: 1.97, y: 3.0 };
  const [isMouseLooking, setIsMouseLooking] = useState(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const moveSpeed = 0.028;
  const damping = 0.8;
  const mouseSensitivity = 0.002;
  const cameraPosRef = useRef(new THREE.Vector3(0, 3, 0));

  const clampPosition = useCallback((position: THREE.Vector3) => {
    const clampedPosition = position.clone();
    clampedPosition.x = THREE.MathUtils.clamp(clampedPosition.x, boundary.minX, boundary.maxX);
    clampedPosition.z = THREE.MathUtils.clamp(clampedPosition.z, boundary.minZ, boundary.maxZ);
    clampedPosition.y = boundary.y;
    return clampedPosition;
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!controlsEnabled) return;
      if (e.code === "KeyW" || e.code === "ArrowUp") moveState.current.forward = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") moveState.current.backward = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") moveState.current.left = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") moveState.current.right = true;
    },
    [controlsEnabled]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === "KeyW" || e.code === "ArrowUp") moveState.current.forward = false;
    if (e.code === "KeyS" || e.code === "ArrowDown") moveState.current.backward = false;
    if (e.code === "KeyA" || e.code === "ArrowLeft") moveState.current.left = false;
    if (e.code === "KeyD" || e.code === "ArrowRight") moveState.current.right = false;
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!controlsEnabled || e.button !== 0) return;
      setIsMouseLooking(true);
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
      gl.domElement.style.cursor = "none";
    },
    [gl, controlsEnabled]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (e.button === 0) {
        setIsMouseLooking(false);
        gl.domElement.style.cursor = "default";
      }
    },
    [gl]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isMouseLooking || !controlsEnabled) return;
      camera.rotation.y -= (e.clientX - previousMousePosition.current.x) * mouseSensitivity;
      camera.rotation.x = 0;
      camera.rotation.z = 0;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    },
    [camera, isMouseLooking, controlsEnabled]
  );

  const handleMouseLeave = useCallback(() => {
    setIsMouseLooking(false);
    gl.domElement.style.cursor = "default";
  }, [gl]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    gl.domElement.addEventListener("mousedown", handleMouseDown);
    gl.domElement.addEventListener("mouseup", handleMouseUp);
    gl.domElement.addEventListener("mousemove", handleMouseMove);
    gl.domElement.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      gl.domElement.removeEventListener("mousedown", handleMouseDown);
      gl.domElement.removeEventListener("mouseup", handleMouseUp);
      gl.domElement.removeEventListener("mousemove", handleMouseMove);
      gl.domElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseDown, handleMouseUp, handleMouseMove, handleMouseLeave, gl]);

  useEffect(() => {
    if (!controlsEnabled) {
      moveState.current = { forward: false, backward: false, left: false, right: false };
      setIsMouseLooking(false);
      gl.domElement.style.cursor = "default";
    }
  }, [controlsEnabled, gl]);

  useFrame(() => {
    if (!controlsEnabled) return;
    velocity.current.set(0, 0, 0);
    direction.current.set(0, 0, 0);
    if (moveState.current.forward) direction.current.z -= 0.5;
    if (moveState.current.backward) direction.current.z += 0.5;
    if (moveState.current.left) direction.current.x -= 0.5;
    if (moveState.current.right) direction.current.x += 0.5;
    if (direction.current.length() > 0) direction.current.normalize();
    direction.current.applyEuler(new THREE.Euler(0, camera.rotation.y, 0, "XYZ"));
    velocity.current.addScaledVector(direction.current, moveSpeed);
    velocity.current.multiplyScalar(damping);
    const clampedPosition = clampPosition(cameraPosRef.current.clone().add(velocity.current));
    cameraPosRef.current.copy(clampedPosition);
    camera.position.copy(clampedPosition);
    onPositionUpdate?.([clampedPosition.x, clampedPosition.y, clampedPosition.z]);
  });

  return null;
};

const RoomOne = () => {
  const [cameraPosition, setCameraPosition] = useState([0, 3, 0]);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [progress, setProgress] = useState<Progress>({
    laserSolved: false,
    cipherSolved: false,
    folderOpened: false,
  });

  const statusText = progress.folderOpened
    ? "Neha looks suspicious. Next: Research Lab — Experiment 17 data is stored there."
    : progress.cipherSolved
      ? "Decoded. Open the blue folder on the desk."
      : progress.laserSolved
        ? "Drawer unlocked. Read Verma's encrypted note."
        : "Inspect the optical device on Verma's desk.";

  return (
    <div className="h-screen w-screen bg-black relative">
      <CameraCoordinates position={cameraPosition} />

      <div className="absolute top-4 right-4 z-20 max-w-sm rounded-lg border border-cyan-400/40 bg-black/85 px-4 py-3 text-sm text-slate-200">
        <p className="text-[11px] uppercase tracking-wider text-cyan-300 mb-1">Room 1 · Dr. Verma&apos;s Office</p>
        <p className="mb-3">{statusText}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setOverlay("laser")}
            className="rounded-md border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 text-left text-sm text-cyan-100 hover:bg-cyan-500/25"
          >
            Optical device
          </button>
          {progress.laserSolved && (
            <button
              onClick={() => setOverlay("drawer")}
              className="rounded-md border border-amber-400/50 bg-amber-500/15 px-3 py-2 text-left text-sm text-amber-100 hover:bg-amber-500/25"
            >
              Concealed drawer
            </button>
          )}
          {progress.cipherSolved && (
            <button
              onClick={() => setOverlay("folder")}
              className="rounded-md border border-blue-400/50 bg-blue-500/15 px-3 py-2 text-left text-sm text-blue-100 hover:bg-blue-500/25"
            >
              Blue folder
            </button>
          )}
        </div>
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
          <LoadPaper />
          <DeskNote visible={!progress.laserSolved} />
          <LaserDevice solved={progress.laserSolved} />
          <ConcealedDrawer unlocked={progress.laserSolved} />
          <BlueFolderProp visible={progress.cipherSolved} />

          <PuzzleHighlight
            position={[DESK_DEVICE_POS[0], DESK_DEVICE_POS[1], DESK_DEVICE_POS[2]]}
            label="Optical device"
            color="#22d3ee"
            visible={overlay === null}
            onClick={() => setOverlay("laser")}
          />
          <PuzzleHighlight
            position={[DRAWER_POS[0], DRAWER_POS[1] + 0.08, DRAWER_POS[2]]}
            label="Concealed drawer"
            color="#f59e0b"
            visible={overlay === null && progress.laserSolved}
            onClick={() => setOverlay("drawer")}
          />
          <PuzzleHighlight
            position={[FOLDER_POS[0], FOLDER_POS[1], FOLDER_POS[2]]}
            label="Blue folder"
            color="#3b82f6"
            visible={overlay === null && progress.cipherSolved}
            onClick={() => setOverlay("folder")}
          />

          <FirstPersonControls onPositionUpdate={setCameraPosition} controlsEnabled={overlay === null} />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 px-6 py-3 rounded-lg border border-white/20">
        <p className="text-white text-sm font-mono">WASD move · Click-drag look · Inspect highlighted objects</p>
      </div>

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
            if (typeof window !== "undefined") {
              sessionStorage.setItem("room1_neha_suspect", "true");
              sessionStorage.setItem("room1_to_lab", "true");
            }
          }}
        />
      )}
    </div>
  );
};

export default RoomOne;
