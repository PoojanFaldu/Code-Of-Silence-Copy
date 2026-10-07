import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, PerspectiveCamera, Box, Cylinder } from "@react-three/drei";
import * as THREE from "three";
import FirstPersonController from "@/components/rooms/interaction/FirstPersonController";
import FocusDetector from "@/components/rooms/interaction/FocusDetector";
import CrosshairHud from "@/components/rooms/interaction/CrosshairHud";
import ActivePulse from "@/components/rooms/interaction/ActivePulse";
import type { FocusedInteractable, InteractTarget } from "@/components/rooms/interaction/types";
import {
  isCorrectMurderer,
  isNehaAccusation,
  setInvestigationState,
} from "@/lib/investigationState";

/** 0 box → 1 flashlight → 2 UV document → 3 accusation path */
type Step = 0 | 1 | 2 | 3;

const ROOM4_BOUNDARY = {
  minX: -0.401,
  maxX: 0.635,
  minZ: 4.446,
  maxZ: 5.826,
  y: 3,
};

/** On floor beside crates — clear of book pile / bed */
const BOX_POS: [number, number, number] = [0.45, 2.505, 5.05];
const FLASHLIGHT_POS: [number, number, number] = [-0.2, 2.76, 4.2];
const PAPER_POS: [number, number, number] = [0.1, 2.95, 4.1];

const LoadModel = () => {
  const { scene } = useGLTF("/model/RoomFourModel.glb");

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

  return <primitive object={scene} position={[0, 2.5, 5]} scale={0.12} />;
};

