import { useDrillStore } from '@/store/useDrillStore';
import { Header } from '@/components/Header';
import { DrillGame } from '@/components/DrillGame';
import { ControlPanel } from '@/components/ControlPanel';
import { StatusPanel } from '@/components/StatusPanel';
import { OperationLog } from '@/components/OperationLog';
import { StartModal } from '@/components/StartModal';
import { FinishModal } from '@/components/FinishModal';

export default function Home() {
  const session = useDrillStore((s) => s.session);
  const error = useDrillStore((s) => s.error);

  return (
    <div className="h-screen flex flex-col bg-slab-950">
      <Header />

      <main className="flex-1 p-6 overflow-auto scrollbar-thin relative bg-grain">
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300 text-sm max-w-4xl mx-auto">
            {error}
          </div>
        )}

        <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <DrillGame />

            <div className="h-[240px]">
              <OperationLog />
            </div>
          </div>

          <div className="space-y-6">
            <StatusPanel />
            <ControlPanel />
          </div>
        </div>
      </main>

      <StartModal open={!session} />
      <FinishModal />
    </div>
  );
}
