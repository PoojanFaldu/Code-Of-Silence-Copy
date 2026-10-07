import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface RoomTwo3DObjectsProps {
  onOpenBlueFolder: () => void;
  onOpenLogicGates: () => void;
  onOpenCablePatching: () => void;
  isLogicSolved: boolean;
  isMonitorRestored: boolean;
}

export const RoomTwo3DObjects: React.FC<RoomTwo3DObjectsProps> = ({
  onOpenBlueFolder,
  onOpenLogicGates,
  onOpenCablePatching,
  isLogicSolved,
  isMonitorRestored,
}) => {
  const [hoverFolder, setHoverFolder] = useState(false);
  const [hoverLogic, setHoverLogic] = useState(false);
  const [hoverMonitor, setHoverMonitor] = useState(false);

  // References for subtle 3D hover/pulse animations
  const folderRef = useRef<THREE.Group>(null);
  const logicRef = useRef<THREE.Group>(null);
  const monitorRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (folderRef.current) {
      folderRef.current.position.y = 2.58 + Math.sin(t * 2) * 0.01;
    }
    if (logicRef.current) {
      logicRef.current.position.y = 2.62 + Math.sin(t * 2.5) * 0.01;
    }
    if (monitorRef.current) {
      monitorRef.current.position.y = 3.35 + Math.sin(t * 1.8) * 0.01;
    }
  });

  return (
    <group>
      {/* ========================================================
          1. 3D BLUE FOLDER (Dr. Verma's Reference to Lab System)
         ======================================================== */}
      <group
        ref={folderRef}
        position={[-1.55, 2.58, 4.0]}
        rotation={[0, 1.4, 0]}
        scale={hoverFolder ? 1.08 : 1.0}
        onClick={(e) => {
          e.stopPropagation();
          onOpenBlueFolder();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoverFolder(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoverFolder(false);
          document.body.style.cursor = "default";
        }}
      >
        {/* Blue Folder Binder Mesh */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.025, 0.55]} />
          <meshStandardMaterial color="#1e40af" roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Inner white sheets */}
        <mesh position={[0, 0.018, 0]}>
          <boxGeometry args={[0.39, 0.015, 0.52]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
        {/* Sticky Note on top */}
        <mesh position={[0.08, 0.027, 0.08]}>
          <boxGeometry args={[0.15, 0.005, 0.15]} />
          <meshStandardMaterial color="#fef08a" roughness={0.7} />
        </mesh>

        {/* 3D Floating Interactive Tag */}
        <Html
          position={[0, 0.35, 0]}
          center
          distanceFactor={6}
          style={{ pointerEvents: "auto", userSelect: "none" }}
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onOpenBlueFolder();
            }}
            className={`cursor-pointer px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-xl whitespace-nowrap ${
              hoverFolder 
                ? "bg-blue-600 text-white border-blue-300 scale-110 shadow-blue-500/50" 
                : "bg-blue-950/85 text-blue-200 border-blue-500/40 backdrop-blur-sm"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            📁 DR. VERMA'S BLUE FOLDER
          </div>
        </Html>
      </group>

      {/* ========================================================
          2. 3D WORKSTATION TERMINAL (Puzzle 3: Logic Gates Panel)
         ======================================================== */}
      <group
        ref={logicRef}
        position={[-1.5, 2.62, 5.2]}
        rotation={[0, 1.57, 0]}
        scale={hoverLogic ? 1.05 : 1.0}
        onClick={(e) => {
          e.stopPropagation();
          onOpenLogicGates();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoverLogic(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoverLogic(false);
          document.body.style.cursor = "default";
        }}
      >
        {/* Workstation Console Base Chassis */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.08, 0.5]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Angled Control Panel Display Screen */}
        <mesh position={[0, 0.1, -0.1]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.55, 0.25, 0.03]} />
          <meshStandardMaterial 
            color={isLogicSolved ? "#064e3b" : "#082f49"} 
            emissive={isLogicSolved ? "#10b981" : "#0284c7"}
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>
        {/* Toggle switches and LEDs */}
        <mesh position={[-0.18, 0.05, 0.12]}>
          <cylinderGeometry args={[0.015, 0.015, 0.04, 16]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[-0.06, 0.05, 0.12]}>
          <cylinderGeometry args={[0.015, 0.015, 0.04, 16]} />
          <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.06, 0.05, 0.12]}>
          <cylinderGeometry args={[0.015, 0.015, 0.04, 16]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.18, 0.05, 0.12]}>
          <cylinderGeometry args={[0.015, 0.015, 0.04, 16]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.8} />
        </mesh>

        {/* 3D Floating Interactive Tag */}
        <Html
          position={[0, 0.5, 0]}
          center
          distanceFactor={6}
          style={{ pointerEvents: "auto", userSelect: "none" }}
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onOpenLogicGates();
            }}
            className={`cursor-pointer px-3.5 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-xl whitespace-nowrap ${
              isLogicSolved
                ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-emerald-500/30"
                : hoverLogic
                ? "bg-cyan-600 text-white border-cyan-300 scale-110 shadow-cyan-500/50"
                : "bg-cyan-950/85 text-cyan-200 border-cyan-500/40 backdrop-blur-sm"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              isLogicSolved ? "bg-emerald-400" : "bg-cyan-400 animate-pulse"
            }`} />
            {isLogicSolved ? "✓ WORKSTATION TERMINAL [UNLOCKED]" : "⚡ WORKSTATION • LOGIC GATES (PUZZLE 3)"}
          </div>
        </Html>
      </group>

      {/* ========================================================
          3. 3D LAB MONITOR (Puzzle 4: Monitor Cable Patching)
         ======================================================== */}
      <group
        ref={monitorRef}
        position={[-1.48, 3.35, 6.4]}
        rotation={[0, 1.57, 0]}
        scale={hoverMonitor ? 1.05 : 1.0}
        onClick={(e) => {
          e.stopPropagation();
          onOpenCablePatching();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoverMonitor(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoverMonitor(false);
          document.body.style.cursor = "default";
        }}
      >
        {/* Monitor Bezel Frame */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.6, 0.08]} />
          <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Monitor Screen Glass */}
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[0.82, 0.52]} />
          <meshStandardMaterial 
            color={isMonitorRestored ? "#0f172a" : "#450a0a"}
            emissive={isMonitorRestored ? "#059669" : "#dc2626"}
            emissiveIntensity={isMonitorRestored ? 0.3 : 0.8}
            roughness={0.1}
          />
        </mesh>
        {/* Stand / Wall arm */}
        <mesh position={[0, -0.4, -0.1]}>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} />
        </mesh>
        {/* Trailing patch cables */}
        <mesh position={[0.2, -0.3, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.4, 8]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[-0.2, -0.3, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.4, 8]} />
          <meshStandardMaterial color="#06b6d4" />
        </mesh>

        {/* 3D Floating Interactive Tag */}
        <Html
          position={[0, 0.55, 0]}
          center
          distanceFactor={6}
          style={{ pointerEvents: "auto", userSelect: "none" }}
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onOpenCablePatching();
            }}
            className={`cursor-pointer px-3.5 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-xl whitespace-nowrap ${
              isMonitorRestored
                ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-emerald-500/30"
                : hoverMonitor
                ? "bg-rose-600 text-white border-rose-300 scale-110 shadow-rose-500/50"
                : "bg-rose-950/85 text-rose-200 border-rose-500/40 backdrop-blur-sm animate-pulse"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              isMonitorRestored ? "bg-emerald-400" : "bg-rose-500 animate-ping"
            }`} />
            {isMonitorRestored 
              ? "✓ CCTV RESTORED [ARCHIVE AVAILABLE]" 
              : "📺 LAB MONITOR: [!] SIGNAL LOST (PUZZLE 4)"}
          </div>
        </Html>
      </group>
    </group>
  );
};
