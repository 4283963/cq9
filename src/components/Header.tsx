import { Link, useLocation } from 'react-router-dom';
import { useDrillStore } from '@/store/useDrillStore';
import { Mountain, FileText, RotateCcw, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const location = useLocation();
  const { session, finishSession, isFinished, loading } = useDrillStore();

  const handleFinish = async () => {
    if (session && !isFinished) {
      await finishSession();
    }
  };

  return (
    <header className="relative bg-slab-900 border-b border-slab-700 px-6 py-3">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-ochre-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Mountain className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-wider text-slate-100">
              矿井钻孔安全演练系统
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              DRILL SAFETY TRAINING SYSTEM · v1.0
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            to="/"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              location.pathname === '/'
                ? 'bg-amber-500/10 text-amber-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slab-800',
            )}
          >
            <Mountain className="w-4 h-4" />
            演练界面
          </Link>
          <Link
            to="/records"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              location.pathname === '/records'
                ? 'bg-amber-500/10 text-amber-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slab-800',
            )}
          >
            <FileText className="w-4 h-4" />
            历史记录
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {session && !isFinished && (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              结束演练
            </button>
          )}
          {session && (
            <button
              onClick={() => useDrillStore.getState().reset()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slab-800 hover:bg-slab-700 text-slate-300 rounded-md text-sm font-medium transition-colors border border-slab-600"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
