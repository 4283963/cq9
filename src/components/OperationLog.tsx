import { useRef, useEffect } from 'react';
import { useDrillStore } from '@/store/useDrillStore';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import type { OperationRecord } from 'shared/types';

const OPERATION_LABELS: Record<string, string> = {
  detect_gas: '检测气体',
  install_casing: '安装套管',
  plug: '封堵钻孔',
  inject_cement: '注入水泥',
  verify_seal: '验证封堵',
};

export function OperationLog() {
  const operations = useDrillStore((s) => s.operations);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [operations]);

  return (
    <div className="bg-slab-800 border border-slab-600 rounded-xl p-4 shadow-panel flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="font-display text-lg font-bold text-slate-200 tracking-wider">
          操作日志
        </h3>
        <span className="text-xs text-slate-500 font-mono">
          {operations.length} 条记录
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scrollbar-thin space-y-2 pr-1"
      >
        {operations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm py-8">
            <Clock className="w-8 h-8 mb-2 opacity-30" />
            <p>暂无操作记录</p>
          </div>
        ) : (
          operations.map((op, idx) => (
            <LogEntry key={`${op.id}-${idx}`} op={op} index={idx + 1} />
          ))
        )}
      </div>
    </div>
  );
}

function LogEntry({ op, index }: { op: OperationRecord; index: number }) {
  const time = new Date(op.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slab-900/40 border border-slab-700/50 hover:border-slab-600/50 transition-colors">
        <div className="flex-shrink-0 mt-0.5">
          {op.correct ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-slate-600">#{String(index).padStart(2, '0')}</span>
            <span className={op.correct ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
              {OPERATION_LABELS[op.operation] || op.operation}
            </span>
            <span className="font-mono text-slate-600 ml-auto">{time}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{op.message}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[10px] text-slate-600 font-mono">
              {op.boreholeId}
            </span>
            <span className={op.scoreDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {op.scoreDelta >= 0 ? '+' : ''}{op.scoreDelta}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
