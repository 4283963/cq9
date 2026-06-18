import type { Request, Response } from 'express';
import {
  createNewSession,
  applyOperation,
  finishDrillSession,
  getSessionDetail,
  getAllSessions,
  getSessionBoreholes,
  getSessionTiming,
} from '../services/drillService.js';
import type { OperationType } from '../../shared/types.js';

export async function createSession(req: Request, res: Response): Promise<void> {
  const { operator } = req.body;
  if (!operator || typeof operator !== 'string' || operator.trim().length === 0) {
    res.status(400).json({ success: false, error: '请输入演练人员姓名或工号。' });
    return;
  }
  const session = createNewSession(operator.trim());
  res.status(201).json({ success: true, data: session });
}

export async function submitOperation(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { operation, boreholeId } = req.body;
  if (!operation || !boreholeId) {
    res.status(400).json({ success: false, error: '缺少 operation 或 boreholeId 参数。' });
    return;
  }
  const validOps: OperationType[] = ['detect_gas', 'install_casing', 'plug', 'inject_cement', 'verify_seal'];
  if (!validOps.includes(operation as OperationType)) {
    res.status(400).json({ success: false, error: '无效的操作类型。' });
    return;
  }
  const result = applyOperation(id, operation as OperationType, boreholeId);
  res.json({ success: true, data: result });
}

export async function finishSession(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const detail = finishDrillSession(id);
  if (!detail) {
    res.status(404).json({ success: false, error: '会话不存在。' });
    return;
  }
  res.json({ success: true, data: detail });
}

export async function getSession(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const detail = getSessionDetail(id);
  if (!detail) {
    res.status(404).json({ success: false, error: '会话不存在。' });
    return;
  }
  res.json({ success: true, data: detail });
}

export async function listSessions(_req: Request, res: Response): Promise<void> {
  const sessions = getAllSessions();
  res.json({ success: true, data: sessions });
}

export async function getBoreholes(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const boreholes = getSessionBoreholes(id);
    res.json({ success: true, data: boreholes });
  } catch (err) {
    res.status(404).json({ success: false, error: (err as Error).message });
  }
}

export async function getTiming(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const timing = getSessionTiming(id);
    res.json({ success: true, data: timing });
  } catch (err) {
    res.status(404).json({ success: false, error: (err as Error).message });
  }
}