/** Plain unmarked sheet — not the codes GLB */
function UvPaperSheet({ uvOn }: { uvOn: boolean }) {
  return (
    <group position={PAPER_POS} rotation={[-0.15, 0.2, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.16, 0.002, 0.2]} />
        <meshStandardMaterial color={uvOn ? "#e9d5ff" : "#e7e5e4"} />
      </mesh>
    </group>
  );
}

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
  const [errorHint, setErrorHint] = useState("");
  const [focused, setFocused] = useState<FocusedInteractable>(null);
  const [step, setStep] = useState<Step>(0);

  const targetFront = 25;
  const targetSide = 75;

  useEffect(() => {
    if (Math.abs(shadowFront - targetFront) < 5 && Math.abs(shadowSide - targetSide) < 5) {
      setBoxUnlocked(true);
      if (showShadowPuzzle) {
        setShowShadowPuzzle(false);
        setShowEvidence(true);
      }
    }
  }, [shadowFront, shadowSide, showShadowPuzzle]);

  const modalOpen =
    showShadowPuzzle ||
    showEvidence ||
    showUvClue ||
    showFinalInvestigation ||
    showFinalQuestion ||
    gameWon;
  const controlsEnabled = !modalOpen;

  const activePos =
    step === 0 ? BOX_POS : step === 1 ? FLASHLIGHT_POS : step === 2 ? PAPER_POS : null;

  const targets: InteractTarget[] = useMemo(
    () => [
      {
        id: "box",
        label: boxUnlocked ? "Evidence box" : "Locked evidence box",
        position: BOX_POS,
        active: step === 0,
        maxDistance: 1.8,
      },
      {
        id: "flashlight",
        label: uvEnabled ? "UV flashlight (on)" : "UV flashlight",
        position: FLASHLIGHT_POS,
        active: step === 1,
        maxDistance: 1.8,
      },
      {
        id: "paper",
        label: "Faded printout",
        position: PAPER_POS,
        active: step === 2 && uvEnabled,
        maxDistance: 1.8,
      },
    ],
    [step, boxUnlocked, uvEnabled]
  );

  const handleInteract = (id: string) => {
    if (id === "box" && step === 0) {
      if (boxUnlocked) setShowEvidence(true);
      else setShowShadowPuzzle(true);
    }
    if (id === "flashlight" && step === 1) {
      setUvEnabled(true);
      setStep(2);
    }
    if (id === "paper" && step === 2 && uvEnabled) {
      setShowUvClue(true);
    }
  };

  return (
    <div className="h-screen w-screen bg-black relative">
      <div className="absolute top-4 right-4 z-20 max-w-xs rounded-lg border border-slate-500/30 bg-black/75 px-4 py-3 text-sm text-slate-300 pointer-events-none">
        <p className="text-[11px] uppercase tracking-wider text-slate-300 mb-1">Server Room</p>
        <p className="text-xs text-slate-400">Search carefully. Aim · Press E</p>
      </div>

      <Canvas camera={{ position: [0, 3, 5], fov: 75 }}>
        <PerspectiveCamera makeDefault position={[0, 3, 5]} fov={75} />

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
          {(step >= 2 || uvEnabled) && <UvPaperSheet uvOn={uvEnabled} />}

          <group position={BOX_POS}>
            <Box scale={[0.15, 0.08, 0.15]}>
              <meshStandardMaterial color={boxUnlocked ? "#3f6212" : "#444444"} />
            </Box>
          </group>

          {step >= 1 && (
            <group position={FLASHLIGHT_POS}>
              <Cylinder rotation={[0, 0, Math.PI / 2]} scale={[0.02, 0.12, 0.02]}>
                <meshStandardMaterial color="#111111" metalness={0.4} roughness={0.4} />
              </Cylinder>
            </group>
          )}

          {activePos && <ActivePulse position={activePos} visible={controlsEnabled} />}

          <FirstPersonController
            boundary={ROOM4_BOUNDARY}
            controlsEnabled={controlsEnabled}
            moveSpeed={0.006}
          />
          <FocusDetector
            targets={targets}
            enabled={controlsEnabled}
            maxDistance={1.8}
            onFocusChange={setFocused}
            onInteract={handleInteract}
          />
        </Suspense>
      </Canvas>

      <CrosshairHud focused={focused} visible={controlsEnabled} />

      {uvEnabled && (
        <div className="absolute top-8 left-1/2 z-20 -translate-x-1/2 pointer-events-none">
          <div className="rounded-lg border border-purple-500/50 bg-purple-900/80 px-6 py-3">
            <p className="font-mono text-sm font-bold text-purple-200">UV LIGHT ENABLED — inspect documents</p>
          </div>
        </div>
      )}

      {showShadowPuzzle && !boxUnlocked && (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-xl max-w-md w-full">
            <h2 className="text-2xl text-white font-bold mb-4">Puzzle 7: Sliding Shadow Box</h2>
            <p className="text-gray-400 mb-6 text-sm">
              Manipulate the internal blocks until the shadows match the target silhouettes.
            </p>

            <div className="mb-6">
              <label className="text-gray-300 text-sm mb-2 block flex justify-between">
                <span>Front Shadow Alignment</span>
                <span className="text-blue-400">
                  {Math.abs(shadowFront - targetFront) < 5 ? "Matched!" : "Misaligned"}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={shadowFront}
                onChange={(e) => setShadowFront(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div className="mb-8">
              <label className="text-gray-300 text-sm mb-2 block flex justify-between">
                <span>Side Shadow Alignment</span>
                <span className="text-blue-400">
                  {Math.abs(shadowSide - targetSide) < 5 ? "Matched!" : "Misaligned"}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={shadowSide}
                onChange={(e) => setShadowSide(Number(e.target.value))}
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

      {showEvidence && (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-xl max-w-lg w-full">
            <h2 className="text-2xl text-green-400 font-bold mb-4">Evidence Box Unlocked</h2>
            <div className="bg-black/50 p-6 rounded border border-gray-800 mb-6 font-serif">
              <p className="text-gray-300 mb-4 italic">
                A printed server access slip and a folded note from Verma.
              </p>
              <p className="text-gray-300 italic">Handwritten:</p>
              <p className="text-white text-xl mt-4 border-l-4 border-gray-500 pl-4">
                &quot;Mehta&apos;s originals do not match. If I vanish, check the first EXP-17 write.&quot;
              </p>
            </div>
            <button
              onClick={() => {
                setShowEvidence(false);
                setStep(1);
              }}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showUvClue && !showFinalInvestigation && !showFinalQuestion && !gameWon && (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-purple-900/20 border border-purple-500/50 p-8 rounded-xl max-w-lg w-full shadow-[0_0_30px_rgba(138,43,226,0.3)]">
            <h2 className="text-2xl text-purple-300 font-bold mb-4">Server Log Restored</h2>
            <p className="text-gray-300 mb-6">
              Under UV, a faded printout of the original modification chain becomes readable.
            </p>

            <div className="bg-black/60 p-6 rounded border border-purple-900/50 mb-6 font-mono text-sm space-y-3 text-left">
              <p className="text-purple-200">
                ORIGINAL WRITE · EXP-17_BASELINE · User: <span className="text-amber-300 font-bold">A. MEHTA</span>
              </p>
              <p className="text-slate-400">Later overwrite · EXP-17_RESULTS · User: N. RAO</p>
              <div className="h-px w-full bg-purple-900/50" />
              <p className="text-purple-300/90 italic">
                &quot;Verma scheduled a formal complaint against Mehta. Session terminated abruptly.&quot;
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
                onClick={() => {
                  setInvestigationState({ arjunEvidenceFound: true, finalUnlocked: true });
                  setShowFinalInvestigation(true);
                }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold transition-colors shadow-[0_0_15px_rgba(147,51,234,0.5)]"
              >
                Assemble Final Investigation
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinalInvestigation && !showFinalQuestion && !gameWon && (
        <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-xl max-w-2xl w-full my-8">
            <h2 className="text-3xl text-white font-bold mb-6 text-center border-b border-gray-800 pb-4">
              FINAL INVESTIGATION
            </h2>

            <div className="space-y-6 mb-8 text-gray-300">
              <div>
                <h3 className="text-blue-400 font-bold mb-1 uppercase tracking-wider text-sm">Motive</h3>
                <p className="bg-black/30 p-3 rounded">
                  Arjun&apos;s research was compromised. Verma discovered it and prepared to expose him.
                </p>
              </div>

              <div>
                <h3 className="text-blue-400 font-bold mb-1 uppercase tracking-wider text-sm">
                  Original Manipulation
                </h3>
                <p className="bg-black/30 p-3 rounded">
                  The first falsification of EXP-17 predates Neha&apos;s modifications and connects to Dr. Arjun Mehta.
                </p>
              </div>

              <div>
                <h3 className="text-blue-400 font-bold mb-1 uppercase tracking-wider text-sm">Neha&apos;s Role</h3>
                <p className="bg-black/30 p-3 rounded">
                  Neha altered later records and accessed the archive — but the evidence indicates she was hiding the
                  manipulation, not causing the murder.
                </p>
              </div>

              <div>
                <h3 className="text-blue-400 font-bold mb-1 uppercase tracking-wider text-sm">
                  Digital / Archive Evidence
                </h3>
                <p className="bg-black/30 p-3 rounded">
                  Original records and server logs connect the first write to Arjun. Verma was about to report him.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowFinalQuestion(true)}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition-colors shadow-[0_0_20px_rgba(220,38,38,0.4)]"
            >
              PROCEED TO FINAL ACCUSATION
            </button>
          </div>
        </div>
      )}

      {showFinalQuestion && !gameWon && (
        <div className="absolute inset-0 bg-red-950/90 z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-red-900/50 p-8 rounded-xl max-w-xl w-full shadow-[0_0_50px_rgba(220,38,38,0.2)]">
            <h2 className="text-3xl text-red-500 font-black mb-8 text-center tracking-widest">FINAL QUESTION</h2>

            <p className="text-2xl text-white text-center mb-8">WHO MURDERED PROFESSOR DEV VERMA?</p>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter suspect name..."
                value={finalAnswer}
                onChange={(e) => {
                  setFinalAnswer(e.target.value);
                  setAnswerError(false);
                  setErrorHint("");
                }}
                className="w-full bg-gray-900 border border-gray-700 text-white text-center text-xl p-4 rounded focus:outline-none focus:border-red-500 uppercase tracking-wider"
              />

              {answerError && (
                <p className="text-red-500 text-center font-bold">
                  {errorHint || "Incorrect. Review the evidence."}
                </p>
              )}

              <button
                onClick={() => {
                  if (isCorrectMurderer(finalAnswer)) {
                    setInvestigationState({ room4Complete: true, caseSolved: true });
                    setGameWon(true);
                  } else if (isNehaAccusation(finalAnswer)) {
                    setAnswerError(true);
                    setErrorHint("Neha looks guilty — but she is not the murderer. Dig deeper.");
                  } else {
                    setAnswerError(true);
                    setErrorHint("Incorrect. Review the evidence.");
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

      {gameWon && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full text-center">
            <h1 className="text-6xl text-green-500 font-black mb-6 tracking-widest drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]">
              CASE SOLVED
            </h1>
            <p className="text-cyan-300 font-mono text-sm mb-6 tracking-widest">THE LAST SESSION</p>

            <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-xl text-left space-y-6 mb-10">
              <p className="text-xl text-gray-300 leading-relaxed">
                <span className="text-white font-bold">Dr. Arjun Mehta</span> manipulated the original EXP-17
                research. When Professor Verma discovered it and prepared to expose him, Arjun killed him to stop the
                report.
              </p>
              <p className="text-xl text-gray-300 leading-relaxed">
                <span className="text-white font-bold">Neha Rao</span> later altered records because she found Arjun&apos;s
                manipulation and feared she would be blamed. She was a red herring — suspicious, but not the murderer.
              </p>
            </div>

            <button
              onClick={() => (window.location.href = "/?skipIntro=true")}
              className="px-10 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-colors uppercase tracking-widest"
            >
              Return to Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomFour;
