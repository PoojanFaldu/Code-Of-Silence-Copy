import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Html, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useGame } from "@/contexts/GameContext";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, Fingerprint, Layers, FolderLock, 
  CheckCircle2, ArrowRight, Server, Eye, Sparkles, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoomThree3DObjects } from "./room3/RoomThree3DObjects";
import { VermaNotebookModal } from "./room3/VermaNotebookModal";
import { HashFingerprintPuzzle } from "./room3/HashFingerprintPuzzle";
import { OverlayMaskPuzzle } from "./room3/OverlayMaskPuzzle";
import { CaseDossierModal } from "./room3/CaseDossierModal";
import { playKeyClick, playPaperSlide } from "./room3/audio";
import { toast } from "sonner";

// Camera Debug Component
const CameraDebugOverlay = () => {
  const { camera } = useThree();
  const [cameraInfo, setCameraInfo] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  });

  useFrame(() => {
    setCameraInfo({
      position: {
        x: parseFloat(camera.position.x.toFixed(3)),
        y: parseFloat(camera.position.y.toFixed(3)),
        z: parseFloat(camera.position.z.toFixed(3))
      },
      rotation: {
        x: parseFloat(camera.rotation.x.toFixed(3)),
        y: parseFloat(camera.rotation.y.toFixed(3)),
        z: parseFloat(camera.rotation.z.toFixed(3))
      }
    });
  });

  return null;
};


const LoadModel = () => {
  const { scene } = useGLTF("/model/RoomThreeModel.glb");

  useEffect(() => {
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene]);

  return <primitive object={scene} position={[0, 2.3, 5]} scale={0.5} />;
};

const FirstPersonControls = () => {
  const { camera, gl } = useThree();
  const moveState = useRef({ forward: false, backward: false, left: false, right: false });
  const [isMouseLooking, setIsMouseLooking] = useState(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  const velocity = useRef(new THREE.Vector3());
  const moveSpeed = 0.005;
  const mouseSensitivity = 0.002;

  // Boundary constraints for RoomThree
  const boundary = useRef({
    minX: -1.357,
    maxX: 1.123,
    minZ: 3.772,
    maxZ: 7.491,
    y: 3
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') moveState.current.forward = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') moveState.current.backward = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveState.current.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') moveState.current.right = true;
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') moveState.current.forward = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') moveState.current.backward = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveState.current.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') moveState.current.right = false;
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 0) {
      setIsMouseLooking(true);
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
      gl.domElement.style.cursor = 'none';
    }
  }, [gl]);

  const handleMouseUp = useCallback(() => {
    setIsMouseLooking(false);
    gl.domElement.style.cursor = 'default';
  }, [gl]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMouseLooking) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    camera.rotation.y -= deltaX * mouseSensitivity;
    camera.rotation.x = 0;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  }, [camera, isMouseLooking]);

  const clampPosition = useCallback((position: THREE.Vector3) => {
    position.x = THREE.MathUtils.clamp(position.x, boundary.current.minX, boundary.current.maxX);
    position.z = THREE.MathUtils.clamp(position.z, boundary.current.minZ, boundary.current.maxZ);
    position.y = boundary.current.y;
    return position;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    gl.domElement.addEventListener('mousedown', handleMouseDown);
    gl.domElement.addEventListener('mouseup', handleMouseUp);
    gl.domElement.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      gl.domElement.removeEventListener('mousedown', handleMouseDown);
      gl.domElement.removeEventListener('mouseup', handleMouseUp);
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseDown, handleMouseUp, handleMouseMove, gl]);

  useFrame(() => {
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
  });

  return null;
};

