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
import { evaluateOperation, calculateGrade, getNextExpectedStep } from './scoringService.js';
import { getInitialBoreholes, findBorehole } from './boreholeConfig.js';

interface ActiveSession {
  boreholes: Borehole[];
  totalScore: number;
}

const activeSessions = new Map<string, ActiveSession>();

function nowISO(): string {
  return new Date().toISOString();
}

export function createNewSession(operator: string): DrillSession {
  const sessionId = randomUUID();
  const startedAt = nowISO();
  createSession(sessionId, operator, startedAt);
  activeSessions.set(sessionId, {
    boreholes: getInitialBoreholes(),
    totalScore: 0,
  });
  const session = findSessionById(sessionId);
  if (!session) throw new Error('Session creation failed');
  return session;
}

export function getSessionBoreholes(sessionId: string): Borehole[] {
  const active = activeSessions.get(sessionId);
  if (!active) throw new Error('Session not found or expired');
  return active.boreholes;
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

  const expected = getNextExpectedStep(sessionId, borehole);
  if (operation === 'plug' && expected === 'plug') {
    borehole.isPlugged = true;
  } else if (operation === 'install_casing' && expected === 'install_casing') {
    borehole.casingInstalled = true;
  } else if (operation === 'inject_cement' && expected === 'inject_cement') {
    borehole.cementFilled = Math.min(100, borehole.cementFilled + 100);
  } else if (operation === 'verify_seal' && expected === 'verify_seal') {
    borehole.sealVerified = true;
  }

  const { correct, scoreDelta, message } = evaluateOperation(sessionId, operation, borehole);
  active.totalScore = Math.max(0, active.totalScore + scoreDelta);
  updateSessionScore(sessionId, active.totalScore);
  insertOperation(sessionId, operation, boreholeId, scoreDelta, correct, message, nowISO());

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
