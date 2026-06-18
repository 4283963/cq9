import type { Borehole } from '../../shared/types.js';

export const INITIAL_BOREHOLES: Borehole[] = [
  {
    id: 'BH-001',
    name: '主钻孔 #1',
    depth: 520,
    x: 320,
    hasGas: true,
    gasPressure: 3.2,
    isPlugged: false,
    casingInstalled: false,
    cementFilled: 0,
    sealVerified: false,
    gasLeakLevel: 0,
  },
  {
    id: 'BH-002',
    name: '观测孔 #2',
    depth: 380,
    x: 620,
    hasGas: false,
    gasPressure: 0,
    isPlugged: false,
    casingInstalled: false,
    cementFilled: 0,
    sealVerified: false,
    gasLeakLevel: 0,
  },
];

export function getInitialBoreholes(): Borehole[] {
  return INITIAL_BOREHOLES.map(b => ({ ...b }));
}

export function findBorehole(boreholes: Borehole[], id: string): Borehole | undefined {
  return boreholes.find(b => b.id === id);
}
