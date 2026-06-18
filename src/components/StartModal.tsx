import { useState } from 'react';
import { User, Play } from 'lucide-react';
import { useDrillStore } from '@/store/useDrillStore';
import { cn } from '@/lib/utils';

interface StartModalProps {
  open: boolean;
  onClose?: () => void;
}

export function StartModal({ open }: StartModalProps) {
  const [name, setName] = useState('');
  const startSession = useDrillStore((s) => s.startSession);
  const loading = useDrillStore((s) => s.loading);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      await startSession(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slab-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slab-800 border border-slab-600 rounded-xl p-8 shadow-panel animate-fade-in">
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

        <h2 className="font-display text-3xl font-bold text-amber-400 mb-2 text-center tracking-wider">
          废旧矿井钻孔安全演练
        </h2>
        <p className="text-slate-400 text-sm text-center mb-8">
          请输入演练人员姓名或工号开始操作
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              演练人员
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入姓名或工号"
                className="w-full pl-10 pr-4 py-3 bg-slab-900 border border-slab-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                autoFocus
                maxLength={32}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg font-medium text-lg transition-all',
              name.trim() && !loading
                ? 'bg-amber-500 text-slate-900 hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20'
                : 'bg-slab-700 text-slate-500 cursor-not-allowed',
            )}
          >
            <Play className="w-5 h-5" />
            {loading ? '启动中...' : '开始演练'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slab-600">
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {[
              { step: '1', label: '检测气体' },
              { step: '2', label: '安装套管' },
              { step: '3', label: '封堵钻孔' },
              { step: '4', label: '注入水泥' },
              { step: '5', label: '验证封堵' },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-slab-700 text-slate-400 font-mono text-xs flex items-center justify-center">
                  {s.step}
                </div>
                <span className="text-slate-500 text-[10px]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
