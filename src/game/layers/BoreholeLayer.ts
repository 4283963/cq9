import { Container, Graphics, Text } from 'pixi.js';
import type { Borehole } from 'shared/types';
import {
  COLORS,
  BOREHOLE_WIDTH,
  CASING_THICKNESS,
  getCasingTop,
  getCasingBottom,
  getInnerHalfWidth,
} from '../constants';

export class BoreholeLayer {
  public container: Container;
  private boreholeGraphics: Map<string, {
    casing: Graphics;
    plug: Graphics;
    label: Text;
    highlight: Graphics;
  }> = new Map();

  constructor() {
    this.container = new Container();
    this.container.label = 'BoreholeLayer';
  }

  public setBoreholes(boreholes: Borehole[], selectedId: string | null): void {
    for (const [id, g] of this.boreholeGraphics) {
      g.casing.destroy();
      g.plug.destroy();
      g.label.destroy();
      g.highlight.destroy();
    }
    this.boreholeGraphics.clear();
    this.container.removeChildren();

    for (const bh of boreholes) {
      this.createBorehole(bh, selectedId === bh.id);
    }
  }

  public update(boreholes: Borehole[], selectedId: string | null): void {
    const currentIds = new Set(boreholes.map(b => b.id));
    for (const [id] of this.boreholeGraphics) {
      if (!currentIds.has(id)) {
        const g = this.boreholeGraphics.get(id)!;
        g.casing.destroy();
        g.plug.destroy();
        g.label.destroy();
        g.highlight.destroy();
        this.boreholeGraphics.delete(id);
      }
    }

    for (const bh of boreholes) {
      if (!this.boreholeGraphics.has(bh.id)) {
        this.createBorehole(bh, selectedId === bh.id);
      } else {
        this.updateBorehole(bh, selectedId === bh.id);
      }
    }
  }

  private createBorehole(bh: Borehole, selected: boolean): void {
    const casing = new Graphics();
    const plug = new Graphics();
    const label = new Text({
      text: `${bh.name}\n${bh.depth} m`,
      style: {
        fill: 0xe5e7eb,
        fontFamily: 'IBM Plex Sans, sans-serif',
        fontSize: 11,
        align: 'center',
      },
    });
    const highlight = new Graphics();

    this.boreholeGraphics.set(bh.id, { casing, plug, label, highlight });
    this.container.addChild(highlight, casing, plug, label);
    this.updateBorehole(bh, selected);
  }

  private updateBorehole(bh: Borehole, selected: boolean): void {
    const g = this.boreholeGraphics.get(bh.id)!;
    const { casing, plug, label, highlight } = g;

    casing.clear();
    plug.clear();
    highlight.clear();

    const x = bh.x;
    const halfW = BOREHOLE_WIDTH / 2;
    const top = getCasingTop();
    const bottom = getCasingBottom(bh.depth);

    if (selected) {
      highlight.roundRect(x - halfW - 10, top - 10, BOREHOLE_WIDTH + 20, bottom - top + 20, 6);
      highlight.stroke({ width: 2, color: COLORS.selectedGlow });
      highlight.fill({ color: COLORS.selectedGlow, alpha: 0.08 });
    }

    if (bh.casingInstalled) {
      casing.roundRect(x - halfW, top, BOREHOLE_WIDTH, bottom - top, 3);
      casing.fill(COLORS.casing);
      casing.roundRect(x - halfW + CASING_THICKNESS, top + CASING_THICKNESS, BOREHOLE_WIDTH - CASING_THICKNESS * 2, bottom - top - CASING_THICKNESS * 2, 2);
      casing.cut();
      casing.fill(0x000000);

      for (let y = top + 30; y < bottom; y += 60) {
        casing.roundRect(x - halfW, y, BOREHOLE_WIDTH, 8, 2);
        casing.fill(COLORS.casingDark);
      }

      casing.roundRect(x - halfW, top, BOREHOLE_WIDTH, 14, 2);
      casing.fill(COLORS.casingHi);
    } else {
      casing.roundRect(x - halfW, top, BOREHOLE_WIDTH, bottom - top, 3);
      casing.stroke({ width: 1.5, color: COLORS.casing, alpha: 0.4 });
    }

    if (bh.isPlugged) {
      const plugY = top + (bottom - top) * 0.35;
      plug.roundRect(x - halfW + 4, plugY, BOREHOLE_WIDTH - 8, 16, 4);
      plug.fill(COLORS.seal);
      const plugLabel = new Text({
        text: '封',
        style: {
          fill: 0x1f2937,
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: 10,
          fontWeight: '700',
        },
      });
      plugLabel.anchor.set(0.5);
      plugLabel.x = x;
      plugLabel.y = plugY + 8;
      plug.addChild(plugLabel);
    }

    label.anchor.set(0.5, 1);
    label.x = x;
    label.y = top - 14;

    const statusText: string[] = [];
    if (bh.hasGas && bh.gasPressure > 0 && !bh.sealVerified) {
      statusText.push(`瓦斯 ${bh.gasPressure.toFixed(1)} MPa`);
    }
    if (bh.sealVerified) {
      statusText.push('封堵完成 ✓');
    } else if (bh.cementFilled > 0) {
      statusText.push(`水泥 ${bh.cementFilled}%`);
    }
    if (statusText.length > 0) {
      const statusLabel = new Text({
        text: statusText.join('\n'),
        style: {
          fill: bh.sealVerified ? 0x22c55e : 0xf59e0b,
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 10,
          align: 'center',
        },
      });
      statusLabel.anchor.set(0.5, 0);
      statusLabel.x = x;
      statusLabel.y = bottom + 8;
      plug.addChild(statusLabel);
    }
  }

  public hitTest(x: number, y: number): string | null {
    for (const [id, g] of this.boreholeGraphics) {
      if (g.casing.containsPoint({ x, y })) {
        return id;
      }
      if (g.highlight.containsPoint({ x, y })) {
        return id;
      }
    }
    return null;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
