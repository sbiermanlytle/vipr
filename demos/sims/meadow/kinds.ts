import { DRY, Plant, clamp, hsl, mix } from './Plant';
import type { Blob, Genes, Habit, Leaf, RGB, Segment, Shape } from './Plant';

const DEGREES = Math.PI / 180;

// The end of a line from (x, y), `length` long, at `angle` radians from straight up.
function reach(x: number, y: number, angle: number, length: number): [number, number] {
  return [x + Math.sin(angle) * length, y - Math.cos(angle) * length];
}

/////////////////////////////////////////////////////////////////////////////
// Grass: a tuft of blades. Fast, short-lived, its seeds landing close by.
//
// Genes: 0 blade count, 1 blade height, 2 lean, 3 green's hue.
/////////////////////////////////////////////////////////////////////////////

const GRASS: Habit = {
  kind: 'grass',
  genes: 4,
  growthRate: 0.1,
  growthCost: 0.5,
  reserve: 1,
  upkeepBase: 0.1,
  upkeepSize: 0.3,
  efficiency: 0.45,
  maturity: 0.6,
  seedCost: 4,
  seedEnergy: 3,
  seedInterval: 2,
  decay: 6,
  spacing: 4,
};

export class Grass extends Plant {
  readonly habit = GRASS;

  lifespan(): number {
    return 50;
  }

  seedDistance(): number {
    return 60;
  }

  offspring(genes: Genes, x: number, energy: number): Plant {
    return new Grass(genes, x, this.groundY, energy);
  }

  protected build(dry: number): Shape {
    const [count, height, lean, hue] = this.genes;
    const blades = clamp(3 + Math.round(count / 3), 1, 6);
    const length = (22 + height * 1.2) * (0.25 + 0.75 * this.size);
    const color = mix(hsl(0.3 + hue * 0.008, 0.6, 0.42), DRY, dry);
    const segments: Segment[] = [];
    const leaves: Leaf[] = [];
    for (let i = 0; i < blades; i++) {
      const angle = ((i - (blades - 1) / 2) * 14 + lean * 3) * DEGREES;
      const [x2, y2] = reach(this.x, this.groundY, angle, length);
      segments.push({ x1: this.x, y1: this.groundY, x2, y2, width: 2, color });
      leaves.push({ x: x2, y: y2, r: 3 });
    }
    return { segments, blobs: [], leaves };
  }
}

/////////////////////////////////////////////////////////////////////////////
// Shrub: a stem that branches a few times, leafy, flowering at its tips once mature.
//
// Genes: 0 height, 1 branch angle, 2 branch levels, 3 flower size, 4 flower hue, 5 seed distance.
/////////////////////////////////////////////////////////////////////////////

const SHRUB: Habit = {
  kind: 'shrub',
  genes: 6,
  growthRate: 0.03,
  growthCost: 1,
  reserve: 3,
  upkeepBase: 0.15,
  upkeepSize: 2,
  efficiency: 0.42,
  maturity: 0.75,
  seedCost: 16,
  seedEnergy: 10,
  seedInterval: 3,
  decay: 15,
  spacing: 14,
};

export class Shrub extends Plant {
  readonly habit = SHRUB;

  lifespan(): number {
    return 180;
  }

  seedDistance(): number {
    return 50 + this.genes[5] * 3;
  }

  offspring(genes: Genes, x: number, energy: number): Plant {
    return new Shrub(genes, x, this.groundY, energy);
  }

