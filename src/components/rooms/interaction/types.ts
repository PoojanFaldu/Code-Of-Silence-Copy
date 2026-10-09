export type InteractTarget = {
  id: string;
  label: string;
  position: [number, number, number];
  active?: boolean;
  maxDistance?: number;
};

export type RoomObstacle = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type RoomBoundary = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  y: number;
  /** Solid AABBs the player cannot walk into (interior walls, furniture slabs). */
  obstacles?: RoomObstacle[];
};

export type FocusedInteractable = {
  id: string;
  label: string;
} | null;
