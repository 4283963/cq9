import { useEffect, useRef, useCallback } from 'react';
import { DrillScene, BoreholeClickHandler } from './DrillScene';
import type { DrillSceneState } from 'shared/types';

interface UseDrillSceneOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  initialState: DrillSceneState;
  onBoreholeClick?: BoreholeClickHandler;
}

interface UseDrillSceneReturn {
  sceneRef: React.MutableRefObject<DrillScene | null>;
  setState: (state: DrillSceneState) => void;
  resize: (width: number, height: number) => void;
}

export function useDrillScene({
  canvasRef,
  initialState,
  onBoreholeClick,
}: UseDrillSceneOptions): UseDrillSceneReturn {
  const sceneRef = useRef<DrillScene | null>(null);

  const setState = useCallback((state: DrillSceneState) => {
    if (sceneRef.current) {
      sceneRef.current.setState(state);
    }
  }, []);

  const resize = useCallback((width: number, height: number) => {
    if (sceneRef.current) {
      sceneRef.current.resize(width, height);
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new DrillScene(initialState);
    sceneRef.current = scene;
    scene.setBoreholeClickHandler(onBoreholeClick ?? null);

    let aborted = false;

    scene.init(canvasRef.current).catch((err) => {
      if (!aborted) {
        console.error('Failed to init DrillScene:', err);
      }
    });

    return () => {
      aborted = true;
      scene.destroy();
      sceneRef.current = null;
    };
  }, [canvasRef, initialState, onBoreholeClick]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setBoreholeClickHandler(onBoreholeClick ?? null);
    }
  }, [onBoreholeClick]);

  return { sceneRef, setState, resize };
}
