import { db } from '../db/connection.js';
import type { DrillSession, OperationRecord, OperationType } from '../../shared/types.js';

export interface SessionRow {
  session_id: string;
  operator: string;
  started_at: string;
  finished_at: string | null;
  total_score: number;
  grade: string;
}

export interface OperationRow {
  id: number;
  session_id: string;
  operation: string;
  borehole_id: string;
  score_delta: number;
  correct: number;
  message: string;
  timestamp: string;
}

function mapSession(row: SessionRow): DrillSession {
  return {
    sessionId: row.session_id,
    operator: row.operator,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    totalScore: row.total_score,
    grade: row.grade,
  };
}

function mapOperation(row: OperationRow): OperationRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    operation: row.operation as OperationType,
    boreholeId: row.borehole_id,
    scoreDelta: row.score_delta,
    correct: row.correct === 1,
    message: row.message,
    timestamp: row.timestamp,
  };
}

export function createSession(sessionId: string, operator: string, startedAt: string): void {
  const stmt = db.prepare(`
    INSERT INTO drill_session (session_id, operator, started_at, total_score, grade)
    VALUES (?, ?, ?, 0, '')
  `);
  stmt.run(sessionId, operator, startedAt);
}

export function findSessionById(sessionId: string): DrillSession | null {
  const stmt = db.prepare('SELECT * FROM drill_session WHERE session_id = ?');
  const row = stmt.get(sessionId) as unknown as SessionRow | undefined;
  return row ? mapSession(row) : null;
}

export function updateSessionScore(sessionId: string, totalScore: number): void {
  const stmt = db.prepare('UPDATE drill_session SET total_score = ? WHERE session_id = ?');
  stmt.run(totalScore, sessionId);
}

export function finishSession(sessionId: string, finishedAt: string, totalScore: number, grade: string): void {
  const stmt = db.prepare(`
    UPDATE drill_session
    SET finished_at = ?, total_score = ?, grade = ?
    WHERE session_id = ?
  `);
  stmt.run(finishedAt, totalScore, grade, sessionId);
}

export function listSessions(): DrillSession[] {
  const stmt = db.prepare('SELECT * FROM drill_session ORDER BY started_at DESC');
  const rows = stmt.all() as unknown as SessionRow[];
  return rows.map(mapSession);
}

export function insertOperation(
  sessionId: string,
  operation: OperationType,
  boreholeId: string,
  scoreDelta: number,
  correct: boolean,
  message: string,
  timestamp: string,
): number {
  const stmt = db.prepare(`
    INSERT INTO operation_record
    (session_id, operation, borehole_id, score_delta, correct, message, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    sessionId,
    operation,
    boreholeId,
    scoreDelta,
    correct ? 1 : 0,
    message,
    timestamp,
  );
  return Number(result.lastInsertRowid);
}

export function listOperationsBySession(sessionId: string): OperationRecord[] {
  const stmt = db.prepare('SELECT * FROM operation_record WHERE session_id = ? ORDER BY id ASC');
  const rows = stmt.all(sessionId) as unknown as OperationRow[];
  return rows.map(mapOperation);
}

export function countOperationsByType(sessionId: string, operation: OperationType): number {
  const stmt = db.prepare(
    'SELECT COUNT(*) as cnt FROM operation_record WHERE session_id = ? AND operation = ? AND correct = 1',
  );
  const row = stmt.get(sessionId, operation) as unknown as { cnt: number };
  return row.cnt;
}

export function countCorrectOperations(sessionId: string): number {
  const stmt = db.prepare(
    'SELECT COUNT(*) as cnt FROM operation_record WHERE session_id = ? AND correct = 1',
  );
  const row = stmt.get(sessionId) as unknown as { cnt: number };
  return row.cnt;
}
