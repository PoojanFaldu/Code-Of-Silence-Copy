import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { FocusedInteractable, InteractTarget } from "./types";

type FocusDetectorProps = {
  targets: InteractTarget[];
  enabled?: boolean;
  maxDistance?: number;
  maxAngleDeg?: number;
  onFocusChange: (focus: FocusedInteractable) => void;
  onInteract: (id: string) => void;
};

const DEFAULT_MAX_DISTANCE = 2.4;
const DEFAULT_MAX_ANGLE_DEG = 12;

export default function FocusDetector({
  targets,
  enabled = true,
  maxDistance = DEFAULT_MAX_DISTANCE,
  maxAngleDeg = DEFAULT_MAX_ANGLE_DEG,
  onFocusChange,
  onInteract,
}: FocusDetectorProps) {
  const { camera } = useThree();
  const focusedIdRef = useRef<string | null>(null);
  const targetsRef = useRef(targets);
  const onFocusChangeRef = useRef(onFocusChange);
  const onInteractRef = useRef(onInteract);
  const enabledRef = useRef(enabled);

  targetsRef.current = targets;
  onFocusChangeRef.current = onFocusChange;
  onInteractRef.current = onInteract;
  enabledRef.current = enabled;

  const lookDir = useRef(new THREE.Vector3());
  const toTarget = useRef(new THREE.Vector3());
  const targetPos = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!enabledRef.current) {
      if (focusedIdRef.current !== null) {
        focusedIdRef.current = null;
        onFocusChangeRef.current(null);
      }
      return;
    }

    camera.getWorldDirection(lookDir.current);
    const maxAngleRad = (maxAngleDeg * Math.PI) / 180;

    let best: { id: string; label: string; score: number } | null = null;

    for (const target of targetsRef.current) {
      if (target.active === false) continue;
      targetPos.current.set(...target.position);
      const dist = camera.position.distanceTo(targetPos.current);
      const limit = target.maxDistance ?? maxDistance;
      if (dist > limit) continue;

      toTarget.current.copy(targetPos.current).sub(camera.position).normalize();
      const dot = THREE.MathUtils.clamp(lookDir.current.dot(toTarget.current), -1, 1);
      const angle = Math.acos(dot);
      if (angle > maxAngleRad) continue;

      // Prefer closer + more centered
      const score = dist + angle * 2;
      if (!best || score < best.score) {
        best = { id: target.id, label: target.label, score };
      }
    }

    const nextId = best?.id ?? null;
    if (nextId !== focusedIdRef.current) {
      focusedIdRef.current = nextId;
      onFocusChangeRef.current(best ? { id: best.id, label: best.label } : null);
    }
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!enabledRef.current) return;
      if (e.code !== "KeyE" && e.key.toLowerCase() !== "e") return;
      if (e.repeat) return;
      const id = focusedIdRef.current;
      if (id) {
        e.preventDefault();
        onInteractRef.current(id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
