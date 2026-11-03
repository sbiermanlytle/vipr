import { Grass, HABITS, Shrub, Tree } from './kinds';
import { mutate, randomGenes } from './Plant';
import type { Kind, Plant } from './Plant';

// The ground is cut into columns this many pixels wide, each with its own light.
export const COLUMN = 4;
// The light that falls on each column in a step.
export const SUN = 1.6;
// The share of a column's light that gets past each leaf above it.
export const SHADE = 0.55;
// The chance, each step, that a seed of each kind blows in from beyond the edges, at a random
// place with fresh genes, so a kind that dies out here can come back.
export const SEED_RAIN = 0.02;
// Seeds that would bring the meadow past this many plants don't sprout.
export const MAX_PLANTS = 400;

// Origins V3's world: plants on a strip of ground, competing for the light that falls on it.
// Each step, every column's light reaches the highest leaf over it in full, and each leaf below
// that a share of what got past the one above (SHADE). Plants spend the energy their light makes
// as Plant.live says: growing, making seeds with mutated genes, or dying.
const KINDS: Kind[] = ['grass', 'shrub', 'tree'];

export class Meadow {
  readonly width: number;
  readonly groundY: number;
  readonly random: () => number;
  plants: Plant[] = [];
  steps = 0;

  constructor(width: number, groundY: number, random: () => number = Math.random) {
    this.width = width;
    this.groundY = groundY;
    this.random = random;
  }

  // A meadow sown with a few seeds of each kind, at random places with random genes.
  static sown(width: number, groundY: number, random: () => number = Math.random): Meadow {
    const meadow = new Meadow(width, groundY, random);
    const sow = (kind: Kind, count: number) => {
      for (let i = 0; i < count; i++) {
        const x = 20 + random() * (width - 40);
        meadow.plants.push(meadow.make(kind, randomGenes(HABITS[kind].genes, random), x, HABITS[kind].seedEnergy * 2));
      }
    };
    sow('grass', 10);
    sow('shrub', 4);
    sow('tree', 3);
    return meadow;
  }

  make(kind: Kind, genes: number[], x: number, energy: number): Plant {
    if (kind === 'grass') return new Grass(genes, x, this.groundY, energy);
    if (kind === 'shrub') return new Shrub(genes, x, this.groundY, energy);
    return new Tree(genes, x, this.groundY, energy);
  }

  // The light each plant catches this step, in plant order.
  light(): number[] {
    const columns = Math.ceil(this.width / COLUMN);
    // For each column, the highest point (smallest y) of each plant's leaves over it.
    const over: { y: number; plant: number }[][] = Array.from({ length: columns }, () => []);
    this.plants.forEach((plant, index) => {
      const tops = new Map<number, number>();
      for (const leaf of plant.shape().leaves) {
        const first = Math.max(0, Math.floor((leaf.x - leaf.r) / COLUMN));
        const last = Math.min(columns - 1, Math.floor((leaf.x + leaf.r) / COLUMN));
        for (let column = first; column <= last; column++) {
          const top = tops.get(column);
          if (top === undefined || leaf.y < top) tops.set(column, leaf.y);
        }
      }
      for (const [column, y] of tops) over[column].push({ y, plant: index });
    });
    const caught = new Array<number>(this.plants.length).fill(0);
    for (const column of over) {
      column.sort((a, b) => a.y - b.y);
      let light = SUN;
      for (const { plant } of column) {
        caught[plant] += light;
        light *= SHADE;
      }
    }
    return caught;
  }

  step(): void {
    const caught = this.light();
    const seeds: Plant[] = [];
    this.plants.forEach((plant, index) => {
      const offset = plant.live(caught[index], this.random);
      if (offset === null) return;
      const x = plant.x + offset;
      if (x < 8 || x > this.width - 8) return;
      seeds.push(plant.offspring(mutate(plant.genes, this.random), x, plant.habit.seedEnergy));
    });
    for (const kind of KINDS) {
      if (this.random() >= SEED_RAIN) continue;
      const x = 8 + this.random() * (this.width - 16);
      seeds.push(this.make(kind, randomGenes(HABITS[kind].genes, this.random), x, HABITS[kind].seedEnergy));
    }
    this.plants = this.plants.filter((plant) => !plant.gone);
    for (const seed of seeds) {
      if (this.plants.length >= MAX_PLANTS) break;
      const { kind, spacing } = seed.habit;
      if (this.plants.some((plant) => plant.alive && plant.habit.kind === kind && Math.abs(plant.x - seed.x) < spacing)) continue;
      this.plants.push(seed);
    }
    this.steps++;
  }

  // How many plants of each kind are alive.
  counts(): Record<Kind, number> {
    const counts: Record<Kind, number> = { grass: 0, shrub: 0, tree: 0 };
    for (const plant of this.plants) if (plant.alive) counts[plant.habit.kind]++;
    return counts;
  }

  // The scene as triangles, for one draw call: x, y, r, g, b for each vertex. Trees first, so the
  // smaller plants in front of them stay visible, and dead plants before living ones.
  vertices(): Float32Array {
    const order: Record<Kind, number> = { tree: 0, shrub: 1, grass: 2 };
    const plants = [...this.plants].sort(
      (a, b) => Number(a.alive) - Number(b.alive) || order[a.habit.kind] - order[b.habit.kind],
    );
    const data: number[] = [];
    const vertex = (x: number, y: number, [r, g, b]: number[]) => data.push(x, y, r, g, b);
    for (const plant of plants) {
      const { segments, blobs } = plant.shape();
      for (const s of segments) {
        const length = Math.hypot(s.x2 - s.x1, s.y2 - s.y1) || 1;
        // Half the width, at right angles to the segment; each end tapers to 70% at the tip.
        const nx = (-(s.y2 - s.y1) / length) * (s.width / 2);
        const ny = ((s.x2 - s.x1) / length) * (s.width / 2);
        const tx = nx * 0.7;
        const ty = ny * 0.7;
        vertex(s.x1 - nx, s.y1 - ny, s.color);
        vertex(s.x1 + nx, s.y1 + ny, s.color);
        vertex(s.x2 + tx, s.y2 + ty, s.color);
        vertex(s.x1 - nx, s.y1 - ny, s.color);
        vertex(s.x2 + tx, s.y2 + ty, s.color);
        vertex(s.x2 - tx, s.y2 - ty, s.color);
      }
      for (const b of blobs) {
        // A diamond.
        vertex(b.x, b.y - b.r, b.color);
        vertex(b.x + b.r, b.y, b.color);
        vertex(b.x, b.y + b.r, b.color);
        vertex(b.x, b.y - b.r, b.color);
        vertex(b.x, b.y + b.r, b.color);
        vertex(b.x - b.r, b.y, b.color);
      }
    }
    return new Float32Array(data);
  }
}
