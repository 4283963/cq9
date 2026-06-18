import { useEffect, useState } from 'react';
import { useDrillStore } from '@/store/useDrillStore';
import type { SessionDetail } from 'shared/types';
import { Trophy, Clock, Layers, Award, RotateCcw, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const GRADE_COLORS: Record<string, string> = {
  S: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/50 shadow-yellow-400/20',
  A: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/50 shadow-emerald-400/20',
  B: 'text-teal-400 bg-teal-400/10 border-teal-400/50 shadow-teal-400/20',
  C: 'text-amber-400 bg-amber-400/10 border-amber-400/50 shadow-amber-400/20',
  D: 'text-red-400 bg-red-400/10 border-red-400/50 shadow-red-400/20',
};

const GRADE_LABELS: Record<string, string> = {
  S: '完美 · 操作典范',
  A: '优秀 · 处置规范',
  B: '良好 · 完成任务',
  C: '合格 · 仍需加强',
  D: '不合格 · 重新培训',
};

export function FinishModal() {
  const isFinished = useDrillStore((s) => s.isFinished);
  const session = useDrillStore((s) => s.session);
  const operations = useDrillStore((s) => s.operations);
  const reset = useDrillStore((s) => s.reset);
  const navigate = useNavigate();

  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isFinished && session) {
      setDetail({
        ...session,
        operations,
      });
      setShow(true);
    }
  }, [isFinished, session, operations]);

  if (!show || !detail) return null;

  const correctCount = operations.filter((o) => o.correct).length;
  const totalOps = operations.length;
  const startTime = detail.startedAt ? new Date(detail.startedAt) : null;
  const endTime = detail.finishedAt ? new Date(detail.finishedAt) : null;
  const duration = startTime && endTime
    ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
    : 0;

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}分${sec}秒` : `${sec}秒`;
  };

  const handleReset = () => {
    setShow(false);
    reset();
  };

  const handleViewRecords = () => {
    navigate('/records');
    setShow(false);
  };

  const grade = detail.grade || 'D';
  const gradeColor = GRADE_COLORS[grade] || GRADE_COLORS.D;
  const gradeLabel = GRADE_LABELS[grade] || GRADE_LABELS.D;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slab-950/90 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slab-800 border border-slab-600 rounded-2xl p-8 shadow-panel animate-fade-in">
        <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mb-4">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-100 tracking-wider mb-2">
            演练完成
          </h2>
          <p className="text-slate-400 text-sm">
            钻孔处置流程已结束，以下是本次演练成绩
          </p>
        </div>

        <div className={cn(
          'flex items-center justify-center gap-4 p-6 border rounded-xl mb-6 shadow-lg',
          gradeColor,
        )}>
          <Award className="w-10 h-10" />
          <div className="text-center">
            <div className="text-xs opacity-70 mb-1">安全评级</div>
            <div className="font-display text-6xl font-bold tracking-wider leading-none">
              {grade}
            </div>
            <div className="text-xs mt-1.5 opacity-80">{gradeLabel}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-slab-900/50 border border-slab-600 rounded-lg text-center">
            <Trophy className="w-4 h-4 mx-auto mb-1.5 text-amber-400" />
            <div className="text-xs text-slate-500">总得分</div>
            <div className="font-mono text-xl font-bold text-amber-400">
              {detail.totalScore}
            </div>
          </div>
          <div className="p-3 bg-slab-900/50 border border-slab-600 rounded-lg text-center">
            <Clock className="w-4 h-4 mx-auto mb-1.5 text-teal-400" />
            <div className="text-xs text-slate-500">用时</div>
            <div className="font-mono text-xl font-bold text-teal-400">
              {formatDuration(duration)}
            </div>
          </div>
          <div className="p-3 bg-slab-900/50 border border-slab-600 rounded-lg text-center">
            <Layers className="w-4 h-4 mx-auto mb-1.5 text-emerald-400" />
            <div className="text-xs text-slate-500">正确率</div>
            <div className="font-mono text-xl font-bold text-emerald-400">
              {totalOps > 0 ? Math.round((correctCount / totalOps) * 100) : 0}%
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slab-700 hover:bg-slab-600 text-slate-200 rounded-lg font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            重新演练
          </button>
          <button
            onClick={handleViewRecords}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-medium transition-colors"
          >
            <History className="w-4 h-4" />
            查看历史
          </button>
        </div>
      </div>
    </div>
  );
}
