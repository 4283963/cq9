import { Container, Graphics } from 'pixi.js';
import type { Borehole } from 'shared/types';
import { COLORS, GROUND_Y, getCasingTop, getCasingBottom } from '../constants';

interface LeakParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  boreholeId: string;
}

export class GasLeakLayer {
  public container: Container;
  private particles: LeakParticle[] = [];
  private pool: LeakParticle[] = [];
  private boreholes: Borehole[] = [];
  private lastTime = 0;
  private leakTimers: Map<string, number> = new Map();

  constructor() {
    this.container = new Container();
    this.container.label = 'GasLeakLayer';
    for (let i = 0; i < 200; i++) {
      this.pool.push({
        x: 0, y: 0, vx: 0, vy: 0, size: 0, alpha: 0, life: 0, maxLife: 0, boreholeId: '',
      });
    }
  }

  public updateState(boreholes: Borehole[]): void {
    this.boreholes = boreholes;
  }

  public tick(time: number): void {
    if (this.lastTime === 0) this.lastTime = time;
    const dt = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;

    for (const bh of this.boreholes) {
      if (!bh.hasGas || bh.gasLeakLevel <= 0.05) {
        this.leakTimers.delete(bh.id);
        continue;
      }

      const timer = this.leakTimers.get(bh.id) ?? 0;
      const newTimer = timer + dt;
      this.leakTimers.set(bh.id, newTimer);

      const emitRate = 0.03 / Math.max(0.15, bh.gasLeakLevel);
      if (newTimer > emitRate) {
        this.leakTimers.set(bh.id, 0);
        this.emitParticle(bh);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, (p.life / p.maxLife) * 0.5);
      p.size *= 1.005;

      if (p.life <= 0 || p.y < GROUND_Y - 50 || Math.abs(p.vx) > 400) {
        this.pool.push(p);
        this.particles.splice(i, 1);
      }
    }

    this.render();
  }

  private emitParticle(bh: Borehole): void {
    if (this.pool.length === 0) return;

    const p = this.pool.pop()!;
    const casingTop = getCasingTop();
    const casingBottom = getCasingBottom(bh.depth);

    const leakIntensity = bh.gasLeakLevel;
    const spreadZone = Math.random() < 0.6 ? 'bottom' : (Math.random() < 0.5 ? 'middle' : 'top');

    let sourceY: number;
    if (spreadZone === 'bottom') {
      sourceY = casingBottom - 30 - Math.random() * 50;
    } else if (spreadZone === 'middle') {
      sourceY = casingTop + (casingBottom - casingTop) * (0.3 + Math.random() * 0.4);
    } else {
      sourceY = casingTop - 5 - Math.random() * 20;
    }

    p.boreholeId = bh.id;
    p.x = bh.x + (Math.random() - 0.5) * 8;
    p.y = sourceY;

    const horizontalDir = Math.random() < 0.5 ? -1 : 1;
    const horizontalSpeed = (40 + Math.random() * 60) * leakIntensity * 1.5;
    const verticalSpeed = -20 - Math.random() * 40 * leakIntensity;

    p.vx = horizontalDir * horizontalSpeed;
    p.vy = verticalSpeed;
    p.size = 6 + Math.random() * 8 * leakIntensity;
    p.maxLife = 2.5 + Math.random() * 2;
    p.life = p.maxLife;
    p.alpha = 0.5 * leakIntensity;

    this.particles.push(p);
  }

  private render(): void {
    this.container.removeChildren();

    for (const bh of this.boreholes) {
      if (!bh.hasGas || bh.gasLeakLevel <= 0.05) continue;

      const casingBottom = getCasingBottom(bh.depth);
      const source = new Graphics();
      const pulseSize = 14 + Math.sin(performance.now() * 0.008) * 4;
      source.circle(bh.x, casingBottom - 15, pulseSize * (1 + bh.gasLeakLevel * 0.5));
      source.fill({ color: 0xf97316, alpha: 0.4 * bh.gasLeakLevel });
      source.circle(bh.x, casingBottom - 15, 6);
      source.fill({ color: 0xfbbf24, alpha: 0.8 * bh.gasLeakLevel });
      this.container.addChild(source);
    }

    for (const p of this.particles) {
      const g = new Graphics();
      g.circle(p.x, p.y, p.size);
      g.fill({ color: 0xf97316, alpha: p.alpha * 0.6 });
      g.circle(p.x, p.y, p.size * 0.5);
      g.fill({ color: 0xfbbf24, alpha: p.alpha });
      this.container.addChild(g);
    }
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    this.particles = [];
    this.pool = [];
  }
}