  protected build(dry: number): Shape {
    const [height, spread, levels, flowerSize, flowerHue] = this.genes;
    const stem = (34 + height * 1.6) * (0.2 + 0.8 * this.size);
    const angle = clamp(30 + spread * 2.5, 8, 55) * DEGREES;
    const depth = clamp(3 + Math.round(levels / 4), 2, 5);
    const wood = mix([0.3, 0.42, 0.18], DRY, dry);
    const leaf = mix([0.24, 0.55, 0.26], DRY, dry);
    const flower = mix(hsl(0.92 + flowerHue * 0.02, 0.85, 0.62), DRY, dry);
    const flowering = this.size >= this.habit.maturity && dry === 0;
    const segments: Segment[] = [];
    const blobs: Blob[] = [];
    const leaves: Leaf[] = [];
    const grow = (x: number, y: number, direction: number, length: number, width: number, level: number) => {
      const [x2, y2] = reach(x, y, direction, length);
      segments.push({ x1: x, y1: y, x2, y2, width, color: wood });
      if (level === depth) {
        blobs.push({ x: x2, y: y2, r: 3.5, color: leaf });
        leaves.push({ x: x2, y: y2, r: 4 });
        if (flowering) blobs.push({ x: x2, y: y2 - 2, r: clamp(3 + flowerSize / 3, 1.5, 6), color: flower });
        return;
      }
      grow(x2, y2, direction - angle, length * 0.62, width * 0.7, level + 1);
      grow(x2, y2, direction + angle, length * 0.62, width * 0.7, level + 1);
    };
    grow(this.x, this.groundY, 0, stem, 1.5 + 2 * this.size, 1);
    return { segments, blobs, leaves };
  }
}

/////////////////////////////////////////////////////////////////////////////
// Tree: Tree2's recursive branching (../Tree2.ts), grown with age, leafy at its tips. Slow and
// costly, its seeds carried far.
//
// Genes: 0 depth, 1 branch angle, 2 shrink, 3 trunk height, 4 lean, 5 leaf size, 6 leaf hue,
// 7 seed distance, 8 lifespan.
/////////////////////////////////////////////////////////////////////////////

const TREE: Habit = {
  kind: 'tree',
  genes: 9,
  growthRate: 0.008,
  growthCost: 2,
  reserve: 5,
  upkeepBase: 0.3,
  upkeepSize: 9,
  efficiency: 0.45,
  maturity: 0.65,
  seedCost: 50,
  seedEnergy: 40,
  seedInterval: 4,
  decay: 40,
  spacing: 45,
};

export class Tree extends Plant {
  readonly habit = TREE;

  lifespan(): number {
    return 500 + this.genes[8] * 20;
  }

  seedDistance(): number {
    return 180 + this.genes[7] * 10;
  }

  offspring(genes: Genes, x: number, energy: number): Plant {
    return new Tree(genes, x, this.groundY, energy);
  }

  protected build(dry: number): Shape {
    const [depthGene, spread, shrinkGene, trunkGene, lean, leafSize, leafHue] = this.genes;
    const maxDepth = clamp(6 + Math.round(depthGene / 4), 4, 8);
    const depth = 1 + Math.floor((maxDepth - 1) * Math.min(1, this.size * 1.4));
    const angle = clamp(25 + spread * 2.2, 10, 50) * DEGREES;
    const shrink = clamp(0.72 + shrinkGene / 90, 0.6, 0.82);
    const trunk = (70 + trunkGene * 2.2) * (0.15 + 0.85 * this.size);
    const tilt = lean * 1.5 * DEGREES;
    const wood: RGB = mix([0.45, 0.3, 0.18], DRY, dry * 0.5);
    const leaf = mix(hsl(0.3 + leafHue * 0.012, 0.55, 0.38), DRY, dry);
    const radius = clamp(4 + leafSize / 3, 2, 7) * (0.5 + 0.5 * this.size);
    const segments: Segment[] = [];
    const blobs: Blob[] = [];
    const leaves: Leaf[] = [];
    const grow = (x: number, y: number, direction: number, length: number, width: number, level: number) => {
      const [x2, y2] = reach(x, y, direction, length);
      segments.push({ x1: x, y1: y, x2, y2, width, color: wood });
      if (level === depth) {
        // A dead tree keeps its branches a while, bare.
        if (dry === 0) {
          blobs.push({ x: x2, y: y2, r: radius, color: leaf });
          leaves.push({ x: x2, y: y2, r: radius });
        }
        return;
      }
      grow(x2, y2, direction - angle + tilt, length * shrink, width * 0.68, level + 1);
      grow(x2, y2, direction + angle + tilt, length * shrink, width * 0.68, level + 1);
    };
    grow(this.x, this.groundY, 0, trunk, 2 + 9 * this.size, 1);
    return { segments, blobs, leaves };
  }
}

export const HABITS = { grass: GRASS, shrub: SHRUB, tree: TREE };
