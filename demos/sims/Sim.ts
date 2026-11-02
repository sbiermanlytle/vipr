export abstract class Sim {
  dna: Array<number>;
  tag: String;

  /////////////////////////////////////////////////////////////////////////
  // Sim Functions
  /////////////////////////////////////////////////////////////////////////
  constructor(dna: Array<number>) {
    this.dna = dna;
  }

  abstract development(): void;

  static reproduction(dna, maxMutation = 1): void {
    const indexOfMutation = Math.floor(Math.random() * dna.length);
    const mutationDirection = Math.random() > .5 ? 1 : -1;
    const newDna = [...dna];
    const newValue = newDna[indexOfMutation] + maxMutation * mutationDirection;
    if (newValue > -10 && newValue < 10) {
      newDna[indexOfMutation] = newValue;
    }
    return newDna;
  }

  reproduction(maxMutation = 1): void {
    return Sim.reproduction(this.dna, maxMutation);
  }

  dnaString(): string {
    return Sim.dnaString(this.dna);
  }

  /////////////////////////////////////////////////////////////////////////
  // Static Functions
  /////////////////////////////////////////////////////////////////////////
  static zeroedDna(numGenes) {
    return new Array(numGenes).fill(0);
  }

  static randomDna(numGenes) {
    var dna = Sim.zeroedDna(numGenes);
    for (var i of Array(numGenes).keys()) {
      dna[i] = Math.floor(Math.random() * 10)
    }
    return dna;
  }

  static evolvedDna(numGenes, numGenerations) {
    var dna = Sim.zeroedDna(numGenes);
    for (var i of Array(numGenerations).keys()) {
      dna = Sim.reproduction(dna);
    }
    return dna;
  }

  static dnaString(dna) {
    let dnaString = '';
    for (let i of Array(dna.length).keys()) {
      dnaString += dna[i] + ', ';
    }
    return `[${dnaString.slice(0, -2)}]`;
  }
}
