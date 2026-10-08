import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, PerspectiveCamera, Box, Cylinder } from "@react-three/drei";
import * as THREE from "three";
import FirstPersonController from "@/components/rooms/interaction/FirstPersonController";
import FocusDetector from "@/components/rooms/interaction/FocusDetector";
import CrosshairHud from "@/components/rooms/interaction/CrosshairHud";
import ActivePulse from "@/components/rooms/interaction/ActivePulse";
import type { FocusedInteractable, InteractTarget } from "@/components/rooms/interaction/types";
import SessionIdentificationPuzzle from "@/components/rooms/roomFour/SessionIdentificationPuzzle";
import { setInvestigationState } from "@/lib/investigationState";
import { completeTask, unlockLog } from "@/lib/investigationProgress";

/** 0 session → 1 flashlight → 2 UV paper → 3 accusation */
type Step = 0 | 1 | 2 | 3;

const ROOM4_BOUNDARY = {
  minX: -0.401,
  maxX: 0.635,
  minZ: 4.446,
  maxZ: 5.826,
  y: 3,
};

const BOX_POS: [number, number, number] = [0.45, 2.505, 5.05];
const FLASHLIGHT_POS: [number, number, number] = [-0.2, 2.76, 4.2];
/** Glass coffee table — small nudge up/in from the rim seat. */
const PAPER_POS: [number, number, number] = [0.08, 2.820, 4.08];

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

function UvPaperSheet({ uvOn }: { uvOn: boolean }) {
  return (
    <group position={PAPER_POS} rotation={[0.02, 0.35, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.003, 0.22]} />
        <meshStandardMaterial color={uvOn ? "#e9d5ff" : "#e7e5e4"} />
      </mesh>
    </group>
  );
}

/** Normalize typed accusation: ignore case, punctuation, and extra spaces. */
function normalizeAccusation(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^dr\s+/, "")
    .trim();
}

function isArjunAccusation(raw: string) {
  const s = normalizeAccusation(raw);
  return s === "arjun" || s === "mehta" || s === "arjun mehta" || s === "mehta arjun";
}

function isNehaAccusation(raw: string) {
  const s = normalizeAccusation(raw);
  return s === "neha" || s === "rao" || s === "neha rao" || s === "rao neha";
}

function isKaranAccusation(raw: string) {
  const s = normalizeAccusation(raw);
  return s === "karan" || s === "patel" || s === "karan patel" || s === "patel karan";
}

