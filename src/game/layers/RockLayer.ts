import { Container, Graphics, Text } from 'pixi.js';
import { STRATA_LAYERS, COLORS, SCENE_WIDTH, GROUND_Y } from '../constants';

export class RockLayer {
  public container: Container;
  private strata: Graphics[] = [];

  constructor() {
    this.container = new Container();
    this.container.label = 'RockLayer';
    this.build();
  }

  private build(): void {
    const bg = new Graphics();
    bg.rect(0, 0, SCENE_WIDTH, GROUND_Y + 600);
    bg.fill(COLORS.background);
    this.container.addChild(bg);

    const ground = new Graphics();
    ground.rect(0, 0, SCENE_WIDTH, GROUND_Y);
    ground.fill(COLORS.ground);
    this.container.addChild(ground);

    const groundLabel = new Text({
      text: '地表 ▼',
      style: {
        fill: 0xf5f5f4,
        fontFamily: 'IBM Plex Sans, sans-serif',
        fontSize: 14,
      },
    });
    groundLabel.x = 20;
    groundLabel.y = 28;
    this.container.addChild(groundLabel);

    for (const layer of STRATA_LAYERS) {
      const g = new Graphics();
      const y = GROUND_Y + layer.top;
      const height = layer.bottom - layer.top;

      g.rect(0, y, SCENE_WIDTH, height);
      g.fill(layer.color);

      for (let i = 0; i < 25; i++) {
        const rx = Math.random() * SCENE_WIDTH;
        const ry = y + Math.random() * height;
        const rw = 6 + Math.random() * 22;
        const rh = 2 + Math.random() * 4;
        g.rect(rx, ry, rw, rh);
        g.fill({ color: 0x000000, alpha: layer.noise * 0.5 });
      }

      for (let i = 0; i < 12; i++) {
        const rx = Math.random() * SCENE_WIDTH;
        const ry = y + Math.random() * height;
        g.circle(rx, ry, 1 + Math.random() * 2);
        g.fill({ color: 0x000000, alpha: layer.noise * 0.3 });
      }

      const seam = new Graphics();
      seam.moveTo(0, y);
      for (let x = 0; x <= SCENE_WIDTH; x += 10) {
        seam.lineTo(x, y + Math.sin(x * 0.08) * 1.5);
      }
      seam.stroke({ width: 1.5, color: 0x000000, alpha: 0.4 });
      this.container.addChild(seam);

      this.container.addChild(g);
      this.strata.push(g);

      const label = new Text({
        text: layer.name,
        style: {
          fill: 0xf5f5f4,
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: 12,
        },
      });
      label.x = 20;
      label.y = y + 8;
      label.alpha = 0.7;
      this.container.addChild(label);

      const depthLabel = new Text({
        text: `${layer.bottom} m`,
        style: {
          fill: 0xf5f5f4,
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 11,
        },
      });
      depthLabel.x = SCENE_WIDTH - 70;
      depthLabel.y = y + height - 18;
      depthLabel.alpha = 0.5;
      this.container.addChild(depthLabel);
    }

    const grid = new Graphics();
    for (let y = 0; y <= 600; y += 50) {
      grid.moveTo(0, GROUND_Y + y);
      grid.lineTo(SCENE_WIDTH, GROUND_Y + y);
    }
    grid.stroke({ width: 1, color: COLORS.grid, alpha: 0.3 });
    this.container.addChild(grid);
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
