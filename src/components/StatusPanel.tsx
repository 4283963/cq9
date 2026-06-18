import { useEffect } from 'react';
import { useDrillStore } from '@/store/useDrillStore';
import { Timer, Gauge, Trophy, Zap, Target, Award, AlertTriangle, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const GRADE_COLORS: Record<string, string> = {
  S: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/50',
  A: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/50',
  B: 'text-teal-400 bg-teal-400/10 border-teal-400/50',
  C: 'text-amber-400 bg-amber-400/10 border-amber-400/50',
  D: 'text-red-400 bg-red-400/10 border-red-400/50',
  '': 'text-slate-400 bg-slate-500/10 border-slate-500/30',
};

export function StatusPanel() {
  const {
    session,
    totalScore,
    boreholes,
    selectedBoreholeId,
    elapsedSeconds,
    sealDeadlineSeconds,
    tickTimer,
    isFinished,
  } = useDrillStore();

  useEffect(() => {
    if (!session) return;
    const id = setInterval(tickTimer, 1000);
    return () => clearInterval(id);
  }, [session, tickTimer]);

  const selected = boreholes.find((b) => b.id === selectedBoreholeId);

  const sealedCount = boreholes.filter((b) => b.sealVerified).length;
  const totalGas = boreholes.filter((b) => b.hasGas).length;
  const maxPressure = Math.max(0, ...boreholes.map((b) => b.gasPressure));
  const maxLeakLevel = Math.max(0, ...boreholes.filter(b => b.hasGas && !b.sealVerified).map((b) => b.gasLeakLevel));

  const gasDetected = boreholes.some(b => b.hasGas && b.gasPressure > 0);
  const timeRemaining = Math.max(0, sealDeadlineSeconds - elapsedSeconds);
  const isOvertime = gasDetected && elapsedSeconds > sealDeadlineSeconds;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const getLeakLabel = (level: number): { label: string; color: string; bgColor: string } => {
    if (level <= 0.05) return { label: '无泄漏', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10 border-emerald-400/30' };
    if (level <= 0.2) return { label: '轻微泄漏', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10 border-yellow-400/30' };
    if (level <= 0.4) return { label: '中度泄漏', color: 'text-orange-400', bgColor: 'bg-orange-400/10 border-orange-400/30' };
    if (level <= 0.6) return { label: '严重泄漏', color: 'text-red-400', bgColor: 'bg-red-400/10 border-red-400/30' };
    return { label: '特大泄漏', color: 'text-red-500', bgColor: 'bg-red-500/15 border-red-500/50' };
  };

  const leakInfo = getLeakLabel(maxLeakLevel);

  if (!session) {
    return (
      <div className="bg-slab-800 border border-slab-600 rounded-xl p-5 shadow-panel">
        <h3 className="font-display text-xl font-bold text-slate-200 tracking-wider mb-4">
          状态面板
        </h3>
        <div className="text-center py-10 text-slate-500">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>请先开始演练</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slab-800 border border-slab-600 rounded-xl p-5 shadow-panel">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-xl font-bold text-slate-200 tracking-wider">
          状态面板
        </h3>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slab-700 rounded-md">
          <Timer className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-sm text-amber-400">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {gasDetected && !isFinished && (
        <div className={cn(
          'mb-5 p-3 border rounded-lg flex items-center gap-3',
          isOvertime
            ? 'bg-red-900/30 border-red-500/50 animate-pulse-slow'
            : timeRemaining <= 10
              ? 'bg-orange-900/20 border-orange-500/40'
              : 'bg-amber-900/20 border-amber-500/40'
        )}>
          <AlertTriangle className={cn(
            'w-5 h-5 flex-shrink-0',
            isOvertime ? 'text-red-400' : timeRemaining <= 10 ? 'text-orange-400' : 'text-amber-400'
          )} />
          <div className="flex-1">
            <div className={cn(
              'text-sm font-medium',
              isOvertime ? 'text-red-300' : timeRemaining <= 10 ? 'text-orange-300' : 'text-amber-300'
            )}>
              {isOvertime ? '⚠️ 封堵超时！气体正在泄漏' : `封堵倒计时: ${timeRemaining} 秒`}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {isOvertime
                ? `已超时 ${elapsedSeconds - sealDeadlineSeconds} 秒，泄漏等级: ${leakInfo.label}`
                : '请在倒计时结束前完成封堵与水泥注入'}
            </div>
          </div>
          <div className={cn(
            'font-mono text-2xl font-bold',
            isOvertime ? 'text-red-400' : timeRemaining <= 10 ? 'text-orange-400' : 'text-amber-400'
          )}>
            {isOvertime ? '−' : ''}{formatTime(isOvertime ? elapsedSeconds - sealDeadlineSeconds : timeRemaining)}
          </div>
        </div>
      )}

      {maxLeakLevel > 0.05 && !isFinished && (
        <div className={cn('mb-5 p-3 border rounded-lg flex items-center gap-3', leakInfo.bgColor)}>
          <Flame className={cn('w-5 h-5 flex-shrink-0 animate-pulse', leakInfo.color)} />
          <div className="flex-1">
            <div className={cn('text-sm font-medium', leakInfo.color)}>
              气体泄漏: {leakInfo.label}
            </div>
            <div className="h-1.5 mt-1.5 bg-slab-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  maxLeakLevel <= 0.2 ? 'bg-yellow-400' :
                  maxLeakLevel <= 0.4 ? 'bg-orange-400' :
                  maxLeakLevel <= 0.6 ? 'bg-red-400' : 'bg-red-500'
                )}
                style={{ width: `${Math.min(100, maxLeakLevel * 100)}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono">
              泄漏程度 {(maxLeakLevel * 100).toFixed(0)}% · 预计扣分 {Math.abs(
                maxLeakLevel <= 0.05 ? 0 :
                maxLeakLevel <= 0.2 ? -5 :
                maxLeakLevel <= 0.4 ? -10 :
                maxLeakLevel <= 0.6 ? -18 :
                maxLeakLevel <= 0.8 ? -28 : -40
              )} 分
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 bg-slab-900/50 border border-slab-600 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            当前得分
          </div>
          <div className="font-mono text-3xl font-bold text-amber-400">
            {totalScore}
          </div>
        </div>
        <div className={cn(
          'p-3 border rounded-lg',
          maxPressure >= 5
            ? 'bg-red-900/20 border-red-500/40'
            : maxPressure >= 4
              ? 'bg-orange-900/20 border-orange-500/40'
              : 'bg-slab-900/50 border-slab-600'
        )}>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Zap className={cn(
              'w-3.5 h-3.5',
              maxPressure >= 5 ? 'text-red-400' : maxPressure >= 4 ? 'text-orange-400' : 'text-red-400'
            )} />
            最高气压
          </div>
          <div className={cn(
            'font-mono text-3xl font-bold',
            maxPressure >= 5 ? 'text-red-400' : maxPressure >= 4 ? 'text-orange-400' : 'text-red-400'
          )}>
            {maxPressure.toFixed(1)}
            <span className="text-sm font-normal text-slate-500 ml-1">MPa</span>
          </div>
          {maxPressure >= 4 && (
            <div className="text-[10px] text-orange-400/80 mt-0.5">⚠ 气压持续上升</div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400">封堵进度</span>
            <span className="font-mono text-slate-300">{sealedCount} / {totalGas}</span>
          </div>
          <div className="h-2 bg-slab-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: totalGas > 0 ? `${(sealedCount / totalGas) * 100}%` : '100%' }}
            />
          </div>
        </div>

        {selected && (
          <div className="p-3 bg-slab-900/50 border border-slab-600 rounded-lg">
            <div className="text-xs text-slate-500 mb-1.5 font-medium">
              {selected.name} · 状态
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', selected.casingInstalled ? 'bg-emerald-400' : 'bg-slate-600')} />
                <span className={selected.casingInstalled ? 'text-slate-300' : 'text-slate-500'}>
                  套管安装
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', selected.isPlugged ? 'bg-emerald-400' : 'bg-slate-600')} />
                <span className={selected.isPlugged ? 'text-slate-300' : 'text-slate-500'}>
                  钻孔封堵
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', selected.cementFilled >= 100 ? 'bg-emerald-400' : 'bg-slate-600')} />
                <span className={selected.cementFilled >= 100 ? 'text-slate-300' : 'text-slate-500'}>
                  水泥填充 {selected.cementFilled}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', selected.sealVerified ? 'bg-emerald-400' : 'bg-slate-600')} />
                <span className={selected.sealVerified ? 'text-slate-300' : 'text-slate-500'}>
                  封堵验证
                </span>
              </div>
            </div>
            {selected.hasGas && !selected.sealVerified && selected.gasLeakLevel > 0.05 && (
              <div className="mt-2 pt-2 border-t border-slab-700">
                <div className={cn('text-xs', leakInfo.color)}>
                  泄漏: {selected.gasLeakLevel.toFixed(2)} · {getLeakLabel(selected.gasLeakLevel).label}
                </div>
              </div>
            )}
          </div>
        )}

        {isFinished && session.grade && (
          <div className={cn('flex items-center justify-center gap-3 p-4 border rounded-lg', GRADE_COLORS[session.grade] || GRADE_COLORS[''])}>
            <Award className="w-6 h-6" />
            <div className="text-center">
              <div className="text-xs opacity-70">安全评级</div>
              <div className="font-display text-4xl font-bold tracking-wider leading-none">
                {session.grade}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-slab-600">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">演练人员</span>
          <span className="font-mono text-slate-300">{session.operator}</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-slate-500">会话 ID</span>
          <span className="font-mono text-slate-600 text-[10px]">
            {session.sessionId.slice(0, 12)}...
          </span>
        </div>
      </div>
    </div>
  );
}
