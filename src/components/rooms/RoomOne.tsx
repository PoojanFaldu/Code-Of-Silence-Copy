import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Html, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import LaserDeflectionPuzzle from "@/components/rooms/roomOne/LaserDeflectionPuzzle";
import DrawerNote from "@/components/rooms/roomOne/DrawerNote";
import CipherPuzzle from "@/components/rooms/roomOne/CipherPuzzle";
import BlueFolderReveal from "@/components/rooms/roomOne/BlueFolderReveal";
import PuzzleHighlight from "@/components/rooms/PuzzleHighlight";

type Overlay =
  | null
  | "laser"
  | "drawer"
  | "cipher"
  | "folder";

type Progress = {
  laserSolved: boolean;
  cipherSolved: boolean;
  folderOpened: boolean;
};

const DESK_DEVICE_POS: [number, number, number] = [1.15, 2.18, 0.55];
const DRAWER_POS: [number, number, number] = [1.35, 1.85, 0.85];
const FOLDER_POS: [number, number, number] = [-0.95, 2.35, -0.35];

const LoadPaper = ({ position = [1.55, 2.2, 0.95] as [number, number, number], rotation = [0, 1.5, 0] as [number, number, number], scale = 0.02 }) => {
  const PaperRef = useRef<THREE.Object3D>(null);
  const { scene } = useGLTF("/model/pageOne.glb");

  if (!scene) return null;

  return <primitive ref={PaperRef} object={scene} position={position} rotation={rotation} scale={scale} />;
};

const LoadModel = ({ position = [0, 2, 0] as [number, number, number], rotation = [0, 0, 0] as [number, number, number] }) => {
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
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current || solved) return;
    group.current.position.y = DESK_DEVICE_POS[1] + Math.sin(clock.elapsedTime * 2) * 0.015;
  });

  return (
    <group ref={group} position={DESK_DEVICE_POS}>
      <mesh castShadow position={[0, 0.02, 0]}>
        <boxGeometry args={[0.28, 0.04, 0.2]} />
        <meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[-0.08, 0.08, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.1, 12]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={solved ? 1.4 : 1.2} />
      </mesh>
      <mesh position={[0.06, 0.07, 0]} rotation={[0, 0, Math.PI / 5]}>
        <boxGeometry args={[0.12, 0.01, 0.08]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      <pointLight position={[-0.08, 0.1, 0]} intensity={1.4} color="#38bdf8" distance={2.5} />
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
        <div className="max-w-[140px] rounded bg-black/70 px-2 py-1 text-[10px] text-amber-100/90 border border-amber-500/30">
          "It's where the light points."
        </div>
      </Html>
    </group>
  );
}

