import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import LogicGatesPuzzle from "@/components/rooms/roomTwo/LogicGatesPuzzle";
import ResearchReport from "@/components/rooms/roomTwo/ResearchReport";
import NetworkPortPuzzle from "@/components/rooms/roomTwo/NetworkPortPuzzle";
import ArchiveReveal from "@/components/rooms/roomTwo/ArchiveReveal";
import PuzzleHighlight from "@/components/rooms/PuzzleHighlight";

type Overlay = null | "logic" | "report" | "network" | "archive";

type Progress = {
  logicSolved: boolean;
  reportSeen: boolean;
  networkSolved: boolean;
  archiveLogged: boolean;
};

const LOGIC_POS: [number, number, number] = [-1.32, 2.62, 4.25];
const MONITOR_POS: [number, number, number] = [0.55, 2.85, 5.35];

const LoadPaper = ({
  position = [-1.59, 2.56, 4] as [number, number, number],
  rotation = [0, 1.5, 0] as [number, number, number],
  scale = 0.06,
}) => {
  const paperRef = useRef<THREE.Object3D>(null);
  const { scene } = useGLTF("/model/pageTwo.glb");
  if (!scene) return null;
  return <primitive ref={paperRef} object={scene} position={position} rotation={rotation} scale={scale} />;
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
    <group position={LOGIC_POS} rotation={[0, 0.35, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.48, 0.28, 0.1]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.02, 0.055]}>
        <boxGeometry args={[0.38, 0.18, 0.01]} />
        <meshStandardMaterial
          color={solved ? "#14532d" : "#0f172a"}
          emissive={solved ? "#22c55e" : "#166534"}
          emissiveIntensity={solved ? 0.4 : 0.22}
        />
      </mesh>
      <pointLight position={[0, 0.08, 0.15]} intensity={0.22} color="#4ade80" distance={0.9} />
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
          emissive={restored ? "#0284c7" : unlocked ? "#1d4ed8" : "#1e293b"}
          emissiveIntensity={restored ? 0.4 : unlocked ? 0.3 : 0.08}
        />
      </mesh>
      <pointLight
        position={[0, 0.05, 0.2]}
        intensity={unlocked ? 0.28 : 0.08}
        color={restored ? "#38bdf8" : "#60a5fa"}
        distance={1.1}
      />
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
  const [isMouseLooking, setIsMouseLooking] = useState(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const velocity = useRef(new THREE.Vector3());
  const moveSpeed = 0.025;
  const mouseSensitivity = 0.002;
  const boundary = useRef({ minX: -1.875, maxX: 1.8, minZ: 2.225, maxZ: 8.05, y: 4 });

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

  const handleMouseUp = useCallback(() => {
    setIsMouseLooking(false);
    gl.domElement.style.cursor = "default";
  }, [gl]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isMouseLooking || !controlsEnabled) return;
      camera.rotation.y -= (e.clientX - previousMousePosition.current.x) * mouseSensitivity;
      camera.rotation.x = 0;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    },
    [camera, isMouseLooking, controlsEnabled]
  );

  const clampPosition = useCallback((position: THREE.Vector3) => {
    position.x = THREE.MathUtils.clamp(position.x, boundary.current.minX, boundary.current.maxX);
    position.z = THREE.MathUtils.clamp(position.z, boundary.current.minZ, boundary.current.maxZ);
    position.y = boundary.current.y;
    return position;
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    gl.domElement.addEventListener("mousedown", handleMouseDown);
    gl.domElement.addEventListener("mouseup", handleMouseUp);
    gl.domElement.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      gl.domElement.removeEventListener("mousedown", handleMouseDown);
      gl.domElement.removeEventListener("mouseup", handleMouseUp);
      gl.domElement.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseDown, handleMouseUp, handleMouseMove, gl]);

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
    const direction = new THREE.Vector3();
    if (moveState.current.forward) direction.z -= 1;
    if (moveState.current.backward) direction.z += 1;
    if (moveState.current.left) direction.x -= 1;
    if (moveState.current.right) direction.x += 1;
    if (direction.length() > 0) direction.normalize();
    direction.applyEuler(new THREE.Euler(0, camera.rotation.y, 0));
    velocity.current.addScaledVector(direction, moveSpeed);
    const clamped = clampPosition(camera.position.clone().add(velocity.current));
    camera.position.copy(clamped);
    onPositionUpdate?.([clamped.x, clamped.y, clamped.z]);
  });

  return null;
};

