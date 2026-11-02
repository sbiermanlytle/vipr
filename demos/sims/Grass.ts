import * as vipr from '../../src';
import { Log } from '../core';
import { Sim } from './Sim';

///////////////////////////////////////////////////////////////////////////
// Genes
///////////////////////////////////////////////////////////////////////////
// 0: preferred rotation of first growth
//

export class GrassCell {
  static maxWidth: number = 10;
  static maxHeight: number = 20;
  static energyCreateCost: number = 2;

  dna: Array<number>;
  parent: Grass;

  prevCell: GrassCell;
  nextCell: GrassCell;

  originX: number;
  originY: number;
  groundY: number;
  width: number;
  height: number;
  rotation: number;
  taper: number;
  depth: number;

  constructor(
    dna: Array<number>,
    parent: GrassCell,
    origin: Array<number>,
    groundY: number,
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
    this.groundY = groundY;
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

    this.nextCell = new GrassCell(
      this.dna,
      this,
      [this.originX, this.originY],
      this.groundY,
      this.width/2,
      this.height/2,
      rotation,
      this.taper,
      this.depth + 1
    );

    return GrassCell.energyCreateCost;
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
    if (totalEnergy <= 40) {

      if (this.width > 1) {
        this.width -= 0.1;
      }
      if (this.height > 2) {
        this.height -= 0.2;

        if (this.depth === 0) {
          this.originY += 0.1;
        }
      }
      if (this.depth > 0 && (this.width < 1 || this.height < 2)) {
        this.destroySelf();
      }

      this.updateChildOrigins();
      return 0;
    }
    
    if (this.width < GrassCell.maxWidth - this.depth) {
      this.width += 0.5;
    }

    if (this.height < GrassCell.maxHeight - this.depth) {
      this.height += 1;
      if (this.depth === 0) {
        this.originY -= 0.5;
      }
    }

    this.updateChildOrigins();
    return 0.5;
  }

  // reverseInternalDevelopment(totalEnergy): number {
  //   this.width -= 0.5;
  //   this.height -= 1;
  //   if (this.depth === 0) {
  //     this.originY += 0.5;
  //   }
  //   this.updateChildOrigins();

  //   return 0.5;
  // }

  development(age, totalEnergy): number {
    let energyCost = 0;

    if (!this.nextCell) {
      if (totalEnergy > 20 && age < Grass.maxAge) {
        energyCost += this.createNextCell();
      }
    } else {
      energyCost += this.nextCell.development(age, totalEnergy);
    }

    energyCost += this.internalDevelopment(totalEnergy);

    return energyCost;
  }

  production(): number {
    let generatedEnergy = 0;
    if (this.originY < this.groundY) {
      generatedEnergy = 1;
    }

    if (this.nextCell) {
      generatedEnergy += this.nextCell.production();
    }

    return generatedEnergy;
  }

  // reverseDevelopment(totalEnergy): number {
  //   let energyRegained = 0;

  //   if (!this.nextCell) {
  //     this.destroySelf();
  //     energyRegained += GrassCell.energyCreateCost;
  //   } else {
  //     energyRegained += this.nextCell.reverseDevelopment(totalEnergy);
  //     energyRegained += this.reverseInternalDevelopment(totalEnergy);
  //   }

  //   return energyRegained;
  // }
}

export class Grass extends Sim {
  static seedWidth: number = 4;
  static seedHeight: number = 4;
  static seedTaper: number = 1;
  static seedEnergy: number = 150;
  static maxAge: number = 40;
  static spawnEnergy: number = 300;
  static spawnMaxDistance: number = 20;

  age: number = 0;
  energy: number = Grass.seedEnergy;
  originX: number;
  originY: number;
  groundY: number;

  rootCell: GrassCell;

  /////////////////////////////////////////////////////////////////////////
  // Constructor
  /////////////////////////////////////////////////////////////////////////
  constructor(dna: Array<number>, origin: Array<number> = [0, 0], groundY: number, tag: String) {
    super(dna);
    this.originX = origin[0];
    this.originY = origin[1];
    this.groundY = groundY;
    this.tag = tag

    // create Seed
    this.rootCell = new GrassCell(
      dna,
      this,
      [this.originX, this.originY - Grass.seedHeight / 2],
      groundY,
      Grass.seedWidth,
      Grass.seedHeight,
      0,
      Grass.seedTaper,
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

  nextStep(): Array<Grass> {
    const generatedEnergy = this.production();
    const developmentExpendedEnergy = this.development();
    const spawn = this.reproduction();
    const reproductionExpendedEnergy = spawn.length * Grass.spawnEnergy;

    const expendedEnergy = developmentExpendedEnergy + reproductionExpendedEnergy;

    this.energy += generatedEnergy - expendedEnergy;
    this.age++;

    Log.info(this, `(${this.tag}) expendedEnergy: ${expendedEnergy} | generatedEnergy: ${generatedEnergy} | this.energy: ${this.energy} | this.age: ${this.age}`);

    return spawn;
  }

  development(): number {
    return this.rootCell.development(this.age, this.energy);
  }

  production(): number {
    if (this.age > Grass.maxAge) {
      return -2;
    }
    return this.rootCell.production();
  }

  // reverseDevelopment(): number {
  //   const energyRegained = this.rootCell.reverseDevelopment();
  //   this.energy += energyRegained;
  //   return energyRegained;
  // }

  seedDna(maxMutation = 1): void {
  }

  reproduction(maxMutation = 1): void {
    if (this.energy > Grass.spawnEnergy) {
      let yPos = this.originY + Math.random() * (Grass.spawnMaxDistance * (Math.random() > .5 ? 1 : -1));
      if (yPos < this.groundY) {
        yPos = this.groundY - 10;
      }
      return [
        new Grass(
          super.reproduction(maxMutation),
          [
            this.originX + Math.random() * (Grass.spawnMaxDistance * (Math.random() > .5 ? 1 : -1)),
            yPos,
          ],
          this.groundY,
          this.tag + 'C'
        )
      ];
    }

    return [];
  }
}