const RoomThree = () => {
  const navigate = useNavigate();

  // Modals state
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isHashPuzzleOpen, setIsHashPuzzleOpen] = useState(false);
  const [isOverlayPuzzleOpen, setIsOverlayPuzzleOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Puzzle solved state
  const [isHashSolved, setIsHashSolved] = useState(() => {
    return sessionStorage.getItem("room3_puzzle5_solved") === "true";
  });
  const [isOverlaySolved, setIsOverlaySolved] = useState(() => {
    return sessionStorage.getItem("room3_puzzle6_solved") === "true";
  });

  const handleHashSolved = () => {
    setIsHashSolved(true);
  };

  const handleOverlaySolved = () => {
    setIsOverlaySolved(true);
  };

  const handleProceedToServerRoom = () => {
    playKeyClick();
    toast.success("Proceeding to Server Room (Final Room)...");
    navigate("/game?room=server");
  };

  const isAnyModalOpen = isNotebookOpen || isHashPuzzleOpen || isOverlayPuzzleOpen || isDossierOpen;

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden select-none">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 3, 5], fov: 75 }}>
        <PerspectiveCamera makeDefault position={[0, 3, 5]} fov={75} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-5, 4, 3]} intensity={0.6} />
        <pointLight position={[0, 4.5, 4.5]} intensity={1.5} color="#38bdf8" />
        <pointLight position={[-0.8, 3.2, 4.2]} intensity={1.0} color="#f59e0b" />
        <pointLight position={[0.7, 3.2, 4.2]} intensity={1.2} color="#06b6d4" />

        <Suspense fallback={null}>
          <LoadModel />
          <RoomThree3DObjects 
            onOpenNotebook={() => {
              playPaperSlide();
              setIsNotebookOpen(true);
            }}
            onOpenHashPuzzle={() => {
              playKeyClick();
              setIsHashPuzzleOpen(true);
            }}
            onOpenOverlayPuzzle={() => {
              playPaperSlide();
              setIsOverlayPuzzleOpen(true);
            }}
            isHashSolved={isHashSolved}
            isOverlaySolved={isOverlaySolved}
            hideHtmlTags={isAnyModalOpen}
          />
          <FirstPersonControls />
        </Suspense>
      </Canvas>

      {/* Top Header Banner */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
        <div className="bg-black/85 backdrop-blur-md px-5 py-2.5 rounded-full border border-cyan-500/30 flex items-center gap-3 shadow-2xl">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-widest uppercase">
            Room 3 — The Archives
          </span>
          <span className="text-white/40 text-xs">|</span>
          <span className="font-mono text-xs text-cyan-300">
            {isHashSolved && isOverlaySolved 
              ? "All Room 3 Clues Deciphered" 
              : isHashSolved 
              ? "Motive Established • Next: Overlay Mask" 
              : "Verma's Note Reference • Hashes & Overlays"}
          </span>
        </div>
      </div>

      {/* Controls HUD Helper (Bottom Left) */}
      <div className="absolute bottom-24 left-6 hidden md:block z-30 pointer-events-none">
        <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-slate-300 text-xs font-mono">
          <span>WASD / Arrow Keys: Move</span> • <span>Click & Drag: Look Around</span>
        </div>
      </div>

      {/* Detective Investigation Dock (Bottom Center) */}
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-4xl px-4 pointer-events-auto">
        <div className="bg-gradient-to-r from-slate-950/95 via-[#06101e]/95 to-slate-950/95 backdrop-blur-xl p-3 rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/60 flex flex-wrap items-center justify-between gap-3">
          {/* Quick Access Investigation Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Verma's Notebook */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                playPaperSlide();
                setIsNotebookOpen(true);
              }}
              className="bg-black/60 hover:bg-amber-950/40 text-amber-200 border-amber-600/40 font-mono text-xs font-bold"
            >
              <BookOpen className="w-4 h-4 mr-1.5 text-amber-400" />
              Verma's Notebook
            </Button>

            {/* 2. Puzzle 5: Hash Verification */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                playKeyClick();
                setIsHashPuzzleOpen(true);
              }}
              className={`font-mono text-xs font-bold transition-all ${
                isHashSolved 
                  ? "bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 border-emerald-500/50" 
                  : "bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200 border-cyan-500/50"
              }`}
            >
              <Fingerprint className="w-4 h-4 mr-1.5 text-cyan-400" />
              Puzzle 5: Hashes
              {isHashSolved ? (
                <span className="ml-1.5 text-[10px] bg-emerald-900/80 px-1.5 py-0.2 rounded text-emerald-300 border border-emerald-500/50">
                  SOLVED ✓
                </span>
              ) : (
                <span className="ml-1.5 text-[10px] bg-cyan-900/80 px-1.5 py-0.2 rounded text-cyan-300">
                  VERIFY
                </span>
              )}
            </Button>

            {/* 3. Puzzle 6: Overlay Mask */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                playPaperSlide();
                setIsOverlayPuzzleOpen(true);
              }}
              className={`font-mono text-xs font-bold transition-all ${
                isOverlaySolved 
                  ? "bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border-amber-500/50" 
                  : "bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-200 border-indigo-500/50"
              }`}
            >
              <Layers className="w-4 h-4 mr-1.5 text-indigo-400" />
              Puzzle 6: Overlay Mask
              {isOverlaySolved ? (
                <span className="ml-1.5 text-[10px] bg-amber-900/80 px-1.5 py-0.2 rounded text-amber-300 border border-amber-500/50">
                  20:31 ✓
                </span>
              ) : (
                <span className="ml-1.5 text-[10px] bg-indigo-900/80 px-1.5 py-0.2 rounded text-indigo-300">
                  ALIGN
                </span>
              )}
            </Button>

            {/* 4. Case Dossier */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                playKeyClick();
                setIsDossierOpen(true);
              }}
              className="bg-black/60 hover:bg-white/10 text-slate-300 border-slate-700 font-mono text-xs"
            >
              <FolderLock className="w-4 h-4 mr-1.5 text-slate-400" />
              Case File
            </Button>
          </div>

          {/* Destination Navigation when Complete */}
          <div className="flex items-center gap-2">
            {isHashSolved && isOverlaySolved ? (
              <Button
                size="sm"
                onClick={handleProceedToServerRoom}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold shadow-lg shadow-purple-950/60 animate-pulse"
              >
                <Server className="w-4 h-4 mr-1.5" />
                Proceed to Server Room (Final Room)
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block">
                Click 3D objects or dock buttons to investigate
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL INTERFACES
         ======================================================== */}
      {/* 1. Verma's Notebook Modal */}
      <VermaNotebookModal 
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        onOpenHashPuzzle={() => {
          setIsNotebookOpen(false);
          setIsHashPuzzleOpen(true);
        }}
      />

      {/* 2. Puzzle 5: Hash / Digital Fingerprint Modal */}
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

      {/* 3. Puzzle 6: Overlay Mask Modal */}
      <OverlayMaskPuzzle
        isOpen={isOverlayPuzzleOpen}
        onClose={() => setIsOverlayPuzzleOpen(false)}
        onSolved={handleOverlaySolved}
        onProceedToServerRoom={handleProceedToServerRoom}
        initialSolved={isOverlaySolved}
      />

      {/* 4. Room 3 Case Dossier Modal */}
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