const RoomTwo = () => {
  const [cameraPosition, setCameraPosition] = useState([0, 4, 8]);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [progress, setProgress] = useState<Progress>({
    logicSolved: false,
    reportSeen: false,
    networkSolved: false,
    archiveLogged: false,
  });

  const statusText = progress.archiveLogged
    ? "Neha looks guilty — but the missing original modification record still doesn't add up."
    : progress.networkSolved
      ? "Archive open — review the access log."
      : progress.reportSeen
        ? "Neha's section was altered. Connect to the secure archive (HTTPS)."
        : progress.logicSolved
          ? "Terminal unlocked — read the Experiment 17 report."
          : "Blue folder led here. Restore the logic gate control panel.";

  return (
    <div className="h-screen w-screen bg-black relative">
      <CameraCoordinates position={cameraPosition} />

      <div className="absolute top-4 right-4 z-20 max-w-sm rounded-lg border border-emerald-400/40 bg-black/85 px-4 py-3 text-sm text-slate-200">
        <p className="text-[11px] uppercase tracking-wider text-emerald-300 mb-1">Room 2 · Research Lab</p>
        <p className="mb-3">{statusText}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setOverlay(progress.logicSolved && !progress.reportSeen ? "report" : "logic")}
            className="rounded-md border border-emerald-400/50 bg-emerald-500/15 px-3 py-2 text-left text-sm text-emerald-100 hover:bg-emerald-500/25"
          >
            Logic gate panel
          </button>
          {progress.reportSeen && (
            <button
              onClick={() => setOverlay(progress.networkSolved ? "archive" : "network")}
              className="rounded-md border border-sky-400/50 bg-sky-500/15 px-3 py-2 text-left text-sm text-sky-100 hover:bg-sky-500/25"
            >
              Secure archive terminal
            </button>
          )}
        </div>
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
          <LoadPaper />
          <LogicTerminal solved={progress.logicSolved} />
          <ArchiveWorkstation unlocked={progress.reportSeen} restored={progress.networkSolved} />

          <PuzzleHighlight
            position={[LOGIC_POS[0], LOGIC_POS[1], LOGIC_POS[2]]}
            label="Logic panel"
            color="#34d399"
            visible={overlay === null}
            onClick={() => setOverlay(progress.logicSolved && !progress.reportSeen ? "report" : "logic")}
          />
          <PuzzleHighlight
            position={[MONITOR_POS[0], MONITOR_POS[1], MONITOR_POS[2]]}
            label={progress.networkSolved ? "Archive log" : "Secure archive"}
            color="#38bdf8"
            visible={overlay === null && progress.reportSeen}
            onClick={() => setOverlay(progress.networkSolved ? "archive" : "network")}
          />

          <FirstPersonControls onPositionUpdate={setCameraPosition} controlsEnabled={overlay === null} />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 px-6 py-3 rounded-lg border border-white/20">
        <p className="text-white text-sm font-mono">WASD move · Click-drag look · Inspect highlighted objects</p>
      </div>

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
            if (typeof window !== "undefined") {
              sessionStorage.setItem("room2_neha_suspect", "true");
              sessionStorage.setItem("room2_exp17_archive", "true");
              sessionStorage.setItem("room2_history_missing", "true");
            }
          }}
        />
      )}
    </div>
  );
};

export default RoomTwo;
