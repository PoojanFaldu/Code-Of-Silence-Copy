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
import { loadRunSession, setServerRoomProgress } from "@/lib/runSession";

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

function isRohanAccusation(raw: string) {
  const s = normalizeAccusation(raw);
  return s === "rohan" || s === "desai" || s === "rohan desai" || s === "desai rohan";
}

function isSameerAccusation(raw: string) {
  const s = normalizeAccusation(raw);
  return s === "sameer" || s === "shah" || s === "sameer shah" || s === "shah sameer";
}

const SUSPECT_CHOICES = [
  "Dr. Arjun Mehta",
  "Neha Rao",
  "Karan Patel",
  "Rohan Desai",
  "Dr. Sameer Shah",
] as const;

const RoomFour = () => {
  const { penalizeWrongAccusation, timeRemaining } = useGame();
  const savedServer = loadRunSession().rooms.server;
  const [showSession, setShowSession] = useState(false);
  const [sessionDone, setSessionDone] = useState(() => savedServer.sessionDone);
  const [uvEnabled, setUvEnabled] = useState(() => savedServer.uvEnabled);
  const [showUvClue, setShowUvClue] = useState(false);
  const [showWires, setShowWires] = useState(false);
  const [wiresDone, setWiresDone] = useState(() => savedServer.wiresDone);
  const [showMonitor, setShowMonitor] = useState(false);
  const [cctvUnlocked, setCctvUnlocked] = useState(() => savedServer.cctvUnlocked);
  const [showFinalQuestion, setShowFinalQuestion] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [accusation, setAccusation] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [focused, setFocused] = useState<FocusedInteractable>(null);
  const [step, setStepState] = useState<Step>(() => {
    return Math.min(4, Math.max(0, savedServer.step)) as Step;
  });
  const setStep = (next: Step) => {
    setStepState(next);
    setServerRoomProgress({ step: next });
  };

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
      setServerRoomProgress({ uvEnabled: true, step: 2 });
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
      setAnswerError("Neha Rao was investigating after the fact.\nTry again.");
      return;
    }
    if (isKaranAccusation(accusation)) {
      setAnswerError("Technical access alone does not prove the murder.\nTry again.");
      return;
    }
    if (isRohanAccusation(accusation)) {
      setAnswerError("Security admin work does not connect him to the murder.\nTry again.");
      return;
    }
    if (isSameerAccusation(accusation)) {
      setAnswerError(
        "Sameer had a motive, but the evidence does not connect him to the murder.\nTry again."
      );
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
            setServerRoomProgress({ sessionDone: true, step: 1 });
          }}
        />
      )}

      {showUvClue && !showWires && !showMonitor && !showFinalQuestion && !gameWon && (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#12081c] border border-purple-500/40 p-6 rounded-xl max-w-md w-full space-y-4 my-4">
            <h2 className="text-lg text-purple-200 font-semibold tracking-widest">UV ARCHIVE</h2>

            <div className="rounded-lg border border-purple-500/25 bg-black/50 px-3 py-3 font-serif text-xs italic text-purple-50/90 leading-relaxed space-y-2">
              <p className="font-mono not-italic text-[10px] tracking-widest text-purple-300/70">
                FINAL NOTE — Professor Dev Verma
              </p>
              <p>&quot;Someone has been changing the research records.</p>
              <p>I know where the discrepancy began.</p>
              <p>I need to speak with them before this goes any further.&quot;</p>
            </div>

            <div className="space-y-2 font-mono text-[11px] text-slate-300 leading-relaxed">
              <p className="text-[10px] uppercase tracking-widest text-purple-300/80">
                Five threads — review
              </p>
              {(
                [
                  {
                    name: "Dr. Arjun Mehta — Research",
                    body: "Assigned to Experiment 17. The recorded result does not match the original research notes. Verma had been reviewing the discrepancy. His name appears repeatedly in the research records surrounding the discrepancy.",
                  },
                  {
                    name: "Neha Rao — Investigation",
                    body: "Neha accessed Verma's research records while looking into the discrepancy. Her activity suggests she was investigating the records rather than creating them.",
                  },
                  {
                    name: "Karan Patel — Security / Access",
                    body: "Karan had restricted technical access to the laboratory's network equipment. His badge was recovered near the Network Room.",
                  },
                  {
                    name: "Rohan Desai — Surveillance",
                    body: "Rohan was responsible for the laboratory's security systems and CCTV. His administrative access gave him the ability to interact with security infrastructure.",
                  },
                  {
                    name: "Dr. Sameer Shah — Conflict",
                    body: "Sameer had a serious professional dispute with Professor Dev Verma over publication credit. Verma's notes indicate that the disagreement had become increasingly difficult. A recovered message from Sameer refers to the research being published without his name.",
                  },
                ] as const
              ).map((card) => (
                <div
                  key={card.name}
                  className="rounded-md border border-purple-500/20 bg-black/40 px-3 py-2 space-y-1"
                >
                  <p className="text-purple-100">{card.name}</p>
                  <p className="text-slate-400">{card.body}</p>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Restore the relay, then the wall monitor.
            </p>

            <button
              onClick={() => {
                completeTask("uv");
                unlockLog("uv_archive");
                setInvestigationState({ arjunEvidenceFound: true, finalUnlocked: true });
                setShowUvClue(false);
                setStep(3);
                setServerRoomProgress({ step: 3 });
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
            setServerRoomProgress({ wiresDone: true, step: 4 });
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
            setServerRoomProgress({ cctvUnlocked: true });
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

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 text-center">
                Select a suspect
              </p>
              {SUSPECT_CHOICES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setAccusation(name);
                    setAnswerError("");
                  }}
                  className={`w-full rounded border px-3 py-2.5 font-mono text-xs tracking-wider text-left transition ${
                    accusation === name
                      ? "border-red-500/50 bg-red-950/40 text-white"
                      : "border-white/15 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

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
                placeholder="Or type the name"
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
                Dr. Arjun Mehta altered Experiment 17. Professor Dev Verma discovered it and meant
                to confront him that night.
              </p>
              <p>
                Neha Rao, Karan Patel, Rohan Desai, and Dr. Sameer Shah each looked suspicious for
                different reasons — but the evidence did not connect them to the murder.
              </p>
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
