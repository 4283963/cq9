import type {
  DrillSession,
  OperationResponse,
  OperationType,
  Borehole,
  SessionDetail,
} from 'shared/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success || !res.ok) {
    throw new Error(json.error || `请求失败: ${res.status}`);
  }
  return json.data as T;
}

export async function createSession(operator: string): Promise<DrillSession> {
  return request<DrillSession>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ operator }),
  });
}

export async function submitOperation(
  sessionId: string,
  operation: OperationType,
  boreholeId: string,
): Promise<OperationResponse> {
  return request<OperationResponse>(`/api/sessions/${sessionId}/operations`, {
    method: 'POST',
    body: JSON.stringify({ operation, boreholeId }),
  });
}

export async function finishSession(sessionId: string): Promise<SessionDetail> {
  return request<SessionDetail>(`/api/sessions/${sessionId}/finish`, {
    method: 'POST',
  });
}

export async function getSession(sessionId: string): Promise<SessionDetail> {
  return request<SessionDetail>(`/api/sessions/${sessionId}`);
}

export async function listSessions(): Promise<DrillSession[]> {
  return request<DrillSession[]>('/api/sessions');
}

export async function getBoreholes(sessionId: string): Promise<Borehole[]> {
  return request<Borehole[]>(`/api/sessions/${sessionId}/boreholes`);
}
