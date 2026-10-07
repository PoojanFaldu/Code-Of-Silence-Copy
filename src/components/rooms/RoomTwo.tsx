import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Html, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import LogicGatesPuzzle from "@/components/rooms/roomTwo/LogicGatesPuzzle";
import ResearchReport from "@/components/rooms/roomTwo/ResearchReport";
import CablePatchingPuzzle from "@/components/rooms/roomTwo/CablePatchingPuzzle";
import CctvReveal from "@/components/rooms/roomTwo/CctvReveal";
import PuzzleHighlight from "@/components/rooms/PuzzleHighlight";

type Overlay = null | "logic" | "report" | "cables" | "cctv";

type Progress = {
  logicSolved: boolean;
  reportSeen: boolean;
  cablesSolved: boolean;
  cctvLogged: boolean;
};

const PANEL_POS: [number, number, number] = [-1.25, 3.35, 4.35];
const MONITOR_POS: [number, number, number] = [0.85, 3.55, 5.9];

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

function ControlPanel({ solved }: { solved: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current || solved) return;
    ref.current.position.y = PANEL_POS[1] + Math.sin(clock.elapsedTime * 2.2) * 0.012;
  });

  return (
    <group ref={ref} position={PANEL_POS} rotation={[0, 0.35, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.55, 0.32, 0.12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.02, 0.065]}>
        <boxGeometry args={[0.42, 0.2, 0.01]} />
        <meshStandardMaterial
          color={solved ? "#14532d" : "#052e16"}
          emissive={solved ? "#22c55e" : "#4ade80"}
          emissiveIntensity={solved ? 1.2 : 1.0}
        />
      </mesh>
      {[-0.14, 0, 0.14].map((x, i) => (
        <mesh key={i} position={[x, -0.1, 0.07]}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshStandardMaterial
            color={solved ? "#4ade80" : i === 2 ? "#f87171" : "#64748b"}
            emissive={solved ? "#22c55e" : i === 2 ? "#ef4444" : "#334155"}
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}
      <pointLight position={[0, 0.05, 0.2]} intensity={1.4} color="#4ade80" distance={3} />
    </group>
  );
}

function LabMonitor({
  unlocked,
  restored,
}: {
  unlocked: boolean;
  restored: boolean;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current || restored || !unlocked) return;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 6) * 0.01;
  });

  return (
    <group ref={ref} position={MONITOR_POS} rotation={[0, -0.55, 0]}>
      <mesh position={[0, -0.35, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.35, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.45} />
      </mesh>
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.45, 0.08]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <boxGeometry args={[0.58, 0.34, 0.01]} />
        <meshStandardMaterial
          color={restored ? "#0c4a6e" : unlocked ? "#450a0a" : "#111827"}
          emissive={restored ? "#38bdf8" : unlocked ? "#ef4444" : "#334155"}
          emissiveIntensity={restored ? 1.2 : unlocked ? 1.1 : 0.3}
        />
      </mesh>
      <pointLight
        position={[0, 0, 0.25]}
        intensity={unlocked ? 1.6 : 0.4}
        color={restored ? "#38bdf8" : "#f87171"}
        distance={3}
      />
      {unlocked && !restored && (
        <Html center distanceFactor={6} position={[0, -0.05, 0.06]} style={{ pointerEvents: "none" }}>
          <div className="rounded bg-black/80 px-2 py-1 font-mono text-[11px] text-rose-300 border border-rose-500/50">
            SIGNAL LOST
          </div>
        </Html>
      )}
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

  const boundary = useRef({
    minX: -1.875,
    maxX: 1.8,
    minZ: 2.225,
    maxZ: 8.05,
    y: 4,
  });

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
      if (!controlsEnabled) return;
      if (e.button === 0) {
        setIsMouseLooking(true);
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
        gl.domElement.style.cursor = "none";
      }
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
      const deltaX = e.clientX - previousMousePosition.current.x;
      camera.rotation.y -= deltaX * mouseSensitivity;
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

    const cameraEuler = new THREE.Euler(0, camera.rotation.y, 0);
    direction.applyEuler(cameraEuler);
    velocity.current.addScaledVector(direction, moveSpeed);

    const newPosition = camera.position.clone().add(velocity.current);
    const clampedPosition = clampPosition(newPosition);
    camera.position.copy(clampedPosition);

    onPositionUpdate?.([clampedPosition.x, clampedPosition.y, clampedPosition.z]);
  });

  return null;
};

