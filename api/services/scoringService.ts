import type { OperationType, Borehole } from '../../shared/types.js';
import {
  countOperationsByType,
} from '../repositories/sessionRepo.js';

export const OPERATION_INFO: Record<OperationType, { label: string; points: number }> = {
  detect_gas:      { label: '检测气体',   points: 10 },
  install_casing:  { label: '安装套管',   points: 15 },
  plug:            { label: '封堵钻孔',   points: 20 },
  inject_cement:   { label: '注入水泥',   points: 25 },
  verify_seal:     { label: '验证封堵',   points: 30 },
};

export const STANDARD_SEQUENCE: OperationType[] = [
  'detect_gas',
  'install_casing',
  'plug',
  'inject_cement',
  'verify_seal',
];

export function getNextExpectedStep(sessionId: string, borehole: Borehole): OperationType | null {
  if (!borehole.hasGas && borehole.gasPressure === 0) {
    const detected = countOperationsByType(sessionId, 'detect_gas') > 0;
    if (!detected) return 'detect_gas';
    return null;
  }

  const detected = countOperationsByType(sessionId, 'detect_gas') > 0;
  const cased    = countOperationsByType(sessionId, 'install_casing') > 0;
  const plugged  = countOperationsByType(sessionId, 'plug') > 0;
  const injected = countOperationsByType(sessionId, 'inject_cement') > 0;
  const verified = countOperationsByType(sessionId, 'verify_seal') > 0;

  if (!detected) return 'detect_gas';
  if (!cased)    return 'install_casing';
  if (!plugged)  return 'plug';
  if (!injected) return 'inject_cement';
  if (!verified) return 'verify_seal';
  return null;
}

export interface ScoreResult {
  correct: boolean;
  scoreDelta: number;
  message: string;
}

export function evaluateOperation(
  sessionId: string,
  operation: OperationType,
  borehole: Borehole,
): ScoreResult {
  const expected = getNextExpectedStep(sessionId, borehole);
  const basePoints = OPERATION_INFO[operation].points;
  const label = OPERATION_INFO[operation].label;

  if (operation === 'detect_gas') {
    if (borehole.gasPressure > 0) {
      return {
        correct: true,
        scoreDelta: basePoints,
        message: `气体检测完成：${borehole.name} 气体压力 ${borehole.gasPressure.toFixed(1)} MPa，需立即处置。`,
      };
    }
    return {
      correct: true,
      scoreDelta: Math.floor(basePoints * 0.8),
      message: `气体检测完成：${borehole.name} 无有害气体溢出，仍需按规范操作。`,
    };
  }

  if (expected === null) {
    return {
      correct: false,
      scoreDelta: -5,
      message: `${label}：该钻孔处置流程已完成，无需重复操作。`,
    };
  }

  if (operation === expected) {
    return {
      correct: true,
      scoreDelta: basePoints,
      message: `${label} 操作正确，继续下一步。`,
    };
  }

  const expectedLabel = OPERATION_INFO[expected].label;
  return {
    correct: false,
    scoreDelta: -10,
    message: `${label} 顺序错误：当前应先执行“${expectedLabel}”。`,
  };
}

export function calculateGrade(totalScore: number, totalCorrect: number, totalOps: number): string {
  const maxPossible = STANDARD_SEQUENCE.reduce((s, op) => s + OPERATION_INFO[op].points, 0);
  const ratio = totalScore / maxPossible;

  if (ratio >= 0.9 && totalCorrect >= STANDARD_SEQUENCE.length) return 'S';
  if (ratio >= 0.8) return 'A';
  if (ratio >= 0.65) return 'B';
  if (ratio >= 0.5) return 'C';
  return 'D';
}

export function calculateLeakPenalty(totalLeakLevel: number): number {
  if (totalLeakLevel <= 0.05) return 0;
  if (totalLeakLevel <= 0.2) return -5;
  if (totalLeakLevel <= 0.4) return -10;
  if (totalLeakLevel <= 0.6) return -18;
  if (totalLeakLevel <= 0.8) return -28;
  return -40;
}
