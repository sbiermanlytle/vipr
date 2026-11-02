import * as vipr from '../../src';
import { Log } from '../core';
import { Sim } from './Sim';

///////////////////////////////////////////////////////////////////////////
// Genes
///////////////////////////////////////////////////////////////////////////
// 0: preferred rotation of first growth
//

export class SimplePlantV2Cell {
  static energyCreateCost: number = 2;

  dna: Array<number>;
  parent: SimplePlantV2;

  prevCell: SimplePlantV2Cell;
  nextCell: SimplePlantV2Cell;

  originX: number;
  originY: number;
  width: number;
  height: number;
  rotation: number;
  taper: number;
  depth: number;

  constructor(
    dna: Array<number>,
    parent: SimplePlantV2Cell,
    origin: Array<number>,
    width: number,
    height: number,
    rotation: number,
    taper: number,
    depth: number
  ) {
    this.dna = dna;
    this.parent = parent;
    this.originX = origin[0];
    this.originY = origin[1];
    this.width = width;
    this.height = height;
    this.rotation = rotation;
    this.taper = taper;
    this.depth = depth;
  }

  getPositions(): Array<number> {
    let T = vipr.getRectangleCoordinates(
      [0, 0],
      this.width,
      this.height,
      this.rotation,
      this.taper
    );

    let positions = [
      T[0] + this.originX, T[1] + this.originY, // A
      T[2] + this.originX, T[3] + this.originY, // D
      T[4] + this.originX, T[5] + this.originY, // B
      T[6] + this.originX, T[7] + this.originY, // B
      T[8] + this.originX, T[9] + this.originY, // D
      T[10] + this.originX, T[11] + this.originY  // C
    ]

    if (this.nextCell) {
      positions = positions.concat(this.nextCell.getPositions());
    }

    return positions;
  }

  destroySelf(): void {
    this.parent.nextCell = null;
  }

  createNextCell(): number {
    let rotation = this.rotation;

    if (this.depth === 0) {
      rotation = this.dna[0] / 10 * 360;
    }

    this.nextCell = new SimplePlantV2Cell(
      this.dna,
      this,
      [this.originX, this.originY],
      this.width/2,
      this.height/2,
      rotation,
      this.taper,
      this.depth + 1
    );

    return SimplePlantV2Cell.energyCreateCost;
  }

  updateChildOrigins(): void {
    if (!this.nextCell) {
      return;
    }

    let newX = this.originX;
    let newY = this.originY + this.height / 2;

    if (this.depth > 0) {
      let newOrigin = vipr.computeNewOrigin(this.originX, this.originY, -this.rotation, this.height);
      newX = newOrigin[0];
      newY = newOrigin[1];
    }

    this.nextCell.originX = newX;
    this.nextCell.originY = newY;

    this.nextCell.updateChildOrigins();
  }

  internalDevelopment(totalEnergy): number {
    this.width += 0.5;
    this.height += 1;
    if (this.depth === 0) {
      this.originY -= 0.5;
    }
    this.updateChildOrigins();

    return 0.5;
  }

  reverseInternalDevelopment(totalEnergy): number {
    this.width -= 0.5;
    this.height -= 1;
    if (this.depth === 0) {
      this.originY += 0.5;
    }
    this.updateChildOrigins();

    return 0.5;
  }

  development(totalEnergy): number {
    let energyCost = 0;

    if (!this.nextCell) {
      energyCost += this.createNextCell();
    } else {
      energyCost += this.nextCell.development(totalEnergy);
    }

    energyCost += this.internalDevelopment(totalEnergy);

    return energyCost;
  }

  reverseDevelopment(totalEnergy): number {
    let energyRegained = 0;

    if (!this.nextCell) {
      this.destroySelf();
      energyRegained += SimplePlantV2Cell.energyCreateCost;
    } else {
      energyRegained += this.nextCell.reverseDevelopment(totalEnergy);
      energyRegained += this.reverseInternalDevelopment(totalEnergy);
    }

    return energyRegained;
  }
}

export class SimplePlantV2 extends Sim {
  static seedWidth: number = 4;
  static seedHeight: number = 4;
  static seedTaper: number = 1;
  static seedEnergy: number = 100;

  energy: number = SimplePlantV2.seedEnergy;
  originX: number;
  originY: number;

  rootCell: SimplePlantV2Cell;

  /////////////////////////////////////////////////////////////////////////
  // Constructor
  /////////////////////////////////////////////////////////////////////////
  constructor(dna: Array<number>, origin: Array<number> = [0, 0]) {
    super(dna);
    this.originX = origin[0];
    this.originY = origin[1];

    // create Seed
    this.rootCell = new SimplePlantV2Cell(
      dna,
      this,
      [this.originX, this.originY - SimplePlantV2.seedHeight / 2],
      SimplePlantV2.seedWidth,
      SimplePlantV2.seedHeight,
      0,
      SimplePlantV2.seedTaper,
      0
    );
  }

  /////////////////////////////////////////////////////////////////////////
  // Accessors
  /////////////////////////////////////////////////////////////////////////
  getOrigin(): Array<number> {
    return [this.originX, this.originY];
  }

  /////////////////////////////////////////////////////////////////////////
  // Sim Functions
  /////////////////////////////////////////////////////////////////////////
  getPositions(): Array<number> {
    return this.rootCell.getPositions();
  }

  development(): number {
    const energyCost = this.rootCell.development(this.energy);
    this.energy -= energyCost;
    return energyCost;
  }

  reverseDevelopment(): number {
    const energyRegained = this.rootCell.reverseDevelopment();
    this.energy += energyRegained;
    return energyRegained;
  }

  reproduction(maxMutation = 1): void {
    return super.reproduction(maxMutation);
  }
}
