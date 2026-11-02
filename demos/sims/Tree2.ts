import * as vipr from '../../src';
import { Log } from '../core';
import { Sim } from './Sim';

export class Tree2 extends Sim {
  originX: number;
  originY: number;

  growthSpeed: number = 1;
  maxAge: number = 100.0;
  maxDepth: number = 10.0;
  maxHeight: number = 100.0;
  maxWidth: number = 10.0;
  maxAngle: number = 25.0;
  maxShrink: number = 0.7;

  /////////////////////////////////////////////////////////////////////////
  // Constructor
  /////////////////////////////////////////////////////////////////////////
  constructor(dna: Array<number>, origin: Array<number> = [0, 0]) {
    super(dna);
    this.originX = origin[0];
    this.originY = origin[1];
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
  development(t: number = this.maxAge): void {

    const height = t * this.maxHeight / this.maxAge;
    const width = t * this.maxWidth / this.maxAge;
    const taper = .6;
    const shrink = t * (this.maxShrink + this.dna[2] / 27.0) / this.maxAge;
    const angle = t * (this.maxAngle + this.dna[1] * 45.0 / 9.0) / this.maxAge;
    const depth = 0;
    const maxDepth = t * (this.maxDepth + this.dna[0]) / this.maxAge;

    Log.info('DEVELOPMENT', `t: ${t} | DNA: ${this.dnaString()} | height: ${height} | width: ${width} | shrink: ${shrink} | angle: ${angle} | depth: ${depth}`);

    return this.calcTree2Positions(t, this.dna, [this.originX, this.originY], width, -height, 0, taper, shrink, angle, depth, maxDepth);
  }

  /////////////////////////////////////////////////////////////////////////
  // Sim Subroutines
  /////////////////////////////////////////////////////////////////////////
  getBranchHeight(t, maxHeight, branchDepth) {
    const depthOffset = this.maxAge / this.maxDepth * branchDepth;
    const height = (t - depthOffset) * maxHeight / (this.maxAge / this.maxDepth * 4);
    if (branchDepth === 0) {
      Log.info(this, `depth: ${branchDepth} | height: ${height}`);
    }
    if (height < -this.maxHeight) {
      return -this.maxHeight;
    }
    return height;
  }

  calcTree2Positions(t, dna, origin, width, height, rotation, taper, shrink, angle, depth, maxDepth) : Array<number> {
      if (depth > maxDepth) {
      return [];
    }

    let expressedHeight = height;
    if (depth === 1) {
      expressedHeight += dna[3] * 10.0;
    } else if (depth === 2) {
      expressedHeight += dna[4] * 15.0;
    } else if (depth === 3) {
      expressedHeight += dna[5] * 10.0;
    } else if (depth === 4 || depth == 7) {
      expressedHeight += dna[6] * 15.0;
    } else if (depth === 5) {
      expressedHeight += dna[7] * 10.0;
    } else if (depth === 6) {
      expressedHeight += dna[8] * 15.0;
    }

    expressedHeight = this.getBranchHeight(t, expressedHeight, depth)

    // Creates differences between left and right
    let expressedRotation = rotation;
    if (depth === 2) {
      expressedRotation += dna[5] * 10.0;
    } else if (depth === 4) {
      expressedRotation += dna[6] * 10.0;
    }

    // get rectangle coordinates
    let T = Tree2.getBranchCoordinates([0, 0], width, expressedHeight, -expressedRotation);

    let trunkPositions = [
      T[0] + origin[0], T[1] + origin[1], // A
      T[2] + origin[0], T[3] + origin[1], // D
      T[4] + origin[0], T[5] + origin[1], // B
      T[6] + origin[0], T[7] + origin[1], // B
      T[8] + origin[0], T[9] + origin[1], // D
      T[10] + origin[0], T[11] + origin[1]  // C
    ]

    // Find new Origin
    var rads = expressedRotation * (Math.PI / 180);

    var a = Math.sin(rads) * expressedHeight;
    var b = Math.cos(rads) * expressedHeight;

    var newX = origin[0] + a;
    var newY = origin[1] + b;

    var newOrigin = [newX, newY];

    let leaf0Positions = this.calcTree2Positions(
      t,
      dna,
      newOrigin,
      width * taper,
      height * shrink,
      rotation + angle,
      taper,
      shrink,
      angle,
      depth + 1,
      maxDepth
    );

    let leaf1Positions = this.calcTree2Positions(
      t,
      dna,
      newOrigin,
      width * taper,
      height * shrink,
      rotation - angle,
      taper,
      shrink,
      angle,
      depth + 1,
      maxDepth
    );

    return trunkPositions.concat(leaf0Positions).concat(leaf1Positions);
  }

  static getBranchCoordinates(origin, width, height, rotation) : Array<number> {
    return vipr.getRectangleCoordinates(origin, width, height, rotation, 0.5);
  }

}
