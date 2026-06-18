import { Application, Container } from 'pixi.js';
import type { DrillSceneState, Borehole } from 'shared/types';
import { SCENE_WIDTH, SCENE_HEIGHT } from './constants';
import { RockLayer } from './layers/RockLayer';
import { BoreholeLayer } from './layers/BoreholeLayer';
import { GasParticleLayer } from './layers/GasParticleLayer';
import { CementLayer } from './layers/CementLayer';

export type BoreholeClickHandler = (boreholeId: string) => void;

export class DrillScene {
  private app: Application;
  private root: Container;
  private rockLayer: RockLayer;
  private boreholeLayer: BoreholeLayer;
  private gasLayer: GasParticleLayer;
  private cementLayer: CementLayer;
  private state: DrillSceneState;
  private onBoreholeClick: BoreholeClickHandler | null = null;
  private tickerBound: () => void;
  private ready = false;

  constructor(initialState: DrillSceneState) {
    this.state = initialState;

    this.app = new Application();
    this.root = new Container();

    this.rockLayer = new RockLayer();
    this.boreholeLayer = new BoreholeLayer();
    this.gasLayer = new GasParticleLayer();
    this.cementLayer = new CementLayer();

    this.tickerBound = this.tick.bind(this);
  }

  public async init(canvas: HTMLCanvasElement): Promise<void> {
    await this.app.init({
      width: SCENE_WIDTH,
      height: SCENE_HEIGHT,
      canvas,
      antialias: true,
      backgroundColor: 0x0e1116,
      resolution: window.devicePixelRatio || 1,
    });

    this.root.addChild(this.rockLayer.container);
    this.root.addChild(this.cementLayer.container);
    this.root.addChild(this.boreholeLayer.container);
    this.root.addChild(this.gasLayer.container);

    this.app.stage.addChild(this.root);

    this.boreholeLayer.setBoreholes(this.state.boreholes, this.state.selectedBoreholeId);
    this.cementLayer.setBoreholes(this.state.boreholes);
    this.cementLayer.updateState(this.state.boreholes);
    this.gasLayer.updateState(this.state.boreholes, this.state.gasIntensity);

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerdown', (e) => {
      if (!this.onBoreholeClick) return;
      const pos = e.global;
      const id = this.boreholeLayer.hitTest(pos.x, pos.y);
      if (id) {
        this.onBoreholeClick(id);
      }
    });

    this.app.ticker.add(this.tickerBound);
    this.ready = true;
  }

  public setState(state: DrillSceneState): void {
    this.state = state;
    if (!this.ready) return;

    this.boreholeLayer.update(state.boreholes, state.selectedBoreholeId);
    this.cementLayer.setBoreholes(state.boreholes);
    this.cementLayer.updateState(state.boreholes);
    this.gasLayer.updateState(state.boreholes, state.gasIntensity);
  }

  public setBoreholeClickHandler(handler: BoreholeClickHandler | null): void {
    this.onBoreholeClick = handler;
  }

  public resize(width: number, height: number): void {
    if (!this.ready) return;
    this.app.renderer.resize(width, height);
  }

  public getBoreholes(): Borehole[] {
    return this.state.boreholes;
  }

  private tick(): void {
    const t = this.app.ticker.lastTime;
    this.gasLayer.tick(t);
    this.cementLayer.tick(t);
  }

  public destroy(): void {
    if (this.ready) {
      try {
        this.app.ticker.remove(this.tickerBound);
      } catch {
        // ignore if not registered
      }
    }
    try {
      this.rockLayer.destroy();
      this.boreholeLayer.destroy();
      this.gasLayer.destroy();
      this.cementLayer.destroy();
      this.root.destroy({ children: true });
      this.app.destroy(false, { children: true, texture: true });
    } catch {
      // ignore cleanup errors
    }
    this.ready = false;
  }
}
