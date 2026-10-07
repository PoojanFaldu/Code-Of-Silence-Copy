import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Subtle pulse under the currently active interactable only. */
export default function ActivePulse({
  position,
  visible,
}: {
  position: [number, number, number];
  visible: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const mat = mesh.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.12 + Math.sin(clock.elapsedTime * 2.2) * 0.06;
  });

  if (!visible) return null;

  return (
    <mesh ref={mesh} position={[position[0], position[1] - 0.02, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.12, 0.22, 28]} />
      <meshBasicMaterial color="#67e8f9" transparent opacity={0.18} depthWrite={false} />
    </mesh>
  );
}
