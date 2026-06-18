import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import type { DrillSession, SessionDetail } from 'shared/types';
import * as api from '@/services/apiClient';
import {
  Trophy,
  Clock,
  Calendar,
  User,
  ChevronRight,
  X,
  CheckCircle,
  XCircle,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const OPERATION_LABELS: Record<string, string> = {
  detect_gas: '检测气体',
  install_casing: '安装套管',
  plug: '封堵钻孔',
  inject_cement: '注入水泥',
  verify_seal: '验证封堵',
};

const GRADE_COLORS: Record<string, string> = {
  S: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/50',
  A: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/50',
  B: 'text-teal-400 bg-teal-400/10 border-teal-400/50',
  C: 'text-amber-400 bg-amber-400/10 border-amber-400/50',
  D: 'text-red-400 bg-red-400/10 border-red-400/50',
};

export default function Records() {
  const [sessions, setSessions] = useState<DrillSession[]>([]);
  const [selected, setSelected] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await api.listSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (sessionId: string) => {
    try {
      const detail = await api.getSession(sessionId);
      setSelected(detail);
    } catch (err) {
      console.error('Failed to load detail:', err);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return '进行中';
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const sec = Math.floor((e - s) / 1000);
    const m = Math.floor(sec / 60);
    const r = sec % 60;
    return m > 0 ? `${m}分${r}秒` : `${r}秒`;
  };

  const maxScore = 100;

  return (
    <div className="h-screen flex flex-col bg-slab-950">
      <Header />

      <main className="flex-1 p-6 overflow-auto scrollbar-thin relative bg-grain">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="p-2 bg-slab-800 hover:bg-slab-700 border border-slab-600 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-300" />
              </Link>
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-100 tracking-wider">
                  历史演练记录
                </h2>
                <p className="text-sm text-slate-500">
                  共 {sessions.length} 条记录
                </p>
              </div>
            </div>
            <button
              onClick={loadSessions}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              刷新
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mr-3" />
              加载中...
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <FileText className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg">暂无演练记录</p>
              <p className="text-sm mt-1">
                <Link to="/" className="text-amber-400 hover:underline">
                  前往演练界面
                </Link>{' '}
                开始你的第一次演练
              </p>
            </div>
          ) : (
            <div className="bg-slab-800 border border-slab-600 rounded-xl overflow-hidden shadow-panel">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slab-600 bg-slab-900/50">
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">
                      演练人员
                    </th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">
                      开始时间
                    </th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">
                      用时
                    </th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">
                      得分
                    </th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">
                      评级
                    </th>
                    <th className="text-right text-xs font-medium text-slate-400 px-4 py-3">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr
                      key={session.sessionId}
                      className="border-b border-slab-700/50 hover:bg-slab-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="font-mono text-slate-200">{session.operator}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-sm text-slate-300">
                            {formatDate(session.startedAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-sm font-mono text-slate-300">
                            {formatDuration(session.startedAt, session.finishedAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-mono text-lg font-bold text-amber-400">
                            {session.totalScore}
                          </span>
                          <span className="text-xs text-slate-600">/ {maxScore}</span>
                        </div>
                        <div className="w-24 h-1.5 bg-slab-700 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                            style={{ width: `${Math.min(100, (session.totalScore / maxScore) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {session.grade ? (
                          <span
                            className={`inline-flex w-9 h-9 items-center justify-center rounded-lg font-display text-lg font-bold border ${GRADE_COLORS[session.grade] || ''}`}
                          >
                            {session.grade}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">未完成</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => loadDetail(session.sessionId)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slab-700 hover:bg-slab-600 text-slate-300 rounded-md text-sm transition-colors"
                        >
                          详情
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slab-950/90 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-slab-800 border border-slab-600 rounded-2xl overflow-hidden shadow-panel animate-fade-in">
            <div className="sticky top-0 z-10 bg-slab-800 border-b border-slab-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-100 tracking-wider">
                  演练详情
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selected.sessionId}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-slab-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)] scrollbar-thin">
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="p-3 bg-slab-900/50 border border-slab-600 rounded-lg text-center">
                  <User className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                  <div className="text-xs text-slate-500">人员</div>
                  <div className="font-mono text-sm text-slate-200">{selected.operator}</div>
                </div>
                <div className="p-3 bg-slab-900/50 border border-slab-600 rounded-lg text-center">
                  <Trophy className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <div className="text-xs text-slate-500">得分</div>
                  <div className="font-mono text-xl font-bold text-amber-400">
                    {selected.totalScore}
                  </div>
                </div>
                <div className="p-3 bg-slab-900/50 border border-slab-600 rounded-lg text-center">
                  <Clock className="w-4 h-4 mx-auto mb-1 text-teal-400" />
                  <div className="text-xs text-slate-500">用时</div>
                  <div className="font-mono text-sm text-teal-400">
                    {formatDuration(selected.startedAt, selected.finishedAt)}
                  </div>
                </div>
                <div className="p-3 bg-slab-900/50 border border-slab-600 rounded-lg text-center">
                  <div className="text-xs text-slate-500 mb-1">评级</div>
                  {selected.grade ? (
                    <div
                      className={`inline-flex w-10 h-10 items-center justify-center rounded-lg font-display text-xl font-bold border ${GRADE_COLORS[selected.grade] || ''}`}
                    >
                      {selected.grade}
                    </div>
                  ) : (
                    <div className="text-slate-500">-</div>
                  )}
                </div>
              </div>

              <h4 className="text-sm font-medium text-slate-300 mb-3">操作序列</h4>
              <div className="space-y-2">
                {selected.operations.map((op, idx) => {
                  const time = new Date(op.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  return (
                    <div
                      key={`${op.id}-${idx}`}
                      className="flex items-start gap-3 p-3 bg-slab-900/40 border border-slab-700/50 rounded-lg"
                    >
                      <div className="mt-0.5">
                        {op.correct ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-600">
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                          <span
                            className={
                              op.correct
                                ? 'text-emerald-400 font-medium'
                                : 'text-red-400 font-medium'
                            }
                          >
                            {OPERATION_LABELS[op.operation] || op.operation}
                          </span>
                          <span className="font-mono text-xs text-slate-600 ml-auto">
                            {time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{op.message}</p>
                        <div className="mt-1.5 text-xs">
                          <span className="text-slate-600 font-mono mr-2">
                            {op.boreholeId}
                          </span>
                          <span
                            className={op.scoreDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}
                          >
                            {op.scoreDelta >= 0 ? '+' : ''}
                            {op.scoreDelta}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
