import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RoomThree3DObjectsProps {
  isHashSolved: boolean;
  isOverlaySolved: boolean;
}

/** Quiet in-world props — discovery via crosshair + E, no glow labels. */
export const RoomThree3DObjects: React.FC<RoomThree3DObjectsProps> = ({
  isHashSolved,
  isOverlaySolved,
}) => {
  const notebookRef = useRef<THREE.Group>(null);
  const lightboxRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (notebookRef.current) {
      notebookRef.current.position.y = 2.73 + Math.sin(t * 1.8) * 0.002;
    }
    if (lightboxRef.current) {
      lightboxRef.current.position.y = 2.52 + Math.sin(t * 1.6) * 0.002;
    }
  });

  return (
    <group>
      {/* Verma's notebook on the bed */}
      <group ref={notebookRef} position={[-1.25, 2.73, 4.0]} rotation={[0, 1.5, 0]}>
        <mesh position={[0, 0.012, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.024, 0.34]} />
          <meshStandardMaterial color="#451a03" roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.24, 0.016, 0.32]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.7} />
        </mesh>
        <mesh position={[0.02, 0.029, 0.06]}>
          <boxGeometry args={[0.03, 0.003, 0.22]} />
          <meshStandardMaterial color="#d97706" roughness={0.3} metalness={0.3} />
        </mesh>
      </group>

      {/* Case dossier near the notebook */}
      <group position={[-0.95, 2.72, 4.15]} rotation={[0, 0.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.012, 0.24]} />
          <meshStandardMaterial color="#334155" roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.008, -0.01]}>
          <boxGeometry args={[0.16, 0.004, 0.2]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
      </group>

      {/* Hash terminal on arcade screen — muted */}
      <group position={[1.72, 3.02, 3.32]} rotation={[0, -Math.PI / 2, 0.16]}>
        <mesh position={[0, 0, -0.005]} castShadow>
          <planeGeometry args={[0.54, 0.4]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[0.5, 0.36]} />
          <meshStandardMaterial color={isHashSolved ? "#064e3b" : "#0c4a6e"} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.15, 0.008]}>
          <planeGeometry args={[0.48, 0.03]} />
          <meshStandardMaterial color="#082f49" roughness={0.2} />
        </mesh>
      </group>

      {/* Overlay lightbox on table — muted */}
      <group ref={lightboxRef} position={[-0.1, 2.52, 4.2]} rotation={[0, 0.05, 0]}>
        <mesh position={[0, 0.01, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.36, 0.02, 0.26]} />
          <meshStandardMaterial color="#1e1e2f" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.32, 0.22]} />
          <meshStandardMaterial
            color={isOverlaySolved ? "#92400e" : "#312e81"}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0.01, 0.023, 0.005]} rotation={[-Math.PI / 2, 0, 0.04]}>
          <planeGeometry args={[0.28, 0.18]} />
          <meshStandardMaterial color="#64748b" transparent opacity={0.45} roughness={0.15} />
        </mesh>
      </group>
    </group>
  );
};

/** World positions used by FocusDetector */
export const ROOM3_TARGET_POSITIONS = {
  notebook: [-1.25, 2.73, 4.0] as [number, number, number],
  dossier: [-0.95, 2.72, 4.15] as [number, number, number],
  hash: [1.72, 3.02, 3.32] as [number, number, number],
  overlay: [-0.1, 2.55, 4.2] as [number, number, number],
};
