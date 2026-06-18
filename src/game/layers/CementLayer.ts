import { Container, Graphics } from 'pixi.js';
import type { Borehole } from 'shared/types';
import { COLORS, BOREHOLE_WIDTH, CASING_THICKNESS, GROUND_Y, MAX_DEPTH } from '../constants';

export class CementLayer {
  public container: Container;
  private targetFill: Map<string, number> = new Map();
  private currentFill: Map<string, number> = new Map();

  constructor() {
    this.container = new Container();
    this.container.label = 'CementLayer';
  }

  public updateState(boreholes: Borehole[]): void {
    for (const bh of boreholes) {
      this.targetFill.set(bh.id, bh.cementFilled);
      if (!this.currentFill.has(bh.id)) {
        this.currentFill.set(bh.id, 0);
      }
    }
  }

  public tick(_time: number): void {
    this.container.removeChildren();

    for (const [id, target] of this.targetFill) {
      const current = this.currentFill.get(id) ?? 0;
      const next = current + (target - current) * 0.04;
      this.currentFill.set(id, next);

      if (next < 1) continue;

      const bh = this.findBorehole(id);
      if (!bh) continue;

      const g = new Graphics();
      const x = bh.x;
      const halfW = BOREHOLE_WIDTH / 2 - CASING_THICKNESS;
      const top = GROUND_Y;
      const bottom = GROUND_Y + (bh.depth / 600) * MAX_DEPTH;
      const fillHeight = (next / 100) * (bottom - top - CASING_THICKNESS);
      const fillTop = bottom - fillHeight - CASING_THICKNESS;

      g.roundRect(x - halfW, fillTop, halfW * 2, bottom - fillTop - CASING_THICKNESS, 2);
      g.fill(COLORS.cement);

      const surface = new Graphics();
      surface.roundRect(x - halfW + 2, fillTop, halfW * 2 - 4, 6, 2);
      surface.fill(COLORS.cementTop);
      g.addChild(surface);

      const bubbleCount = Math.floor(next / 10);
      for (let i = 0; i < bubbleCount; i++) {
        const bx = x - halfW + 4 + Math.random() * (halfW * 2 - 8);
        const by = fillTop + 10 + Math.random() * (bottom - fillTop - 40);
        const bubble = new Graphics();
        bubble.circle(bx, by, 1 + Math.random() * 2);
        bubble.fill({ color: 0xffffff, alpha: 0.6 });
        g.addChild(bubble);
      }

      this.container.addChild(g);
    }
  }

  private boreholes: Borehole[] = [];

  public setBoreholes(boreholes: Borehole[]): void {
    this.boreholes = boreholes;
  }

  private findBorehole(id: string): Borehole | undefined {
    return this.boreholes.find(b => b.id === id);
  }

  public reset(): void {
    this.targetFill.clear();
    this.currentFill.clear();
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
