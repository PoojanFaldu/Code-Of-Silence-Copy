import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Html, PerspectiveCamera, Box, Cylinder } from "@react-three/drei";
import * as THREE from "three";
import { useGame } from "@/contexts/GameContext";

const LoadPaper = ({ position = [0.1, 2.8, 4.1], rotation = [0, 0, 0], scale = 0.02, onClick = () => {} }) => {
  const PaperRef = useRef();
  const { scene } = useGLTF("/model/pageFour.glb");

  if (!scene) return null;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive ref={PaperRef} object={scene} onClick={onClick} />
      <Html center position={[0, 5, 0]}>
        <div className="bg-white/80 px-2 py-1 rounded text-xs text-black border border-gray-400 pointer-events-none whitespace-nowrap">
          Click to Inspect Paper
        </div>
      </Html>
    </group>
  );
};

const LoadModel = () => {
  const { scene } = useGLTF("/model/RoomFourModel.glb");

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

  return <primitive object={scene} position={[0, 2.5, 5]} scale={0.12} />;
};

const FirstPersonControls = () => {
  const { camera, gl } = useThree();
  const moveState = useRef({ forward: false, backward: false, left: false, right: false });
  const [isMouseLooking, setIsMouseLooking] = useState(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  const velocity = useRef(new THREE.Vector3());
  const moveSpeed = 0.005;
  const mouseSensitivity = 0.002;

  const boundary = useRef({
    minX: -0.401,
    maxX: 0.635,
    minZ: 4.446,
    maxZ: 5.826,
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

const RoomFour = () => {
  const [showShadowPuzzle, setShowShadowPuzzle] = useState(false);
  const [shadowFront, setShadowFront] = useState(50);
  const [shadowSide, setShadowSide] = useState(50);
  const [boxUnlocked, setBoxUnlocked] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  const [uvEnabled, setUvEnabled] = useState(false);
  const [showUvClue, setShowUvClue] = useState(false);

  const [showFinalInvestigation, setShowFinalInvestigation] = useState(false);
  const [showFinalQuestion, setShowFinalQuestion] = useState(false);
  const [finalAnswer, setFinalAnswer] = useState("");
  const [gameWon, setGameWon] = useState(false);
  const [answerError, setAnswerError] = useState(false);

  // Magic values for shadow puzzle
  const targetFront = 25;
  const targetSide = 75;

  useEffect(() => {
    if (Math.abs(shadowFront - targetFront) < 5 && Math.abs(shadowSide - targetSide) < 5) {
      setBoxUnlocked(true);
    }
  }, [shadowFront, shadowSide]);

  const handleBoxClick = (e: any) => {
    e.stopPropagation();
    if (boxUnlocked) {
      setShowEvidence(true);
    } else {
      setShowShadowPuzzle(true);
    }
  };

  const handleFlashlightClick = (e: any) => {
    e.stopPropagation();
    setUvEnabled(!uvEnabled);
  };

  const handlePaperClick = (e: any) => {
    e.stopPropagation();
    if (uvEnabled) {
      setShowUvClue(true);
    }
  };

  return (
    <div className="h-screen w-screen bg-black relative">
      <Canvas camera={{ position: [0, 3, 5], fov: 75 }}>
        <PerspectiveCamera makeDefault position={[0, 3, 5]} fov={75} />
        
        {/* Normal / UV Lighting */}
        {uvEnabled ? (
          <>
            <ambientLight intensity={0.8} color="#8a2be2" />
            <pointLight position={[0, 5, 0]} intensity={0.5} color="#4b0082" />
          </>
        ) : (
          <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
            <pointLight position={[0, 5, 0]} intensity={1} />
            <pointLight position={[5, 3, 5]} intensity={0.5} color="#ffffff" />
          </>
        )}

        <Suspense fallback={null}>
          <LoadModel />
          <LoadPaper onClick={handlePaperClick} />
          <FirstPersonControls />

          {/* Evidence Box */}
          <group position={[0.2, 2.76, 4.3]}>
            <Box scale={[0.15, 0.08, 0.15]} onClick={handleBoxClick}>
              <meshStandardMaterial color={boxUnlocked ? "#4CAF50" : "#444444"} />
            </Box>
            <Html center position={[0, 0.1, 0]}>
              <div className="bg-black/80 px-2 py-1 rounded text-xs text-white border border-gray-600 pointer-events-none whitespace-nowrap">
                {boxUnlocked ? "Evidence Box (Unlocked)" : "Click to Open Shadow Box"}
              </div>
            </Html>
          </group>

          {/* UV Flashlight */}
          <group position={[-0.2, 2.76, 4.2]}>
            <Cylinder rotation={[0, 0, Math.PI / 2]} scale={[0.02, 0.12, 0.02]} onClick={handleFlashlightClick}>
              <meshStandardMaterial color="#111111" />
            </Cylinder>
            <Html center position={[0, 0.05, 0]}>
              <div className="bg-purple-900/80 px-2 py-1 rounded text-xs text-purple-200 border border-purple-500 pointer-events-none whitespace-nowrap">
                Click to Toggle UV Light
              </div>
            </Html>
          </group>
        </Suspense>
      </Canvas>

      {/* Controls Instructions */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 px-6 py-3 rounded-lg border border-white/20 z-10 pointer-events-none">
        <p className="text-white text-sm font-mono text-center">
          WASD/Arrows: Move • Click + Drag: Look Around<br/>
          Click on objects to interact
        </p>
      </div>

      {uvEnabled && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-purple-900/80 px-6 py-3 rounded-lg border border-purple-500/50 z-10 pointer-events-none">
          <p className="text-purple-200 text-sm font-mono font-bold">UV LIGHT ENABLED - Look for hidden clues</p>
        </div>
      )}

      {/* Shadow Puzzle Modal */}
      {showShadowPuzzle && !boxUnlocked && (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-xl max-w-md w-full">
            <h2 className="text-2xl text-white font-bold mb-4">Puzzle 7: Sliding Shadow Box</h2>
            <p className="text-gray-400 mb-6 text-sm">Manipulate the internal blocks until the shadows match the target silhouettes.</p>
            
            <div className="mb-6">
              <label className="text-gray-300 text-sm mb-2 block flex justify-between">
                <span>Front Shadow Alignment</span>
                <span className="text-blue-400">{Math.abs(shadowFront - targetFront) < 5 ? "Matched!" : "Misaligned"}</span>
              </label>
              <input 
                type="range" min="0" max="100" 
                value={shadowFront} onChange={(e) => setShadowFront(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div className="mb-8">
              <label className="text-gray-300 text-sm mb-2 block flex justify-between">
                <span>Side Shadow Alignment</span>
                <span className="text-blue-400">{Math.abs(shadowSide - targetSide) < 5 ? "Matched!" : "Misaligned"}</span>
              </label>
              <input 
                type="range" min="0" max="100" 
                value={shadowSide} onChange={(e) => setShadowSide(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <button 
              onClick={() => setShowShadowPuzzle(false)}
              className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
            >
              Step Back
            </button>
          </div>
        </div>
      )}

      {/* Box Unlocked / Evidence Modal */}
      {showEvidence && (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-xl max-w-lg w-full">
            <h2 className="text-2xl text-green-400 font-bold mb-4">Evidence Box Unlocked</h2>
            <div className="bg-black/50 p-6 rounded border border-gray-800 mb-6 font-serif">
              <p className="text-gray-300 mb-4 italic">Inside is a small photograph showing Verma's desk with the same rectangular object seen in the CCTV footage.</p>
              <p className="text-gray-300 italic">And a handwritten note:</p>
              <p className="text-white text-xl mt-4 border-l-4 border-gray-500 pl-4">
                "I confronted her tonight. She knows I found out."
              </p>
            </div>
            <button 
              onClick={() => setShowEvidence(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* UV Clue Modal */}
      {showUvClue && !showFinalInvestigation && !showFinalQuestion && !gameWon && (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-purple-900/20 border border-purple-500/50 p-8 rounded-xl max-w-lg w-full shadow-[0_0_30px_rgba(138,43,226,0.3)]">
            <h2 className="text-2xl text-purple-300 font-bold mb-4">Hidden Message Revealed</h2>
            <p className="text-gray-300 mb-6">Under the UV light, invisible ink markings appear on the surrounding documents.</p>
            
            <div className="bg-black/60 p-6 rounded border border-purple-900/50 mb-6 font-mono text-center space-y-4">
              <p className="text-purple-400 text-xl font-bold tracking-widest drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
                NEHA — 20:31 — SHE WAS HERE.
              </p>
              <div className="h-px w-full bg-purple-900/50"></div>
              <p className="text-purple-300/80 italic drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">
                "If anything happens to me, the altered research is the reason."
              </p>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowUvClue(false)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => setShowFinalInvestigation(true)}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold transition-colors shadow-[0_0_15px_rgba(147,51,234,0.5)]"
              >
                Assemble Final Investigation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Investigation Modal */}
      {showFinalInvestigation && !showFinalQuestion && !gameWon && (
        <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-xl max-w-2xl w-full my-8">
            <h2 className="text-3xl text-white font-bold mb-6 text-center border-b border-gray-800 pb-4">FINAL INVESTIGATION</h2>
            
            <div className="space-y-6 mb-8 text-gray-300">
              <div>
                <h3 className="text-blue-400 font-bold mb-1 uppercase tracking-wider text-sm">Motive</h3>
                <p className="bg-black/30 p-3 rounded">Neha manipulated research results. Verma discovered the manipulation.</p>
              </div>
              
              <div>
                <h3 className="text-blue-400 font-bold mb-1 uppercase tracking-wider text-sm">Presence</h3>
                <p className="bg-black/30 p-3 rounded">Neha was in the laboratory at 20:31.</p>
              </div>
              
              <div>
                <h3 className="text-blue-400 font-bold mb-1 uppercase tracking-wider text-sm">CCTV Evidence</h3>
                <p className="bg-black/30 p-3 rounded">Her distinctive bag was seen entering the lab.</p>
              </div>
              
              <div>
                <h3 className="text-blue-400 font-bold mb-1 uppercase tracking-wider text-sm">Digital Evidence</h3>
                <p className="bg-black/30 p-3 rounded">The research was deliberately altered.</p>
              </div>

              <div>
                <h3 className="text-blue-400 font-bold mb-1 uppercase tracking-wider text-sm">Verma's Note</h3>
                <p className="bg-black/30 p-3 rounded">He wrote that he had confronted "her."</p>
              </div>

              <div>
                <h3 className="text-blue-400 font-bold mb-1 uppercase tracking-wider text-sm">Hidden UV Message</h3>
                <p className="bg-black/30 p-3 rounded">Verma specifically connected Neha to the incident: "NEHA — 20:31 — SHE WAS HERE."</p>
              </div>
            </div>

            <button 
              onClick={() => setShowFinalQuestion(true)}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition-colors shadow-[0_0_20px_rgba(220,38,38,0.4)]"
            >
              PROCEED TO FINAL CONCLUSION
            </button>
          </div>
        </div>
      )}

      {/* Final Question Modal */}
      {showFinalQuestion && !gameWon && (
        <div className="absolute inset-0 bg-red-950/90 z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-red-900/50 p-8 rounded-xl max-w-xl w-full shadow-[0_0_50px_rgba(220,38,38,0.2)]">
            <h2 className="text-3xl text-red-500 font-black mb-8 text-center tracking-widest">FINAL QUESTION</h2>
            
            <p className="text-2xl text-white text-center mb-8">
              WHO MURDERED PROFESSOR DEV VERMA?
            </p>
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Enter suspect name..." 
                value={finalAnswer}
                onChange={(e) => {
                  setFinalAnswer(e.target.value);
                  setAnswerError(false);
                }}
                className="w-full bg-gray-900 border border-gray-700 text-white text-center text-xl p-4 rounded focus:outline-none focus:border-red-500 uppercase tracking-wider"
              />
              
              {answerError && (
                <p className="text-red-500 text-center font-bold">Incorrect. Review the evidence.</p>
              )}
              
              <button 
                onClick={() => {
                  const answer = finalAnswer.toLowerCase().trim();
                  if (answer === "neha rao" || answer === "neha") {
                    setGameWon(true);
                  } else {
                    setAnswerError(true);
                  }
                }}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-lg transition-colors mt-4"
              >
                SUBMIT ACCUSATION
              </button>
              
              <button 
                onClick={() => setShowFinalQuestion(false)}
                className="w-full py-2 bg-transparent text-gray-500 hover:text-white transition-colors text-sm uppercase tracking-widest mt-2"
              >
                Review Evidence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Won Modal */}
      {gameWon && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full text-center">
            <h1 className="text-6xl text-green-500 font-black mb-6 tracking-widest drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]">
              CASE SOLVED
            </h1>
            
            <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-xl text-left space-y-6 mb-10">
              <p className="text-xl text-gray-300 leading-relaxed">
                <span className="text-white font-bold">Neha</span> had manipulated the research and discovered that Professor Verma had uncovered the fraud. 
                She entered the laboratory that evening to confront him.
              </p>
              <p className="text-xl text-gray-300 leading-relaxed">
                When Verma threatened to expose her, she killed him and attempted to destroy the evidence.
              </p>
              <p className="text-xl text-gray-300 leading-relaxed">
                Verma, however, had already hidden clues throughout the facility, leaving behind a trail that connected his research, the laboratory, and Neha.
              </p>
            </div>
            
            <button 
              onClick={() => window.location.href = "/"}
              className="px-10 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-colors uppercase tracking-widest"
            >
              Return to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomFour;