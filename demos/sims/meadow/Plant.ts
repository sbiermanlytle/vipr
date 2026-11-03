// The plants of Origins V3's meadow (Meadow.ts). Unlike the rest of gaia/, this folder is new
// code, typed throughout; it draws nothing itself, so it runs headless in tests.

export type Genes = number[];
export type RGB = [number, number, number];
export type Kind = 'grass' | 'shrub' | 'tree';

// A seed's genes: its parent's, with one gene nudged up or down by one, unless that would take it
// past -9 or 9. The same rule as Sim.reproduction (../Sim.ts).
export function mutate(genes: Genes, random: () => number = Math.random): Genes {
  const index = Math.floor(random() * genes.length);
  const direction = random() > 0.5 ? 1 : -1;
  const child = [...genes];
  const value = child[index] + direction;
  if (value > -10 && value < 10) child[index] = value;
  return child;
}

// Genes for a first seed: each a whole number from -5 to 5.
export function randomGenes(count: number, random: () => number = Math.random): Genes {
  return Array.from({ length: count }, () => Math.floor(random() * 11) - 5);
}

// What a plant looks like at one moment: its stems and branches, and the round parts on them
// (leaves and flowers), in canvas pixels with y growing downwards.
export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  color: RGB;
}

export interface Blob {
  x: number;
  y: number;
  r: number;
  color: RGB;
}

// A part that catches light: everything within r of x, seen from straight above.
export interface Leaf {
  x: number;
  y: number;
  r: number;
}

export interface Shape {
  segments: Segment[];
  blobs: Blob[];
  leaves: Leaf[];
}

// How a kind of plant lives, the same for every plant of that kind. Energy is in arbitrary units;
// a step is one tick of the meadow.
export interface Habit {
  kind: Kind;
  genes: number;
  // Size grows from 0 to 1, by this much a step, at this cost, while the plant has more than
  // `reserve` energy.
  growthRate: number;
  growthCost: number;
  reserve: number;
  // Each step's upkeep: a base, plus this much more at full size.
  upkeepBase: number;
  upkeepSize: number;
  // Energy made per unit of light.
  efficiency: number;
  // Once this big, a plant with seedCost energy beyond its reserve makes a seed, at most every
  // seedInterval steps, and it stores no more than its reserve and three seeds' worth. The seed starts with seedEnergy and lands up to its parent's
  // seedDistance() away.
  maturity: number;
  seedCost: number;
  seedEnergy: number;
  seedInterval: number;
  // How many steps a dead plant stays on screen, fading, before it's gone.
  decay: number;
  // A seed this close to a living plant of its own kind doesn't sprout: the ground near a plant
  // is thick with its own kind's pests and its own roots, so no kind covers the ground solid.
  spacing: number;
}

export abstract class Plant {
  abstract readonly habit: Habit;
  readonly genes: Genes;
  readonly x: number;
  readonly groundY: number;
  energy: number;
  size = 0;
  age = 0;
  // Steps since it died, or -1 while it lives.
  deadFor = -1;
  sinceSeed = 0;
  private cached: { size: number; dead: boolean; shape: Shape } | undefined;

  constructor(genes: Genes, x: number, groundY: number, energy: number) {
    this.genes = genes;
    this.x = x;
    this.groundY = groundY;
    this.energy = energy;
  }

  get alive(): boolean {
    return this.deadFor < 0;
  }

  // The steps it can live, before it dies of age.
  abstract lifespan(): number;
  abstract seedDistance(): number;
  // Its shape at its current size; `dry` is how far it has faded towards dead, 0 to 1.
  protected abstract build(dry: number): Shape;
  abstract offspring(genes: Genes, x: number, energy: number): Plant;

  shape(): Shape {
    const dead = !this.alive;
    if (!this.cached || this.cached.size !== this.size || this.cached.dead !== dead || dead) {
      const dry = dead ? Math.min(1, 0.4 + this.deadFor / this.habit.decay) : 0;
      const shape = this.build(dry);
      // The dead catch no light.
      this.cached = { size: this.size, dead, shape: dead ? { ...shape, leaves: [] } : shape };
    }
    return this.cached.shape;
  }

  upkeep(): number {
    return this.habit.upkeepBase + this.habit.upkeepSize * this.size * this.size;
  }

  // One step of its life, given the light it caught. Returns a seed's landing offset when it makes
  // one, or null.
  live(light: number, random: () => number): number | null {
    if (!this.alive) {
      this.deadFor++;
      return null;
    }
    const habit = this.habit;
    this.age++;
    this.sinceSeed++;
    // It can store only so much: enough for its reserve and a few seeds.
    this.energy = Math.min(habit.reserve + habit.seedCost * 3, this.energy + light * habit.efficiency - this.upkeep());
    // Growing costs more the bigger the plant already is, so a seedling can afford to grow in
    // shade.
    const growthCost = habit.growthCost * (0.25 + this.size);
    if (this.size < 1 && this.energy > habit.reserve + growthCost) {
      this.size = Math.min(1, this.size + habit.growthRate);
      this.energy -= growthCost;
    }
    let seed: number | null = null;
    if (
      this.size >= habit.maturity &&
      this.sinceSeed >= habit.seedInterval &&
      this.energy > habit.reserve + habit.seedCost
    ) {
      this.energy -= habit.seedCost;
      this.sinceSeed = 0;
      seed = (random() * 2 - 1) * this.seedDistance();
    }
    if (this.energy <= 0 || this.age > this.lifespan()) this.deadFor = 0;
    return seed;
  }

  get gone(): boolean {
    return this.deadFor >= this.habit.decay;
  }
}

// Linear interpolation between two colors.
export function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// A color from hue (0 to 1, around the color wheel), saturation and lightness.
export function hsl(h: number, s: number, l: number): RGB {
  const hue = ((h % 1) + 1) % 1;
  const k = (n: number) => (n + hue * 12) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
}

// What a dying plant fades towards.
export const DRY: RGB = [0.42, 0.33, 0.2];

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
