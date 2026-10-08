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
import TangledWiresPuzzle from "@/components/rooms/roomFour/TangledWiresPuzzle";
import CctvMonitor from "@/components/rooms/roomFour/CctvMonitor";
import { useGame } from "@/contexts/GameContext";
import { setInvestigationState } from "@/lib/investigationState";
import { completeTask, unlockLog } from "@/lib/investigationProgress";
import { MISSION_DURATION_SECONDS, recordMurderGuess } from "@/lib/eventDb";

/** 0 session → 1 flashlight → 2 UV → 3 wires → 4 monitor → accuse */
type Step = 0 | 1 | 2 | 3 | 4;

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
/** Wall CCTV monitor — back-right of the server room. */
const MONITOR_POS: [number, number, number] = [0.52, 3.05, 5.55];
const WIRES_POS: [number, number, number] = [0.35, 2.7, 5.35];

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

function RelayPanelMesh() {
  return (
    <group position={WIRES_POS} rotation={[0, 0.4, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.14, 0.18, 0.03]} />
        <meshStandardMaterial color="#22272e" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[0.1, 0.14]} />
        <meshStandardMaterial color="#67e8f9" emissive="#0e7490" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function MonitorMesh({ lit }: { lit: boolean }) {
  return (
    <group position={MONITOR_POS} rotation={[0, -0.55, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.22, 0.16, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry args={[0.18, 0.12]} />
        <meshStandardMaterial
          color={lit ? "#22d3ee" : "#0ea5e9"}
          emissive={lit ? "#0891b2" : "#164e63"}
          emissiveIntensity={lit ? 1.4 : 0.35}
        />
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

function isMayaAccusation(raw: string) {
  const s = normalizeAccusation(raw);
  return s === "maya" || s === "shah" || s === "maya shah" || s === "shah maya";
}

function isRohanAccusation(raw: string) {
  const s = normalizeAccusation(raw);
  return s === "rohan" || s === "desai" || s === "rohan desai" || s === "desai rohan";
}

const RoomFour = () => {
  const { penalizeWrongAccusation, timeRemaining } = useGame();
  const [showSession, setShowSession] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [uvEnabled, setUvEnabled] = useState(false);
  const [showUvClue, setShowUvClue] = useState(false);
  const [showWires, setShowWires] = useState(false);
  const [wiresDone, setWiresDone] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [cctvUnlocked, setCctvUnlocked] = useState(false);
  const [showFinalQuestion, setShowFinalQuestion] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [accusation, setAccusation] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [focused, setFocused] = useState<FocusedInteractable>(null);
  const [step, setStep] = useState<Step>(0);

  const modalOpen =
    showSession || showUvClue || showWires || showMonitor || showFinalQuestion || gameWon;
  const controlsEnabled = !modalOpen;

  const activePos =
    step === 0
      ? BOX_POS
      : step === 1
        ? FLASHLIGHT_POS
        : step === 2
          ? PAPER_POS
          : step === 3
            ? WIRES_POS
            : step === 4
              ? MONITOR_POS
              : null;

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
      {
        id: "wires",
        label: "Relay circuit",
        position: WIRES_POS,
        active: step === 3 && !wiresDone,
        maxDistance: 1.8,
      },
      {
        id: "monitor",
        label: cctvUnlocked ? "CCTV feed" : "CCTV monitor",
        position: MONITOR_POS,
        active: step === 4 && wiresDone,
        maxDistance: 1.9,
      },
    ],
    [step, sessionDone, uvEnabled, wiresDone, cctvUnlocked]
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
    if (id === "wires" && step === 3 && !wiresDone) {
      setShowWires(true);
    }
    if (id === "monitor" && wiresDone) {
      setShowMonitor(true);
    }
  };

  const accuse = () => {
    const timeUsed = Math.max(0, MISSION_DURATION_SECONDS - timeRemaining);
    if (isArjunAccusation(accusation)) {
      completeTask("accusation");
      recordMurderGuess(accusation.trim(), true, timeUsed);
      setInvestigationState({ room4Complete: true, caseSolved: true });
      setGameWon(true);
      setShowFinalQuestion(false);
      return;
    }
    recordMurderGuess(accusation.trim(), false, timeUsed);
    penalizeWrongAccusation();
    if (isNehaAccusation(accusation)) {
      setAnswerError("Neha Rao acted after 21:17.\nTry again.");
      return;
    }
    if (isKaranAccusation(accusation)) {
      setAnswerError("Access alone is not enough.\nTry again.");
      return;
    }
    if (isMayaAccusation(accusation)) {
      setAnswerError("Motive without the 21:17 change.\nTry again.");
      return;
    }
    if (isRohanAccusation(accusation)) {
      setAnswerError("His admin restart is after 21:41.\nTry again.");
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
          {step === 3 && !wiresDone && <RelayPanelMesh />}
          {(wiresDone || step >= 4) && <MonitorMesh lit={step === 4 || cctvUnlocked} />}

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

      {wiresDone && step === 4 && !showMonitor && !showFinalQuestion && !gameWon && (
        <div className="absolute top-20 left-1/2 z-20 -translate-x-1/2 pointer-events-none">
          <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/80 px-4 py-2">
            <p className="font-mono text-[11px] text-cyan-100">CCTV monitor unlocked</p>
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

      {showUvClue && !showWires && !showMonitor && !showFinalQuestion && !gameWon && (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#12081c] border border-purple-500/40 p-6 rounded-xl max-w-md w-full space-y-4 my-4">
            <h2 className="text-lg text-purple-200 font-semibold tracking-widest">UV ARCHIVE</h2>
            <div className="font-mono text-[11px] sm:text-xs text-slate-300 space-y-1.5">
              <div className="flex gap-3">
                <span className="w-10 shrink-0 text-purple-300/80">20:56</span>
                <span>VERMA — online</span>
              </div>
              <div className="flex gap-3 rounded-md bg-amber-500/10 border border-amber-400/20 px-2 py-1 -mx-0.5">
                <span className="w-10 shrink-0 text-amber-300">21:03</span>
                <span className="text-amber-100">A. MEHTA — lab access</span>
              </div>
              <div className="flex gap-3 rounded-md bg-amber-500/10 border border-amber-400/20 px-2 py-1 -mx-0.5">
                <span className="w-10 shrink-0 text-amber-300">21:17</span>
                <span className="text-amber-100">EXP-17 BASELINE MODIFIED · 84.2% → 91.7%</span>
              </div>
              <div className="flex gap-3 rounded-md bg-emerald-500/10 border border-emerald-400/20 px-2 py-1 -mx-0.5">
                <span className="w-10 shrink-0 text-emerald-300">21:29</span>
                <span className="text-emerald-100">N. RAO — record access</span>
              </div>
              <div className="flex gap-3 rounded-md bg-emerald-500/10 border border-emerald-400/20 px-2 py-1 -mx-0.5">
                <span className="w-10 shrink-0 text-emerald-300">21:36</span>
                <span className="text-emerald-100">N. RAO — server access</span>
              </div>
              <div className="flex gap-3 rounded-md bg-rose-500/10 border border-rose-400/25 px-2 py-1 -mx-0.5">
                <span className="w-10 shrink-0 text-rose-300">21:41</span>
                <span className="text-rose-100">VERMA TERMINAL DISCONNECTED</span>
              </div>
              <div className="flex gap-3">
                <span className="w-10 shrink-0 text-purple-300/80">21:42</span>
                <span>SESSION CLOSED</span>
              </div>
              <div className="flex gap-3 opacity-90">
                <span className="w-10 shrink-0 text-slate-500">21:44</span>
                <span>ADMIN RESTART — R. DESAI</span>
              </div>
            </div>

            <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/25 px-3 py-2.5 font-mono text-[11px] text-slate-200 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-cyan-300/80">Network · 21:31</p>
              <p className="text-cyan-100/90">LAB-02 → SERVER · LAB-02 = MEHTA-PC</p>
            </div>

            <div className="rounded-lg border border-purple-500/25 bg-black/50 px-3 py-3 font-serif text-xs italic text-purple-50/90 leading-relaxed space-y-2">
              <p className="font-mono not-italic text-[10px] tracking-widest text-purple-300/70">
                FINAL NOTE — D. VERMA
              </p>
              <p>&quot;He knows I found it.</p>
              <p>We need to speak tonight.&quot;</p>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              21:17 rewrite ties to the assigned researcher. Restore the relay, then the wall
              monitor.
            </p>

            <button
              onClick={() => {
                completeTask("uv");
                unlockLog("uv_archive");
                setInvestigationState({ arjunEvidenceFound: true, finalUnlocked: true });
                setShowUvClue(false);
                setStep(3);
                setShowWires(true);
              }}
              className="w-full py-3 bg-purple-600/80 hover:bg-purple-600 text-white rounded font-medium"
            >
              OPEN RELAY CIRCUIT
            </button>
          </div>
        </div>
      )}

      {showWires && !showMonitor && !showFinalQuestion && !gameWon && (
        <TangledWiresPuzzle
          onClose={() => setShowWires(false)}
          onSolved={() => {
            completeTask("wires");
            unlockLog("wires_signal");
            setWiresDone(true);
            setShowWires(false);
            setStep(4);
          }}
        />
      )}

      {showMonitor && !showFinalQuestion && !gameWon && (
        <CctvMonitor
          unlocked={cctvUnlocked}
          onClose={() => setShowMonitor(false)}
          onUnlocked={() => {
            completeTask("cctv");
            setCctvUnlocked(true);
          }}
          onAccuse={() => {
            setShowMonitor(false);
            setShowFinalQuestion(true);
          }}
        />
      )}

      {showFinalQuestion && !gameWon && (
        <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-red-900/50 p-8 rounded-xl max-w-md w-full space-y-5">
            <h2 className="text-xl text-white font-bold text-center tracking-wide">
              WHO KILLED PROFESSOR DEV VERMA?
            </h2>
            <p className="text-center text-xs text-slate-500 leading-relaxed">
              Wrong accusation: −10:00.
            </p>

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

            <button
              type="button"
              onClick={() => {
                setShowFinalQuestion(false);
                setShowMonitor(true);
              }}
              className="w-full py-2 text-xs font-mono tracking-wider text-slate-400 hover:text-slate-200"
            >
              ← BACK TO CCTV
            </button>

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
                Arjun Mehta made the original Experiment 17 change. Verma found out and meant to
                confront him that night.
              </p>
              <p>Later access by others looked guilty — but came after the fact.</p>
            </div>
            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={() => (window.location.href = "/leaderboard")}
                className="px-8 py-3 bg-white text-black rounded font-bold text-sm tracking-widest"
              >
                LEADERBOARD
              </button>
              <button
                onClick={() => (window.location.href = "/?newPlayer=1")}
                className="px-6 py-2 text-xs font-mono tracking-wider text-slate-400 hover:text-white border border-white/10 rounded"
              >
                Start again with a different username
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomFour;
