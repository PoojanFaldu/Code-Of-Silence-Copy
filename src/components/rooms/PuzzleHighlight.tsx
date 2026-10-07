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

/** Temporary always-on beacon + clickable label so puzzles are easy to find. */
export default function PuzzleHighlight({
  position,
  label,
  color = "#22d3ee",
  visible = true,
  onClick,
}: PuzzleHighlightProps) {
  const ring = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ring.current) {
      ring.current.rotation.z = t * 1.5;
      const s = 1 + Math.sin(t * 3) * 0.15;
      ring.current.scale.set(s, s, s);
    }
    if (beam.current) {
      const mat = beam.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.8 + Math.sin(t * 4) * 0.4;
    }
  });

  if (!visible) return null;

  return (
    <group position={position}>
      <mesh ref={beam} position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.04, 0.08, 1.8, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
          transparent
          opacity={0.55}
        />
      </mesh>

      <mesh ref={ring} position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.035, 12, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>

      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={2.5} />
      </mesh>

      <pointLight position={[0, 1.2, 0]} intensity={2.2} color={color} distance={4} />

      <Html center distanceFactor={6} position={[0, 2.15, 0]} style={{ pointerEvents: "auto" }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          style={{
            whiteSpace: "nowrap",
            borderRadius: 10,
            border: `2px solid ${color}`,
            background: "rgba(0,0,0,0.88)",
            color: "#fff",
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.04em",
            boxShadow: `0 0 24px ${color}`,
            cursor: "pointer",
            animation: "puzzlePulse 1.2s ease-in-out infinite",
          }}
        >
          ★ {label}
        </button>
        <style>{`
          @keyframes puzzlePulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.06); opacity: 0.92; }
          }
        `}</style>
      </Html>
    </group>
  );
}
