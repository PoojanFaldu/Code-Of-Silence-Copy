export type InteractTarget = {
  id: string;
  label: string;
  position: [number, number, number];
  active?: boolean;
  maxDistance?: number;
};

export type RoomBoundary = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  y: number;
};

export type FocusedInteractable = {
  id: string;
  label: string;
} | null;