const RoomTwo = () => {
  const [cameraPosition, setCameraPosition] = useState([0, 4, 8]);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [progress, setProgress] = useState<Progress>({
    logicSolved: false,
    reportSeen: false,
    cablesSolved: false,
    cctvLogged: false,
  });

  const statusText = progress.cctvLogged
    ? "Clues logged: Neha's bag on CCTV + a small rectangular object."
    : progress.cablesSolved
      ? "CCTV restored — review the damaged recording."
      : progress.reportSeen
        ? "Research altered by Neha. Fix the lab monitor (SIGNAL LOST)."
        : progress.logicSolved
          ? "Terminal unlocked — read the research report."
          : "Blue folder pointed here. Inspect the workstation control panel.";

  return (
    <div className="h-screen w-screen bg-black relative">
      <CameraCoordinates position={cameraPosition} />

      <div className="absolute top-4 right-4 z-20 max-w-sm rounded-lg border-2 border-emerald-400/60 bg-black/85 px-4 py-3 text-sm text-slate-200 shadow-[0_0_30px_rgba(74,222,128,0.35)]">
        <p className="text-[11px] uppercase tracking-wider text-emerald-300 mb-1">Room 2 · Puzzle Finder</p>
        <p className="mb-3">{statusText}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setOverlay(progress.logicSolved && !progress.reportSeen ? "report" : "logic")}
            className="rounded-md border border-emerald-400 bg-emerald-500/20 px-3 py-2 text-left text-sm font-semibold text-emerald-100 hover:bg-emerald-500/35"
          >
            ★ Open Logic Gate Panel
          </button>
          {progress.reportSeen && (
            <button
              onClick={() => setOverlay(progress.cablesSolved ? "cctv" : "cables")}
              className="rounded-md border border-sky-400 bg-sky-500/20 px-3 py-2 text-left text-sm font-semibold text-sky-100 hover:bg-sky-500/35"
            >
              ★ Open Monitor / CCTV
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
          <ControlPanel solved={progress.logicSolved} />
          <LabMonitor unlocked={progress.reportSeen} restored={progress.cablesSolved} />

          <PuzzleHighlight
            position={[PANEL_POS[0], 3.6, PANEL_POS[2]]}
            label={progress.logicSolved ? "Control Panel (done)" : "PUZZLE: Logic Gates"}
            color="#4ade80"
            visible={overlay === null}
            onClick={() => setOverlay(progress.logicSolved && !progress.reportSeen ? "report" : "logic")}
          />
          <PuzzleHighlight
            position={[MONITOR_POS[0], 3.8, MONITOR_POS[2]]}
            label={progress.cablesSolved ? "Monitor / CCTV" : "PUZZLE: Cable Patching"}
            color="#38bdf8"
            visible={overlay === null && progress.reportSeen}
            onClick={() => setOverlay(progress.cablesSolved ? "cctv" : "cables")}
          />

          <FirstPersonControls
            onPositionUpdate={setCameraPosition}
            controlsEnabled={overlay === null}
          />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 px-6 py-3 rounded-lg border border-emerald-400/40">
        <p className="text-emerald-100 text-sm font-mono">
          Look for glowing beacons · Or use the ★ buttons (top-right)
        </p>
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
            setOverlay(null);
          }}
        />
      )}

      {overlay === "cables" && (
        <CablePatchingPuzzle
          onClose={() => setOverlay(null)}
          onSolved={() => {
            setProgress((p) => ({ ...p, cablesSolved: true }));
            setOverlay("cctv");
          }}
        />
      )}

      {overlay === "cctv" && (
        <CctvReveal
          onClose={() => setOverlay(null)}
          onComplete={() => {
            setProgress((p) => ({ ...p, cctvLogged: true }));
            setOverlay(null);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("room2_neha_motive", "true");
              sessionStorage.setItem("room2_cctv_bag", "true");
              sessionStorage.setItem("room2_rect_object", "true");
            }
          }}
        />
      )}
    </div>
  );
};

export default RoomTwo;
