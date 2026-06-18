import { useEffect, useRef, useCallback } from 'react';
import { useSceneState, useDrillStore } from '@/store/useDrillStore';
import { useDrillScene } from '@/game/useDrillScene';
import { SCENE_WIDTH, SCENE_HEIGHT } from '@/game/constants';

export function DrillGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sceneState = useSceneState();
  const selectBorehole = useDrillStore((s) => s.selectBorehole);

  const handleBoreholeClick = useCallback(
    (id: string) => {
      selectBorehole(id);
    },
    [selectBorehole],
  );

  const { setState } = useDrillScene({
    canvasRef,
    initialState: sceneState,
    onBoreholeClick: handleBoreholeClick,
  });

  useEffect(() => {
    setState(sceneState);
  }, [sceneState, setState]);

  return (
    <div className="bg-slab-800 border border-slab-600 rounded-xl overflow-hidden shadow-panel">
      <div className="px-4 py-2 border-b border-slab-600 flex items-center justify-between bg-slab-900/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-sm text-slate-300 font-medium">钻孔剖面图</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="font-mono">{SCENE_WIDTH} × {SCENE_HEIGHT}</span>
          <span>点击钻孔选择</span>
        </div>
      </div>
      <div
        className="relative"
        style={{ width: '100%', maxWidth: SCENE_WIDTH, aspectRatio: `${SCENE_WIDTH} / ${SCENE_HEIGHT}` }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
