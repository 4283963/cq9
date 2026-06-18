export type OperationType =
  | 'detect_gas'
  | 'install_casing'
  | 'plug'
  | 'inject_cement'
  | 'verify_seal';

export interface OperationRecord {
  id: number;
  sessionId: string;
  operation: OperationType;
  boreholeId: string;
  scoreDelta: number;
  correct: boolean;
  message: string;
  timestamp: string;
}

export interface DrillSession {
  sessionId: string;
  operator: string;
  startedAt: string;
  finishedAt: string | null;
  totalScore: number;
  grade: string;
}

export interface OperationResponse {
  ok: boolean;
  scoreDelta: number;
  correct: boolean;
  message: string;
  totalScore: number;
  sealed: boolean;
}

export interface Borehole {
  id: string;
  name: string;
  depth: number;
  x: number;
  hasGas: boolean;
  gasPressure: number;
  isPlugged: boolean;
  casingInstalled: boolean;
  cementFilled: number;
  sealVerified: boolean;
}

export interface DrillSceneState {
  boreholes: Borehole[];
  selectedBoreholeId: string | null;
  gasEmissionActive: boolean;
  gasIntensity: number;
}

export interface SessionDetail extends DrillSession {
  operations: OperationRecord[];
}
