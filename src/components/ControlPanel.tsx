import { useDrillStore } from '@/store/useDrillStore';
import { cn } from '@/lib/utils';
import type { Borehole } from 'shared/types';
import {
  Wind,
  CircleDot,
  Shield,
  Droplets,
  CheckCircle2,
  Search,
} from 'lucide-react';

interface OpButton {
  type: 'detect_gas' | 'install_casing' | 'plug' | 'inject_cement' | 'verify_seal';
  label: string;
  icon: React.ElementType;
  desc: string;
  color: string;
}

const OPS: OpButton[] = [
  { type: 'detect_gas',      label: '检测气体', icon: Search,      desc: '检测钻孔内气体浓度与压力', color: 'teal' },
  { type: 'install_casing',  label: '安装套管', icon: CircleDot,   desc: '为钻孔安装钢制套管护壁', color: 'zinc' },
  { type: 'plug',            label: '封堵钻孔', icon: Shield,      desc: '对漏点位置进行封堵作业', color: 'amber' },
  { type: 'inject_cement',   label: '注入水泥', icon: Droplets,    desc: '向封堵段注入水泥浆',     color: 'slate' },
  { type: 'verify_seal',     label: '验证封堵', icon: CheckCircle2, desc: '检验封堵是否达到安全标准', color: 'emerald' },
];

const OP_COLORS: Record<string, { btn: string; btnHover: string; border: string }> = {
  teal: {
    btn: 'bg-teal-400/10 border-teal-400/40 text-teal-300',
    btnHover: 'hover:bg-teal-400/20 hover:border-teal-400',
    border: 'border-teal-400/60',
  },
  zinc: {
    btn: 'bg-zinc-500/10 border-zinc-400/40 text-zinc-300',
    btnHover: 'hover:bg-zinc-500/20 hover:border-zinc-400',
    border: 'border-zinc-400/60',
  },
  amber: {
    btn: 'bg-amber-500/10 border-amber-400/40 text-amber-300',
    btnHover: 'hover:bg-amber-500/20 hover:border-amber-400',
    border: 'border-amber-400/60',
  },
  slate: {
    btn: 'bg-slate-500/10 border-slate-400/40 text-slate-300',
    btnHover: 'hover:bg-slate-500/20 hover:border-slate-400',
    border: 'border-slate-400/60',
  },
  emerald: {
    btn: 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300',
    btnHover: 'hover:bg-emerald-500/20 hover:border-emerald-400',
    border: 'border-emerald-400/60',
  },
};

export function ControlPanel() {
  const {
    session,
    selectedBoreholeId,
    boreholes,
    submitOperation,
    loading,
    isFinished,
  } = useDrillStore();

  const selected = boreholes.find((b) => b.id === selectedBoreholeId);
  const disabled = !session || !selectedBoreholeId || loading || isFinished;

  const handleClick = async (type: OpButton['type']) => {
    if (disabled) return;
    await submitOperation(type);
  };

  const completedSteps = getCompletedSteps(selected);

  return (
    <div className="bg-slab-800 border border-slab-600 rounded-xl p-5 shadow-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-bold text-slate-200 tracking-wider">
          操作控制台
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">当前钻孔:</span>
          {selected ? (
            <span className="font-mono text-amber-400">{selected.name}</span>
          ) : (
            <span className="text-slate-500">未选择</span>
          )}
        </div>
      </div>

      {selected && selected.hasGas && !selected.sealVerified && (
        <div className={cn(
          'mb-4 p-3 border rounded-lg flex items-start gap-3',
          selected.gasLeakLevel > 0.4
            ? 'bg-red-900/30 border-red-500/50 animate-pulse-slow'
            : selected.gasLeakLevel > 0.05
              ? 'bg-orange-900/20 border-orange-500/40'
              : 'bg-red-900/20 border-red-500/30'
        )}>
          <Wind className={cn(
            'w-5 h-5 flex-shrink-0 mt-0.5',
            selected.gasLeakLevel > 0.4 ? 'text-red-400 animate-bounce' : 'text-red-400'
          )} />
          <div className="flex-1">
            <div className={cn(
              'text-sm font-medium',
              selected.gasLeakLevel > 0.4 ? 'text-red-300' : 'text-red-300'
            )}>
              {selected.gasLeakLevel > 0.4
                ? '⚠️ 严重气体泄漏！'
                : selected.gasLeakLevel > 0.05
                  ? '气体泄漏警告'
                  : '有害气体溢出警告'}
            </div>
            <div className={cn(
              'text-xs font-mono mt-0.5',
              selected.gasLeakLevel > 0.4 ? 'text-red-400' : 'text-red-400/80'
            )}>
              气体压力 {selected.gasPressure.toFixed(1)} MPa
              {selected.gasLeakLevel > 0.05 && ` · 泄漏 ${(selected.gasLeakLevel * 100).toFixed(0)}%`}
            </div>
            {selected.gasLeakLevel > 0.2 && (
              <div className="text-[10px] text-orange-400/80 mt-1">
                请立即完成封堵与水泥注入！
              </div>
            )}
          </div>
        </div>
      )}

      {selected && selected.sealVerified && (
        <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-emerald-300">封堵已验证</div>
            <div className="text-xs text-emerald-400/80">
              该钻孔处置流程已全部完成
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {OPS.map((op, idx) => {
          const done = completedSteps.includes(op.type);
          const colors = OP_COLORS[op.color];
          return (
            <button
              key={op.type}
              onClick={() => handleClick(op.type)}
              disabled={disabled || done}
              className={cn(
                'w-full flex items-center gap-3 p-3 border rounded-lg transition-all text-left',
                done
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400/70 cursor-default'
                  : cn(
                      colors.btn,
                      !disabled && cn(colors.btnHover, 'cursor-pointer active:scale-[0.99]'),
                      disabled && 'opacity-50 cursor-not-allowed',
                    ),
              )}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-slab-900/50 border border-inherit/40">
                <op.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="font-medium">{op.label}</span>
                  {done && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{op.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getCompletedSteps(bh?: Borehole): string[] {
  if (!bh) return [];
  const steps: string[] = [];
  if (bh.gasPressure >= 0) steps.push('detect_gas');
  if (bh.casingInstalled) steps.push('install_casing');
  if (bh.isPlugged) steps.push('plug');
  if (bh.cementFilled >= 100) steps.push('inject_cement');
  if (bh.sealVerified) steps.push('verify_seal');
  return steps;
}
