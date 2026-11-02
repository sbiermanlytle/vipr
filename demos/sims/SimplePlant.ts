import * as vipr from '../../src';
import { Log } from '../core';
import { Sim } from './Sim';

///////////////////////////////////////////////////////////////////////////
// Genes
///////////////////////////////////////////////////////////////////////////
// 0: preferred rotation of first growth
//

export class SimplePlantCell {
  dna: Array<number>;
  parent: SimplePlant;

  prevCell: SimplePlantCell;
  nextCell: SimplePlantCell;

  originX: number;
  originY: number;
  width: number;
  height: number;
  rotation: number;
  taper: number;
  depth: number;

  constructor(
    dna: Array<number>,
    parent: SimplePlantCell,
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
    let positions = vipr.getRectangleCoordinates(
      [this.originX, this.originY],
      this.width,
      this.height,
      this.rotation,
      this.taper
    );

    if (this.nextCell) {
      positions = positions.concat(this.nextCell.getPositions());
    }

    return positions;
  }

  destroySelf(): void {
    this.parent.nextCell = null;
  }

  createNextCell(): void {
    let rotation = this.rotation;
    if (this.depth === 0) {
      rotation = this.dna[0] / 10 * 360;
    }

    let originX = this.originX;
    let originY = this.originY;
    if (this.depth > 1) {
      originY += this.height;
    }

    this.nextCell = new SimplePlantCell(
      this.dna,
      this,
      [originX, originY],
      this.width/2,
      this.height/2,
      rotation,
      this.taper,
      this.depth + 1
    );
  }

  updateChildOrigins(): void {
    if (!this.nextCell) {
      return;
    }

    if (this.depth === 0) {
      this.nextCell.originX = this.originX;
      this.nextCell.originY = this.originY;
    } else {
      this.nextCell.originX = this.originX;
      this.nextCell.originY = this.originY + this.height;
    }

    this.nextCell.updateChildOrigins();
  }

  internalDevelopment(): void {
    this.width += 2;
    this.height += 2;
    if (this.depth === 0) {
      this.originY -= 1;
    }
    this.updateChildOrigins();
  }

  reverseInternalDevelopment(): void {
    this.width -= 2;
    this.height -= 2;
    if (this.depth === 0) {
      this.originY += 1;
    }
    this.updateChildOrigins();
  }

  development(): void {
    this.internalDevelopment();

    if (!this.nextCell) {
      this.createNextCell();
    } else {
      this.nextCell.development();
    }
  }

  reverseDevelopment(): void {
    this.reverseInternalDevelopment();

    if (!this.nextCell) {
      this.destroySelf();
    } else {
      this.nextCell.reverseDevelopment();
    }
  }
}

export class SimplePlant extends Sim {
  static seedWidth: number = 10;
  static seedHeight: number = 10;
  static seedTaper: number = 1;
  static seedEnergy: number = 100;

  storedEnergy: number = SimplePlant.seedEnergy;
  originX: number;
  originY: number;

  rootCell: SimplePlantCell;

  /////////////////////////////////////////////////////////////////////////
  // Constructor
  /////////////////////////////////////////////////////////////////////////
  constructor(dna: Array<number>, origin: Array<number> = [0, 0]) {
    super(dna);
    this.originX = origin[0];
    this.originY = origin[1];

    // create Seed
    this.rootCell = new SimplePlantCell(
      dna,
      this,
      [this.originX, this.originY - SimplePlant.seedHeight / 2],
      SimplePlant.seedWidth,
      SimplePlant.seedHeight,
      0,
      SimplePlant.seedTaper,
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

  development(): void {
    this.rootCell.development();
  }

  reverseDevelopment(): void {
    this.rootCell.reverseDevelopment();
  }

  reproduction(maxMutation = 1): void {
    return super.reproduction(maxMutation);
  }
}