function ConcealedDrawer({ unlocked }: { unlocked: boolean }) {
  const openZ = unlocked ? 0.12 : 0;
  return (
    <group position={DRAWER_POS}>
      <mesh position={[0, 0, openZ]} castShadow>
        <boxGeometry args={[0.35, 0.08, 0.22]} />
        <meshStandardMaterial
          color={unlocked ? "#4a3728" : "#2a2118"}
          emissive={unlocked ? "#f59e0b" : "#000000"}
          emissiveIntensity={unlocked ? 0.35 : 0}
        />
      </mesh>
      <mesh position={[0, 0, openZ + 0.12]}>
        <boxGeometry args={[0.06, 0.015, 0.02]} />
        <meshStandardMaterial color="#c4a574" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function BlueFolderProp({ visible, opened }: { visible: boolean; opened: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current || !visible || opened) return;
    ref.current.position.y = FOLDER_POS[1] + Math.sin(clock.elapsedTime * 2.4) * 0.02;
  });

  if (!visible) return null;

  return (
    <group ref={ref} position={FOLDER_POS} rotation={[0, 0.6, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.22, 0.02, 0.28]} />
        <meshStandardMaterial color="#1d4ed8" emissive="#3b82f6" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.012, -0.02]}>
        <boxGeometry args={[0.2, 0.004, 0.24]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <pointLight position={[0, 0.1, 0]} intensity={1.2} color="#60a5fa" distance={2.5} />
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
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  const boundary = {
    minX: -1.65,
    maxX: 1.52,
    minZ: -1.58,
    maxZ: 1.97,
    y: 3.0,
  };

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
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          moveState.current.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          moveState.current.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          moveState.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          moveState.current.right = true;
          break;
      }
    },
    [controlsEnabled]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case "KeyW":
      case "ArrowUp":
        moveState.current.forward = false;
        break;
      case "KeyS":
      case "ArrowDown":
        moveState.current.backward = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        moveState.current.left = false;
        break;
      case "KeyD":
      case "ArrowRight":
        moveState.current.right = false;
        break;
    }
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!controlsEnabled) return;
      if (e.button === 0) {
        setIsMouseLooking(true);
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
        gl.domElement.style.cursor = "none";
      }
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

      const deltaX = e.clientX - previousMousePosition.current.x;
      camera.rotation.y -= deltaX * mouseSensitivity;
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

    if (direction.current.length() > 0) {
      direction.current.normalize();
    }

    const cameraEuler = new THREE.Euler(0, camera.rotation.y, 0, "XYZ");
    direction.current.applyEuler(cameraEuler);

    velocity.current.addScaledVector(direction.current, moveSpeed);
    velocity.current.multiplyScalar(damping);

    const tempPosition = cameraPosRef.current.clone().add(velocity.current);
    const clampedPosition = clampPosition(tempPosition);

    cameraPosRef.current.copy(clampedPosition);
    camera.position.copy(clampedPosition);

    const newPosition = [clampedPosition.x, clampedPosition.y, clampedPosition.z];
    if (onPositionUpdate) {
      onPositionUpdate(newPosition);
    }
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

  const handleCameraPositionUpdate = useCallback((newPosition: number[]) => {
    setCameraPosition(newPosition);
  }, []);

  const statusText = progress.folderOpened
    ? "Clue logged: Neha Rao appears repeatedly in Verma's investigation notes."
    : progress.cipherSolved
      ? "Decode complete — locate the blue folder in the office."
      : progress.laserSolved
        ? "Drawer unlocked. Retrieve the encrypted note."
        : "Inspect the optical device on Dr. Verma's desk.";

  return (
    <div className="h-screen w-screen bg-black relative">
      <CameraCoordinates position={cameraPosition} />

      <div className="absolute top-4 right-4 z-20 max-w-sm rounded-lg border-2 border-cyan-400/60 bg-black/85 px-4 py-3 text-sm text-slate-200 shadow-[0_0_30px_rgba(34,211,238,0.35)]">
        <p className="text-[11px] uppercase tracking-wider text-cyan-300 mb-1">Room 1 · Puzzle Finder</p>
        <p className="mb-3">{statusText}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setOverlay("laser")}
            className="rounded-md border border-cyan-400 bg-cyan-500/20 px-3 py-2 text-left text-sm font-semibold text-cyan-100 hover:bg-cyan-500/35"
          >
            ★ Open Laser Puzzle
          </button>
          {progress.laserSolved && (
            <button
              onClick={() => setOverlay("drawer")}
              className="rounded-md border border-amber-400 bg-amber-500/20 px-3 py-2 text-left text-sm font-semibold text-amber-100 hover:bg-amber-500/35"
            >
              ★ Open Drawer / Cipher
            </button>
          )}
          {progress.cipherSolved && (
            <button
              onClick={() => setOverlay("folder")}
              className="rounded-md border border-blue-400 bg-blue-500/20 px-3 py-2 text-left text-sm font-semibold text-blue-100 hover:bg-blue-500/35"
            >
              ★ Open Blue Folder
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
          <LoadModel position={[0, 2, 0]} rotation={[0, 0, 0]} />
          <LoadPaper />
          <DeskNote visible={!progress.laserSolved} />
          <LaserDevice solved={progress.laserSolved} />
          <ConcealedDrawer unlocked={progress.laserSolved} />
          <BlueFolderProp visible={progress.cipherSolved} opened={progress.folderOpened} />

          <PuzzleHighlight
            position={[DESK_DEVICE_POS[0], 2.4, DESK_DEVICE_POS[2]]}
            label={progress.laserSolved ? "Laser Device (done)" : "PUZZLE: Laser Device"}
            color="#22d3ee"
            visible={overlay === null}
            onClick={() => setOverlay("laser")}
          />
          <PuzzleHighlight
            position={[DRAWER_POS[0], 2.2, DRAWER_POS[2]]}
            label="PUZZLE: Concealed Drawer"
            color="#f59e0b"
            visible={overlay === null && progress.laserSolved}
            onClick={() => setOverlay("drawer")}
          />
          <PuzzleHighlight
            position={[FOLDER_POS[0], 2.5, FOLDER_POS[2]]}
            label="PUZZLE: Blue Folder"
            color="#3b82f6"
            visible={overlay === null && progress.cipherSolved}
            onClick={() => setOverlay("folder")}
          />

          <FirstPersonControls
            onPositionUpdate={handleCameraPositionUpdate}
            controlsEnabled={overlay === null}
          />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 px-6 py-3 rounded-lg border border-cyan-400/40">
        <p className="text-cyan-100 text-sm font-mono">
          Look for glowing beacons · Or use the ★ buttons (top-right)
        </p>
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
            setOverlay(null);
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
              sessionStorage.setItem("room1_neha_clue", "true");
            }
          }}
        />
      )}
    </div>
  );
};

export default RoomOne;
