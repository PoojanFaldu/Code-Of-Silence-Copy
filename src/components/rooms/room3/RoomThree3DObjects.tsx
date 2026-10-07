import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { BookOpen, Fingerprint, Layers, CheckCircle2 } from "lucide-react";

interface RoomThree3DObjectsProps {
  onOpenNotebook: () => void;
  onOpenHashPuzzle: () => void;
  onOpenOverlayPuzzle: () => void;
  isHashSolved: boolean;
  isOverlaySolved: boolean;
  hideHtmlTags?: boolean;
}

export const RoomThree3DObjects: React.FC<RoomThree3DObjectsProps> = ({
  onOpenNotebook,
  onOpenHashPuzzle,
  onOpenOverlayPuzzle,
  isHashSolved,
  isOverlaySolved,
  hideHtmlTags = false,
}) => {
  const [hoverNotebook, setHoverNotebook] = useState(false);
  const [hoverTerminal, setHoverTerminal] = useState(false);
  const [hoverOverlay, setHoverOverlay] = useState(false);

  const notebookRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Group>(null);
  const lightboxRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (notebookRef.current) {
      notebookRef.current.position.y = 2.73 + Math.sin(t * 1.8) * 0.003;
    }
    if (lightboxRef.current) {
      lightboxRef.current.position.y = 2.52 + Math.sin(t * 1.6) * 0.003;
    }
  });

  return (
    <group>
      {/* ========================================================
          1. DR. VERMA'S NOTEBOOK — PLACED ON THE BED
          (Replacing the previous code paper on the bed)
         ======================================================== */}
      <group
        ref={notebookRef}
        position={[-1.25, 2.73, 4.0]}
        rotation={[0, 1.5, 0]}
        scale={hoverNotebook ? 1.08 : 1.0}
        onClick={(e) => {
          e.stopPropagation();
          onOpenNotebook();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoverNotebook(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoverNotebook(false);
          document.body.style.cursor = "default";
        }}
      >
        {/* Leather Notebook Cover on Bed */}
        <mesh position={[0, 0.012, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.024, 0.34]} />
          <meshStandardMaterial color="#451a03" roughness={0.5} metalness={0.1} />
        </mesh>
        {/* Paper Pages Edges */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.24, 0.016, 0.32]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.7} />
        </mesh>
        {/* Gold Ribbon Bookmark */}
        <mesh position={[0.02, 0.029, 0.06]}>
          <boxGeometry args={[0.03, 0.003, 0.22]} />
          <meshStandardMaterial color="#d97706" roughness={0.3} metalness={0.3} />
        </mesh>

        {/* 3D Floating Tag over Bed */}
        {!hideHtmlTags && (
          <Html
            position={[0, 0.25, 0]}
            center
            distanceFactor={9}
            zIndexRange={[10, 20]}
            style={{ pointerEvents: "auto", userSelect: "none" }}
          >
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onOpenNotebook();
              }}
              className={`cursor-pointer px-2.5 py-1 rounded-full border font-mono text-[10px] font-bold transition-all flex items-center gap-1.5 shadow-xl whitespace-nowrap ${
                hoverNotebook 
                  ? "bg-amber-600 text-black border-amber-300 scale-105 shadow-amber-500/50" 
                  : "bg-amber-950/90 text-amber-200 border-amber-500/40 backdrop-blur-sm"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>Verma's Notebook</span>
            </div>
          </Html>
        )}
      </group>

      {/* ========================================================
          2. PUZZLE 5: HASH VERIFICATION — PLACED ON THE ARCADE SCREEN
          (Integrated onto the screen of the Blue Arcade Cabinet)
         ======================================================== */}
      <group
        ref={screenRef}
        position={[1.72, 3.02, 3.32]}
        rotation={[0, -Math.PI / 2, 0.16]}
        onClick={(e) => {
          e.stopPropagation();
          onOpenHashPuzzle();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoverTerminal(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoverTerminal(false);
          document.body.style.cursor = "default";
        }}
      >
        {/* Screen Frame Bezel on Cabinet */}
        <mesh position={[0, 0, -0.005]} castShadow>
          <planeGeometry args={[0.54, 0.40]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.5} />
        </mesh>

        {/* Glowing Active CRT / Terminal Screen Face */}
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[0.50, 0.36]} />
          <meshStandardMaterial 
            color={isHashSolved ? "#059669" : hoverTerminal ? "#22d3ee" : "#0891b2"} 
            emissive={isHashSolved ? "#10b981" : hoverTerminal ? "#06b6d4" : "#0284c7"} 
            emissiveIntensity={hoverTerminal ? 0.9 : 0.65} 
            roughness={0.2} 
          />
        </mesh>

        {/* Top Terminal Status Header Bar */}
        <mesh position={[0, 0.15, 0.008]}>
          <planeGeometry args={[0.48, 0.03]} />
          <meshStandardMaterial color="#082f49" roughness={0.2} />
        </mesh>

        {/* Pulsing Status Light */}
        <mesh position={[0.22, 0.15, 0.012]}>
          <circleGeometry args={[0.01, 16]} />
          <meshStandardMaterial 
            color={isHashSolved ? "#34d399" : "#38bdf8"} 
            emissive={isHashSolved ? "#34d399" : "#38bdf8"} 
            emissiveIntensity={1.5} 
          />
        </mesh>

        {/* 3D Floating Tag in front of the Arcade Screen */}
        {!hideHtmlTags && (
          <Html
            position={[0, 0.32, 0.08]}
            center
            distanceFactor={9}
            zIndexRange={[10, 20]}
            style={{ pointerEvents: "auto", userSelect: "none" }}
          >
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onOpenHashPuzzle();
              }}
              className={`cursor-pointer px-2.5 py-1 rounded-full border font-mono text-[10px] font-bold transition-all flex items-center gap-1.5 shadow-xl whitespace-nowrap ${
                isHashSolved
                  ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/50"
                  : hoverTerminal
                  ? "bg-cyan-500 text-black border-cyan-300 scale-105 shadow-cyan-500/50"
                  : "bg-cyan-950/90 text-cyan-200 border-cyan-500/40 backdrop-blur-sm"
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5 text-cyan-300" />
              <span>Puzzle 5: Hash Verification</span>
              {isHashSolved && (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              )}
            </div>
          </Html>
        )}
      </group>

      {/* ========================================================
          3. PUZZLE 6: OVERLAY MASK — PLACED ON THE TABLE
          (Horizontal drafting lightbox resting on the center table)
         ======================================================== */}
      <group
        ref={lightboxRef}
        position={[-0.1, 2.52, 4.2]}
        rotation={[0, 0.05, 0]}
        scale={hoverOverlay ? 1.05 : 1.0}
        onClick={(e) => {
          e.stopPropagation();
          onOpenOverlayPuzzle();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoverOverlay(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoverOverlay(false);
          document.body.style.cursor = "default";
        }}
      >
        {/* Horizontal Lightbox Drafting Frame Base */}
        <mesh position={[0, 0.01, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.36, 0.02, 0.26]} />
          <meshStandardMaterial color="#1e1e2f" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Backlit Horizontal Glass Pane (Lying flat on the table) */}
        <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.32, 0.22]} />
          <meshStandardMaterial 
            color={isOverlaySolved ? "#f59e0b" : "#818cf8"} 
            emissive={isOverlaySolved ? "#d97706" : "#6366f1"} 
            emissiveIntensity={0.55} 
            roughness={0.1} 
          />
        </mesh>

        {/* Transparent Acetate Stencil Sheet on the Lightbox */}
        <mesh position={[0.01, 0.023, 0.005]} rotation={[-Math.PI / 2, 0, 0.04]}>
          <planeGeometry args={[0.28, 0.18]} />
          <meshStandardMaterial 
            color="#38bdf8" 
            transparent 
            opacity={0.65} 
            roughness={0.1} 
          />
        </mesh>

        {/* 3D Floating Tag over the Table */}
        {!hideHtmlTags && (
          <Html
            position={[0, 0.22, 0]}
            center
            distanceFactor={9}
            zIndexRange={[10, 20]}
            style={{ pointerEvents: "auto", userSelect: "none" }}
          >
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onOpenOverlayPuzzle();
              }}
              className={`cursor-pointer px-2.5 py-1 rounded-full border font-mono text-[10px] font-bold transition-all flex items-center gap-1.5 shadow-xl whitespace-nowrap ${
                isOverlaySolved
                  ? "bg-amber-950/90 text-amber-200 border-amber-500/60"
                  : hoverOverlay
                  ? "bg-indigo-600 text-white border-indigo-300 scale-105 shadow-indigo-500/50"
                  : "bg-indigo-950/90 text-indigo-200 border-indigo-500/40 backdrop-blur-sm"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-300" />
              <span>Puzzle 6: Overlay Mask</span>
              {isOverlaySolved && (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              )}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};
