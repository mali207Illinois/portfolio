export const PALETTE = {
  void: '#070908',
  bone: '#d5d0c4',
  warm: '#b87342',
} as const;

export const CAMERA = {
  desktop: { distance: 12.3, elevation: 3.4, yaw: 0, fov: 43 },
  mobile: { distance: 16.3, elevation: 3.8, yaw: 0, fov: 44 },
} as const;

// This foundation explores only the exterior. Later chapters can map further
// ranges of the same normalized 0–1 signal to mechanical and camera actions.
export const EXTERIOR_CAMERA_TRAVEL = {
  distance: -0.18,
  elevation: 0.04,
} as const;
