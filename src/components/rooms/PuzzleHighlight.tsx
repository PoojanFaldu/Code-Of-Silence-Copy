import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface PuzzleHighlightProps {
  position: [number, number, number];
  label: string;
  color?: string;
  visible?: boolean;
  onClick?: () => void;
}

/** Soft local glow + small label — sits on/near the prop, no floating beacon. */
export default function PuzzleHighlight({
  position,
  label,
  color = "#22d3ee",
  visible = true,
  onClick,
}: PuzzleHighlightProps) {
  const glow = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!glow.current) return;
    const mat = glow.current.material as THREE.MeshStandardMaterial;
    mat.opacity = 0.18 + Math.sin(clock.elapsedTime * 1.6) * 0.06;
    mat.emissiveIntensity = 0.35 + Math.sin(clock.elapsedTime * 1.6) * 0.12;
  });

  if (!visible) return null;

  return (
    <group position={position}>
      <mesh ref={glow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.22, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>
      <pointLight position={[0, 0.15, 0]} intensity={0.35} color={color} distance={1.1} decay={2} />

      <Html center distanceFactor={5} position={[0, 0.32, 0]} style={{ pointerEvents: "auto" }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          style={{
            whiteSpace: "nowrap",
            borderRadius: 6,
            border: `1px solid ${color}88`,
            background: "rgba(8,12,18,0.82)",
            color: "#e2e8f0",
            padding: "5px 10px",
            fontSize: 11,
            fontWeight: 560,
            letterSpacing: "0.03em",
            boxShadow: `0 0 10px ${color}33`,
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      </Html>
    </group>
  );
}
