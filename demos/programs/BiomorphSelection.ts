import * as vipr from '../../src';
import { Log } from '../core';

export default function BiomorphSelection(app, settings) {
  var startTime = Math.round(performance.now());
  var endTime = 0;
  var renderTime = 0;

  Log.info(this, `awaken: ${startTime}ms`);

  Log.info(this, `canvas size: ${app.ctx.canvas.width}, ${app.ctx.canvas.height}`);

  if (!app.webgl) {
    app.ctx.beginPath();
    app.ctx.rect(20, 20, 150, 100);
    app.ctx.fillStyle = 'red';
    app.ctx.fill();
    return;
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  // GAME INITIALIZATION
  ///////////////////////////////////////////////////////////////////////////////////////

  const yOffset = 40;
  const primaryOrigin = [app.canvas.width / 2, app.canvas.height / 2 + yOffset];
  const numGenes = 9;
  const numChildren = 14;
  const primaryScale = [1, 1];
  const childScale = [1, 1];

  const primaryProgram = vipr.shaderFactory(app.ctx, vipr.genericVertexShader, vipr.genericFragmentShader);
  app.ctx.viewport(0, 0, app.ctx.canvas.width, app.ctx.canvas.height);
  app.ctx.useProgram(primaryProgram);

  const primaryLocations = vipr.setupLocations(app.ctx, primaryProgram);
  app.ctx.uniform2fv(primaryLocations.scale, primaryScale);

  const childCanvases = [];
  const childContexts = [];
  const childLocations = [];
  var childrenDNA = [];

  var canvas = null;
  var context = null;
  var program = null;
  var locations = null;
  for (var i of Array(numChildren).keys()) {
    canvas = document.getElementById(`c${i}`);
    if (!canvas) {
      Log.warn(this, 'not enough canvases');
      return;
    }

    context = canvas.getContext('webgl');
    canvas.tag = i;
    canvas.onclick = (e) => {
      e.preventDefault();
      Log.info(this, `selected child ${e.target.tag}`);
      currentDNA = childrenDNA[e.target.tag];
      renderNextGeneration(currentDNA)
    }

    program = vipr.shaderFactory(context, vipr.genericVertexShader, vipr.genericFragmentShader);
    context.viewport(0, 0, context.canvas.width, context.canvas.height);
    context.useProgram(program);
    locations = vipr.setupLocations(context, program);

    context.uniform2fv(locations.scale, primaryScale);

    childCanvases.push(canvas);
    childContexts.push(context);
    childLocations.push(locations);
  }

  const childOrigin = [childCanvases[0].width / 2, childCanvases[0].height / 2 + yOffset];

  ///////////////////////////////////////////////////////////////////////////////////////
  // RENDERING
  ///////////////////////////////////////////////////////////////////////////////////////

  function drawTree(ctx, locations, dna, origin, width, height, rotation, taper, shrink, angle, depth) {
    if (depth <= 0) {
      return;
    }

    var expressedHeight = height;
    if (depth === 1) {
      expressedHeight += dna[3] * 10;
    } else if (depth === 2) {
      expressedHeight += dna[4] * 15;
    } else if (depth === 3) {
      expressedHeight += dna[5] * 10;
    } else if (depth === 4 || depth == 7) {
      expressedHeight += dna[6] * 15;
    } else if (depth === 5) {
      expressedHeight += dna[7] * 10;
    } else if (depth === 6) {
      expressedHeight += dna[8] * 15;
    }

    // Creates differences between left and right
    var expressedRotation = rotation;
    // if (depth === 2) {
    //   expressedRotation += dna[5] * 10;
    // } else if (depth === 4) {
    //   expressedRotation += dna[6] * 10;
    // }

    // Set translation
    ctx.uniform2fv(locations.translation,  origin);

    // Set rotation.
    var rot = vipr.sinAndCosForAngle(expressedRotation);
    ctx.uniform2fv(locations.rotation, [rot.sin, rot.cos]);

    // Set rectangle
    vipr.setRectangle(ctx, -width / 2, 0, width, expressedHeight);
 
    // Draw the rectangle.
    var primitiveType = ctx.TRIANGLES;
    var offset = 0;
    var count = 6;
    ctx.drawArrays(primitiveType, offset, count);

    // Find new Translation
    var rads = expressedRotation * (Math.PI / 180);

    var a = Math.sin(rads) * expressedHeight;
    var b = Math.cos(rads) * expressedHeight;

    var newX = origin[0] + a;
    var newY = origin[1] + b;

    var newTranslation = [newX, newY];

    drawTree(
      ctx,
      locations,
      dna,
      newTranslation,
      width * taper,
      height * shrink,
      rotation + angle,
      taper,
      shrink,
      angle,
      depth - 1
    );

    drawTree(
      ctx,
      locations,
      dna,
      newTranslation,
      width * taper,
      height * shrink,
      rotation - angle,
      taper,
      shrink,
      angle,
      depth - 1
    );
  }

  function dnaString(dna) {
    var dnaString = '';
    for (var i of Array(dna.length).keys()) {
      dnaString += dna[i] + ', ';
    }
    return `[${dnaString.slice(0, -2)}]`;
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  // PROCEDURES
  ///////////////////////////////////////////////////////////////////////////////////////

  function zeroedDna(numGenes) {
     return new Array(numGenes).fill(0);
  }

  function DEVELOPMENT(ctx, locations, dna, origin, startingHeight) {
    Log.info('DEVELOPMENT', `DNA: ${dnaString(dna)}`)

    const height = startingHeight;
    const width = 1;
    const taper = 1;
    const shrink = 0.7 + dna[2] / 27;
    const angle = 45 + dna[1] * 45 / 9;
    const depth = 6 + dna[0];

    drawTree(ctx, locations, dna, origin, width, -height, 0, taper, shrink, angle, depth);
  }

  function REPRODUCTION(dna) {
    const childDna = [];

    var copyA = [];
    var copyB = [];
    for (var i of Array(dna.length).keys()) {
      copyA = [...dna];
      copyB = [...dna];
      copyA[i] += 1;
      copyB[i] -= 1;
      childDna.push(copyA);
      childDna.push(copyB);
    }

    return childDna;
  }

  function renderNextGeneration(dna) {
    var currentColor = [Math.random(), Math.random(), Math.random(), 1];
    app.ctx.uniform4fv(primaryLocations.color, currentColor);
    DEVELOPMENT(app.ctx, primaryLocations, currentDNA, primaryOrigin, 30);

    childrenDNA = REPRODUCTION(currentDNA);

    for (var i of Array(childContexts.length).keys()) {
      childContexts[i].uniform4fv(childLocations[i].color, currentColor);
      DEVELOPMENT(childContexts[i], childLocations[i], childrenDNA[i], childOrigin, 30);
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  // MAIN PROGRAM
  ///////////////////////////////////////////////////////////////////////////////////////

  var currentDNA = zeroedDna(numGenes);

  renderNextGeneration(currentDNA);
}
