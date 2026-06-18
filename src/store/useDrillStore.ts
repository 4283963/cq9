import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type {
  DrillSession,
  Borehole,
  OperationRecord,
  OperationType,
  OperationResponse,
  SessionDetail,
  DrillSceneState,
} from 'shared/types';
import * as api from '../services/apiClient';

export interface OperationLogEntry extends OperationRecord {}

interface DrillState {
  session: DrillSession | null;
  boreholes: Borehole[];
  selectedBoreholeId: string | null;
  totalScore: number;
  operations: OperationLogEntry[];
  isFinished: boolean;
  loading: boolean;
  error: string | null;
  startTime: number | null;
  elapsedSeconds: number;
  sealDeadlineSeconds: number;
  pollInterval: number | null;

  startSession: (operator: string) => Promise<void>;
  submitOperation: (operation: OperationType) => Promise<OperationResponse | null>;
  finishSession: () => Promise<SessionDetail | null>;
  selectBorehole: (id: string | null) => void;
  loadSession: (sessionId: string) => Promise<void>;
  reset: () => void;
  tickTimer: () => void;
  refreshBoreholes: () => Promise<void>;
}

const INITIAL_BOREHOLES: Borehole[] = [
  {
    id: 'BH-001', name: '主钻孔 #1', depth: 520, x: 320,
    hasGas: true, gasPressure: 3.2,
    isPlugged: false, casingInstalled: false, cementFilled: 0, sealVerified: false,
    gasLeakLevel: 0,
  },
  {
    id: 'BH-002', name: '观测孔 #2', depth: 380, x: 620,
    hasGas: false, gasPressure: 0,
    isPlugged: false, casingInstalled: false, cementFilled: 0, sealVerified: false,
    gasLeakLevel: 0,
  },
];

export const useDrillStore = create<DrillState>((set, get) => ({
  session: null,
  boreholes: INITIAL_BOREHOLES,
  selectedBoreholeId: null,
  totalScore: 0,
  operations: [],
  isFinished: false,
  loading: false,
  error: null,
  startTime: null,
  elapsedSeconds: 0,
  sealDeadlineSeconds: 30,
  pollInterval: null,

  startSession: async (operator: string) => {
    set({ loading: true, error: null });
    try {
      const session = await api.createSession(operator);
      const boreholes = await api.getBoreholes(session.sessionId);
      const timing = await api.getTiming(session.sessionId);
      
      const interval = window.setInterval(() => {
        get().refreshBoreholes();
      }, 1500);

      set({
        session,
        boreholes,
        selectedBoreholeId: boreholes[0]?.id ?? null,
        totalScore: 0,
        operations: [],
        isFinished: false,
        startTime: Date.now(),
        elapsedSeconds: 0,
        sealDeadlineSeconds: timing.sealDeadlineSeconds,
        pollInterval: interval,
      });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  refreshBoreholes: async () => {
    const { session, isFinished, pollInterval } = get();
    if (!session || isFinished) {
      if (pollInterval) {
        clearInterval(pollInterval);
        set({ pollInterval: null });
      }
      return;
    }
    try {
      const [boreholes, timing] = await Promise.all([
        api.getBoreholes(session.sessionId),
        api.getTiming(session.sessionId),
      ]);
      set({
        boreholes,
        elapsedSeconds: timing.elapsedSeconds,
        sealDeadlineSeconds: timing.sealDeadlineSeconds,
      });
    } catch {
      // ignore polling errors
    }
  },

  submitOperation: async (operation: OperationType) => {
    const { session, selectedBoreholeId, boreholes } = get();
    if (!session || !selectedBoreholeId) {
      set({ error: '请先开始演练并选择钻孔。' });
      return null;
    }

    set({ loading: true, error: null });
    try {
      const result = await api.submitOperation(session.sessionId, operation, selectedBoreholeId);

      const newBoreholes = boreholes.map((bh) => {
        if (bh.id !== selectedBoreholeId) return bh;
        const updated = { ...bh };
        if (operation === 'plug' && result.correct) updated.isPlugged = true;
        if (operation === 'install_casing' && result.correct) updated.casingInstalled = true;
        if (operation === 'inject_cement' && result.correct) updated.cementFilled = 100;
        if (operation === 'verify_seal' && result.correct) {
          updated.sealVerified = true;
          updated.gasLeakLevel = 0;
        }
        return updated;
      });

      const newEntry: OperationLogEntry = {
        id: Date.now(),
        sessionId: session.sessionId,
        operation,
        boreholeId: selectedBoreholeId,
        scoreDelta: result.scoreDelta,
        correct: result.correct,
        message: result.message,
        timestamp: new Date().toISOString(),
      };

      set((state) => ({
        boreholes: newBoreholes,
        totalScore: result.totalScore,
        operations: [...state.operations, newEntry],
      }));

      setTimeout(() => get().refreshBoreholes(), 100);

      return result;
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  finishSession: async () => {
    const { session, pollInterval } = get();
    if (!session) return null;

    if (pollInterval) {
      clearInterval(pollInterval);
      set({ pollInterval: null });
    }

    set({ loading: true, error: null });
    try {
      const detail = await api.finishSession(session.sessionId);
      set({
        isFinished: true,
        session: {
          ...session,
          finishedAt: detail.finishedAt,
          totalScore: detail.totalScore,
          grade: detail.grade,
        },
      });
      return detail;
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  selectBorehole: (id: string | null) => {
    set({ selectedBoreholeId: id });
  },

  loadSession: async (sessionId: string) => {
    set({ loading: true, error: null });
    try {
      const detail = await api.getSession(sessionId);
      const boreholes = await api.getBoreholes(sessionId);
      set({
        session: detail,
        boreholes,
        selectedBoreholeId: boreholes[0]?.id ?? null,
        totalScore: detail.totalScore,
        operations: detail.operations,
        isFinished: !!detail.finishedAt,
        startTime: null,
        elapsedSeconds: 0,
      });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  reset: () => {
    const { pollInterval } = get();
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    set({
      session: null,
      boreholes: INITIAL_BOREHOLES,
      selectedBoreholeId: null,
      totalScore: 0,
      operations: [],
      isFinished: false,
      loading: false,
      error: null,
      startTime: null,
      elapsedSeconds: 0,
      sealDeadlineSeconds: 30,
      pollInterval: null,
    });
  },

  tickTimer: () => {
    const { startTime, isFinished } = get();
    if (startTime && !isFinished) {
      set({ elapsedSeconds: Math.floor((Date.now() - startTime) / 1000) });
    }
  },
}));

export function selectSceneState(state: DrillState): DrillSceneState {
  return {
    boreholes: state.boreholes,
    selectedBoreholeId: state.selectedBoreholeId,
    gasEmissionActive: state.boreholes.some((b) => b.hasGas && !b.sealVerified),
    gasIntensity: Math.max(
      0.3,
      state.boreholes.reduce((acc, b) => (b.hasGas && !b.sealVerified ? acc + b.gasPressure : acc), 0),
    ),
    elapsedSeconds: state.elapsedSeconds,
    sealDeadlineSeconds: state.sealDeadlineSeconds,
  };
}

export function useSceneState(): DrillSceneState {
  return useDrillStore(useShallow(selectSceneState));
}
