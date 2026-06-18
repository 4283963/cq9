export const SCENE_WIDTH = 900;
export const SCENE_HEIGHT = 720;

export const GROUND_Y = 80;
export const MAX_DEPTH = 600;
export const CASING_TOP_OFFSET = 10;

export const BOREHOLE_WIDTH = 40;
export const CASING_THICKNESS = 8;

export function getCasingTop(): number {
  return GROUND_Y - CASING_TOP_OFFSET;
}

export function getCasingBottom(depthMeters: number): number {
  return GROUND_Y + (depthMeters / 600) * MAX_DEPTH;
}

export function getInnerTop(): number {
  return getCasingTop() + CASING_THICKNESS;
}

export function getInnerBottom(depthMeters: number): number {
  return getCasingBottom(depthMeters) - CASING_THICKNESS;
}

export function getInnerHalfWidth(): number {
  return BOREHOLE_WIDTH / 2 - CASING_THICKNESS;
}

export const STRATA_LAYERS = [
  { name: '表土层',   top: 0,   bottom: 120, color: 0x8b6914, noise: 0.3 },
  { name: '砂岩',     top: 120, bottom: 260, color: 0xb07d3b, noise: 0.25 },
  { name: '页岩',     top: 260, bottom: 380, color: 0x4a3728, noise: 0.2 },
  { name: '煤层',     top: 380, bottom: 500, color: 0x1a1212, noise: 0.35 },
  { name: '石灰岩',   top: 500, bottom: 600, color: 0x6b7280, noise: 0.15 },
];

export const COLORS = {
  background: 0x0e1116,
  ground: 0x5c4033,
  casing: 0x71717a,
  casingDark: 0x3f3f46,
  casingHi: 0xa1a1aa,
  gas: 0x2dd4bf,
  gasGlow: 0x5eead4,
  cement: 0xcbd5e1,
  cementTop: 0xe2e8f0,
  text: 0xe2e8f0,
  grid: 0x1f2937,
  selectedGlow: 0xf5a524,
  seal: 0xf59e0b,
};