const RoomFour = () => {
  const [showSession, setShowSession] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [uvEnabled, setUvEnabled] = useState(false);
  const [showUvClue, setShowUvClue] = useState(false);
  const [showFinalQuestion, setShowFinalQuestion] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [accusation, setAccusation] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [focused, setFocused] = useState<FocusedInteractable>(null);
  const [step, setStep] = useState<Step>(0);

  const modalOpen = showSession || showUvClue || showFinalQuestion || gameWon;
  const controlsEnabled = !modalOpen;

  const activePos =
    step === 0 ? BOX_POS : step === 1 ? FLASHLIGHT_POS : step === 2 ? PAPER_POS : null;

  const targets: InteractTarget[] = useMemo(
    () => [
      {
        id: "box",
        label: sessionDone ? "Session terminal" : "Session log",
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
    [step, sessionDone, uvEnabled]
  );

  const handleInteract = (id: string) => {
    if (id === "box" && step === 0) {
      if (sessionDone) setStep(1);
      else setShowSession(true);
    }
    if (id === "flashlight" && step === 1) {
      setUvEnabled(true);
      setStep(2);
    }
    if (id === "paper" && step === 2 && uvEnabled) {
      setShowUvClue(true);
    }
  };

  const accuse = () => {
    if (isArjunAccusation(accusation)) {
      completeTask("accusation");
      setInvestigationState({ room4Complete: true, caseSolved: true });
      setGameWon(true);
      setShowFinalQuestion(false);
      return;
    }
    if (isNehaAccusation(accusation)) {
      setAnswerError("The timeline does not match.\nTry again.");
      return;
    }
    if (isKaranAccusation(accusation)) {
      setAnswerError("Access alone is not enough.\nTry again.");
      return;
    }
    setAnswerError("That name does not fit the evidence.\nTry again.");
  };

  return (
    <div className="h-screen w-screen bg-black relative">
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
              <meshStandardMaterial color={sessionDone ? "#3f6212" : "#444444"} />
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
          <div className="rounded-lg border border-purple-500/50 bg-purple-900/80 px-4 py-2">
            <p className="font-mono text-xs font-bold text-purple-200">UV ON</p>
          </div>
        </div>
      )}

      {showSession && (
        <SessionIdentificationPuzzle
          onClose={() => setShowSession(false)}
          onSolved={() => {
            completeTask("session");
            unlockLog("session_full");
            setSessionDone(true);
            setShowSession(false);
            setStep(1);
          }}
        />
      )}

      {showUvClue && !showFinalQuestion && !gameWon && (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-[#12081c] border border-purple-500/40 p-6 rounded-xl max-w-md w-full space-y-4">
            <h2 className="text-lg text-purple-200 font-semibold tracking-widest">SESSION ARCHIVE</h2>
            <div className="font-mono text-sm text-slate-300 space-y-1 whitespace-pre-line">
              {`20:56  VERMA
21:03  A. MEHTA
21:17  EXP-17 BASELINE
       MODIFIED

21:29  N. RAO
21:36  UNKNOWN SESSION

21:41  VERMA TERMINAL
       DISCONNECTED

21:42  SESSION CLOSED`}
            </div>
            <p className="text-xs text-purple-300/80 italic">
              Original record retained.
              <br />
              Later copy modified.
            </p>
            <button
              onClick={() => {
                completeTask("uv");
                unlockLog("uv_archive");
                setInvestigationState({ arjunEvidenceFound: true, finalUnlocked: true });
                setShowUvClue(false);
                setShowFinalQuestion(true);
                setStep(3);
              }}
              className="w-full py-3 bg-purple-600/80 hover:bg-purple-600 text-white rounded font-medium"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}

      {showFinalQuestion && !gameWon && (
        <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-red-900/50 p-8 rounded-xl max-w-md w-full space-y-5">
            <h2 className="text-xl text-white font-bold text-center tracking-wide">
              WHO KILLED PROFESSOR DEV VERMA?
            </h2>

            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setAnswerError("");
                accuse();
              }}
            >
              <input
                type="text"
                autoFocus
                value={accusation}
                onChange={(e) => {
                  setAccusation(e.target.value);
                  setAnswerError("");
                }}
                placeholder="Type the name"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded border border-white/20 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 focus:border-red-500/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!accusation.trim()}
                className="w-full py-3 border border-red-900/60 bg-red-950/40 hover:bg-red-900/50 disabled:opacity-40 disabled:hover:bg-red-950/40 text-white rounded font-mono text-sm tracking-wider"
              >
                ACCUSE
              </button>
            </form>

            {answerError && (
              <p className="text-rose-400 text-center text-sm whitespace-pre-line">{answerError}</p>
            )}
          </div>
        </div>
      )}

      {gameWon && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <h1 className="text-4xl text-emerald-400 font-black tracking-widest">CASE CLOSED</h1>
            <div className="text-left text-slate-300 text-sm space-y-3 leading-relaxed">
              <p>
                Arjun Mehta&apos;s access and activity place him at the center of the original alteration.
              </p>
              <p>Professor Verma had discovered the manipulation.</p>
              <p>The missing hour concealed the final connection.</p>
            </div>
            <button
              onClick={() => (window.location.href = "/?skipIntro=true")}
              className="px-8 py-3 bg-white text-black rounded font-bold text-sm tracking-widest"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomFour;
