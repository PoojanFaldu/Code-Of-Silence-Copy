import { useCallback, useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { RoomBoundary, RoomObstacle } from "./types";

type FirstPersonControllerProps = {
  boundary: RoomBoundary;
  controlsEnabled?: boolean;
  moveSpeed?: number;
  mouseSensitivity?: number;
  onPositionUpdate?: (pos: number[]) => void;
};

const PITCH_LIMIT = 1.2; // ~70 degrees
const PLAYER_RADIUS = 0.14;

function hitsObstacle(x: number, z: number, obstacles: RoomObstacle[] | undefined) {
  if (!obstacles?.length) return false;
  return obstacles.some(
    (o) =>
      x + PLAYER_RADIUS > o.minX &&
      x - PLAYER_RADIUS < o.maxX &&
      z + PLAYER_RADIUS > o.minZ &&
      z - PLAYER_RADIUS < o.maxZ
  );
}

export default function FirstPersonController({
  boundary,
  controlsEnabled = true,
  moveSpeed = 0.018,
  mouseSensitivity = 0.002,
  onPositionUpdate,
}: FirstPersonControllerProps) {
  const { camera, gl } = useThree();
  const moveState = useRef({ forward: false, backward: false, left: false, right: false });
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const [isMouseLooking, setIsMouseLooking] = useState(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const yaw = useRef(0);
  const pitch = useRef(0);
  const boundaryRef = useRef(boundary);
  boundaryRef.current = boundary;

  useEffect(() => {
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
    yaw.current = e.y;
    pitch.current = e.x;
  }, [camera]);

  const resolveMove = useCallback((from: THREE.Vector3, delta: THREE.Vector3) => {
    const b = boundaryRef.current;
    const obstacles = b.obstacles;
    const next = from.clone();
    next.y = b.y;

    // Axis-separated collision so walls block without trapping the player
    const tryX = THREE.MathUtils.clamp(from.x + delta.x, b.minX, b.maxX);
    if (!hitsObstacle(tryX, from.z, obstacles)) {
      next.x = tryX;
    }

    const tryZ = THREE.MathUtils.clamp(from.z + delta.z, b.minZ, b.maxZ);
    if (!hitsObstacle(next.x, tryZ, obstacles)) {
      next.z = tryZ;
    }

    return next;
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!controlsEnabled) return;
      if (e.code === "KeyW" || e.code === "ArrowUp") moveState.current.forward = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") moveState.current.backward = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") moveState.current.left = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") moveState.current.right = true;
    },
    [controlsEnabled]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === "KeyW" || e.code === "ArrowUp") moveState.current.forward = false;
    if (e.code === "KeyS" || e.code === "ArrowDown") moveState.current.backward = false;
    if (e.code === "KeyA" || e.code === "ArrowLeft") moveState.current.left = false;
    if (e.code === "KeyD" || e.code === "ArrowRight") moveState.current.right = false;
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!controlsEnabled || e.button !== 0) return;
      setIsMouseLooking(true);
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
      gl.domElement.style.cursor = "none";
    },
    [gl, controlsEnabled]
  );

  const handleMouseUp = useCallback(() => {
    setIsMouseLooking(false);
    gl.domElement.style.cursor = "default";
  }, [gl]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isMouseLooking || !controlsEnabled) return;
      const dx = e.clientX - previousMousePosition.current.x;
      const dy = e.clientY - previousMousePosition.current.y;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };

      yaw.current -= dx * mouseSensitivity;
      pitch.current = THREE.MathUtils.clamp(
        pitch.current - dy * mouseSensitivity,
        -PITCH_LIMIT,
        PITCH_LIMIT
      );
      camera.rotation.order = "YXZ";
      camera.rotation.y = yaw.current;
      camera.rotation.x = pitch.current;
      camera.rotation.z = 0;
    },
    [camera, isMouseLooking, controlsEnabled, mouseSensitivity]
  );

  const handleMouseLeave = useCallback(() => {
    setIsMouseLooking(false);
    gl.domElement.style.cursor = "default";
  }, [gl]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    gl.domElement.addEventListener("mousedown", handleMouseDown);
    gl.domElement.addEventListener("mouseup", handleMouseUp);
    gl.domElement.addEventListener("mousemove", handleMouseMove);
    gl.domElement.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      gl.domElement.removeEventListener("mousedown", handleMouseDown);
      gl.domElement.removeEventListener("mouseup", handleMouseUp);
      gl.domElement.removeEventListener("mousemove", handleMouseMove);
      gl.domElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseDown, handleMouseUp, handleMouseMove, handleMouseLeave, gl]);

  useEffect(() => {
    if (!controlsEnabled) {
      moveState.current = { forward: false, backward: false, left: false, right: false };
      setIsMouseLooking(false);
      gl.domElement.style.cursor = "default";
    }
  }, [controlsEnabled, gl]);

  useFrame(() => {
    if (!controlsEnabled) return;
    velocity.current.set(0, 0, 0);
    direction.current.set(0, 0, 0);
    if (moveState.current.forward) direction.current.z -= 1;
    if (moveState.current.backward) direction.current.z += 1;
    if (moveState.current.left) direction.current.x -= 1;
    if (moveState.current.right) direction.current.x += 1;
    if (direction.current.length() > 0) direction.current.normalize();

    direction.current.applyEuler(new THREE.Euler(0, yaw.current, 0, "YXZ"));
    velocity.current.addScaledVector(direction.current, moveSpeed);

    const next = resolveMove(camera.position, velocity.current);
    camera.position.copy(next);
    onPositionUpdate?.([next.x, next.y, next.z]);
  });

  return null;
}
