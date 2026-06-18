import { randomUUID } from 'node:crypto';
import type {
  Borehole,
  DrillSession,
  OperationRecord,
  OperationResponse,
  OperationType,
  SessionDetail,
} from '../../shared/types.js';
import {
  createSession,
  findSessionById,
  finishSession,
  insertOperation,
  listOperationsBySession,
  listSessions,
  updateSessionScore,
  countCorrectOperations,
} from '../repositories/sessionRepo.js';
import { evaluateOperation, calculateGrade, getNextExpectedStep, calculateLeakPenalty } from './scoringService.js';
import { getInitialBoreholes, findBorehole } from './boreholeConfig.js';

export const SEAL_DEADLINE_SECONDS = 30;
export const BASE_GAS_PRESSURE = 3.2;
export const MAX_GAS_PRESSURE = 8.0;

interface ActiveSession {
  boreholes: Borehole[];
  totalScore: number;
  startedAt: number;
  gasDetectedAt: number | null;
}

const activeSessions = new Map<string, ActiveSession>();

function nowISO(): string {
  return new Date().toISOString();
}

function nowMs(): number {
  return Date.now();
}

function getElapsedSeconds(startMs: number): number {
  return Math.floor((nowMs() - startMs) / 1000);
}

export function createNewSession(operator: string): DrillSession {
  const sessionId = randomUUID();
  const startedAt = nowISO();
  createSession(sessionId, operator, startedAt);
  activeSessions.set(sessionId, {
    boreholes: getInitialBoreholes(),
    totalScore: 0,
    startedAt: nowMs(),
    gasDetectedAt: null,
  });
  const session = findSessionById(sessionId);
  if (!session) throw new Error('Session creation failed');
  return session;
}

function updateGasState(sessionId: string): void {
  const active = activeSessions.get(sessionId);
  if (!active) return;

  const elapsed = getElapsedSeconds(active.startedAt);

  for (const bh of active.boreholes) {
    if (!bh.hasGas || bh.sealVerified) {
      bh.gasLeakLevel = 0;
      continue;
    }

    if (active.gasDetectedAt !== null) {
      const timeSinceDetection = getElapsedSeconds(active.gasDetectedAt);
      const pressureGrowth = Math.min(MAX_GAS_PRESSURE - BASE_GAS_PRESSURE, timeSinceDetection * 0.08);
      bh.gasPressure = BASE_GAS_PRESSURE + pressureGrowth;

      const overtime = Math.max(0, timeSinceDetection - SEAL_DEADLINE_SECONDS);
      const cementDeficit = Math.max(0, 100 - bh.cementFilled) / 100;
      bh.gasLeakLevel = Math.min(1, (overtime / 30) * 0.6 + cementDeficit * 0.4);

      if (bh.isPlugged && bh.cementFilled >= 80) {
        bh.gasLeakLevel = Math.max(0, bh.gasLeakLevel * 0.3);
      }
    }
  }
}

export function getSessionBoreholes(sessionId: string): Borehole[] {
  const active = activeSessions.get(sessionId);
  if (!active) throw new Error('Session not found or expired');
  updateGasState(sessionId);
  return active.boreholes;
}

export function getSessionTiming(sessionId: string): { elapsedSeconds: number; sealDeadlineSeconds: number } {
  const active = activeSessions.get(sessionId);
  if (!active) return { elapsedSeconds: 0, sealDeadlineSeconds: SEAL_DEADLINE_SECONDS };
  updateGasState(sessionId);
  const elapsed = active.gasDetectedAt !== null
    ? getElapsedSeconds(active.gasDetectedAt)
    : 0;
  return { elapsedSeconds: elapsed, sealDeadlineSeconds: SEAL_DEADLINE_SECONDS };
}

