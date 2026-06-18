import { Container, Graphics } from 'pixi.js';
import type { Borehole } from 'shared/types';
import { COLORS, BOREHOLE_WIDTH, GROUND_Y, getCasingBottom, getInnerHalfWidth } from '../constants';

interface Particle {
  x: number;
  y: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  boreholeId: string;
}

export class GasParticleLayer {
  public container: Container;
  private particles: Particle[] = [];
  private pool: Particle[] = [];
  private emitTimers: Map<string, number> = new Map();
  private lastTime = 0;
  private boreholes: Borehole[] = [];
  private gasIntensity = 1;

  constructor() {
    this.container = new Container();
    this.container.label = 'GasParticleLayer';
    for (let i = 0; i < 120; i++) {
      this.pool.push({
        x: 0, y: 0, vy: 0, size: 0, alpha: 0, life: 0, maxLife: 0, boreholeId: '',
      });
    }
  }

  public updateState(boreholes: Borehole[], gasIntensity: number): void {
    this.boreholes = boreholes;
    this.gasIntensity = gasIntensity;
  }

  public tick(time: number): void {
    if (this.lastTime === 0) this.lastTime = time;
    const dt = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;

    for (const bh of this.boreholes) {
      if (!bh.hasGas || bh.sealVerified) {
        this.emitTimers.delete(bh.id);
        continue;
      }

      const timer = this.emitTimers.get(bh.id) ?? 0;
      const newTimer = timer + dt;
      this.emitTimers.set(bh.id, newTimer);

      const emitRate = 0.04 / Math.max(0.3, this.gasIntensity);
      if (newTimer > emitRate) {
        this.emitTimers.set(bh.id, 0);
        this.emitParticle(bh);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, (p.life / p.maxLife) * 0.7);
      p.size *= 0.998;

      if (p.life <= 0 || p.y < GROUND_Y - 20) {
        this.pool.push(p);
        this.particles.splice(i, 1);
      }
    }

    this.render();
  }

  private emitParticle(bh: Borehole): void {
    if (this.pool.length === 0) return;

    const p = this.pool.pop()!;
    const bottom = getCasingBottom(bh.depth);
    const top = GROUND_Y + 40;
    const innerHalfW = getInnerHalfWidth();

    p.boreholeId = bh.id;
    p.x = bh.x + (Math.random() - 0.5) * (innerHalfW * 2 - 4);
    p.y = bottom - 20 - Math.random() * (bottom - top) * 0.4;
    p.vy = -60 - Math.random() * 80 * this.gasIntensity;
    p.size = 3 + Math.random() * 4;
    p.maxLife = 2.5 + Math.random() * 2;
    p.life = p.maxLife;
    p.alpha = 0.6;

    this.particles.push(p);
  }

  private render(): void {
    this.container.removeChildren();

    for (const bh of this.boreholes) {
      if (!bh.hasGas || bh.sealVerified) continue;

      const bottom = getCasingBottom(bh.depth);
      const source = new Graphics();
      source.circle(bh.x, bottom - 10, 10 + Math.sin(performance.now() * 0.005) * 2);
      source.fill({ color: COLORS.gas, alpha: 0.6 });
      source.circle(bh.x, bottom - 10, 4);
      source.fill({ color: COLORS.gasGlow, alpha: 0.9 });
      this.container.addChild(source);
    }

    for (const p of this.particles) {
      const g = new Graphics();
      g.circle(p.x, p.y, p.size);
      g.fill({ color: COLORS.gasGlow, alpha: p.alpha });
      g.circle(p.x, p.y, p.size * 0.6);
      g.fill({ color: COLORS.gas, alpha: p.alpha * 1.2 });
      this.container.addChild(g);
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    this.particles = [];
    this.pool = [];
  }
}