export function applyOperation(
  sessionId: string,
  operation: OperationType,
  boreholeId: string,
): OperationResponse {
  const active = activeSessions.get(sessionId);
  if (!active) {
    return {
      ok: false,
      scoreDelta: 0,
      correct: false,
      message: '会话不存在，请重新开始演练。',
      totalScore: 0,
      sealed: false,
    };
  }

  const session = findSessionById(sessionId);
  if (!session) {
    return {
      ok: false,
      scoreDelta: 0,
      correct: false,
      message: '会话不存在。',
      totalScore: 0,
      sealed: false,
    };
  }

  const borehole = findBorehole(active.boreholes, boreholeId);
  if (!borehole) {
    return {
      ok: false,
      scoreDelta: 0,
      correct: false,
      message: '未找到该钻孔。',
      totalScore: active.totalScore,
      sealed: false,
    };
  }

  if (operation === 'detect_gas' && active.gasDetectedAt === null) {
    active.gasDetectedAt = nowMs();
  }

  updateGasState(sessionId);

  const expected = getNextExpectedStep(sessionId, borehole);
  if (operation === 'plug' && expected === 'plug') {
    borehole.isPlugged = true;
  } else if (operation === 'install_casing' && expected === 'install_casing') {
    borehole.casingInstalled = true;
  } else if (operation === 'inject_cement' && expected === 'inject_cement') {
    borehole.cementFilled = Math.min(100, borehole.cementFilled + 100);
  } else if (operation === 'verify_seal' && expected === 'verify_seal') {
    borehole.sealVerified = true;
    borehole.gasLeakLevel = 0;
  }

  const { correct, scoreDelta, message } = evaluateOperation(sessionId, operation, borehole);
  active.totalScore = Math.max(0, active.totalScore + scoreDelta);
  updateSessionScore(sessionId, active.totalScore);
  insertOperation(sessionId, operation, boreholeId, scoreDelta, correct, message, nowISO());

  updateGasState(sessionId);

  const sealed = active.boreholes
    .filter(b => b.hasGas)
    .every(b => b.sealVerified);

  return {
    ok: true,
    scoreDelta,
    correct,
    message,
    totalScore: active.totalScore,
    sealed,
  };
}

export function finishDrillSession(sessionId: string): SessionDetail | null {
  const active = activeSessions.get(sessionId);
  if (!active) return null;

  const session = findSessionById(sessionId);
  if (!session) return null;

  updateGasState(sessionId);

  const totalLeakLevel = active.boreholes
    .filter(b => b.hasGas)
    .reduce((sum, b) => sum + b.gasLeakLevel, 0);
  const leakPenalty = calculateLeakPenalty(totalLeakLevel);
  if (leakPenalty !== 0) {
    active.totalScore = Math.max(0, active.totalScore + leakPenalty);
    updateSessionScore(sessionId, active.totalScore);
    const leakMsg = leakPenalty < 0
      ? `气体泄漏惩罚：${leakPenalty} 分（泄漏程度 ${(totalLeakLevel * 100).toFixed(0)}%）`
      : '';
    if (leakMsg) {
      insertOperation(sessionId, 'detect_gas', 'BH-001', leakPenalty, false, leakMsg, nowISO());
    }
  }

  const operations = listOperationsBySession(sessionId);
  const correctCount = countCorrectOperations(sessionId);
  const grade = calculateGrade(active.totalScore, correctCount, operations.length);
  const finishedAt = nowISO();

  finishSession(sessionId, finishedAt, active.totalScore, grade);
  activeSessions.delete(sessionId);

  const updated = findSessionById(sessionId);
  if (!updated) return null;

  return { ...updated, operations };
}

export function getSessionDetail(sessionId: string): SessionDetail | null {
  const session = findSessionById(sessionId);
  if (!session) return null;
  const operations = listOperationsBySession(sessionId);
  return { ...session, operations };
}

export function getAllSessions(): DrillSession[] {
  return listSessions();
}

export function getCurrentTotalScore(sessionId: string): number {
  const active = activeSessions.get(sessionId);
  return active ? active.totalScore : 0;
}
