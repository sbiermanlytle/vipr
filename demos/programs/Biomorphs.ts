import * as vipr from '../../src';
import { Log } from '../core';

export default function Biomorphs(app, settings) {
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
  // CONTEXT SETUP
  ///////////////////////////////////////////////////////////////////////////////////////
  
  const program = vipr.shaderFactory(app.ctx, vipr.genericVertexShader, vipr.genericFragmentShader);

  // Tell WebGL how to convert from clip space to pixels
  app.ctx.viewport(0, 0, app.ctx.canvas.width, app.ctx.canvas.height);

  // Clear the canvas.
  app.clear();

  // Tell it to use our program (pair of shaders)
  app.ctx.useProgram(program);

  var positionAttributeLocation =  app.ctx.getAttribLocation(program, "a_position");
  var resolutionUniformLocation =  app.ctx.getUniformLocation(program, "u_resolution");
  var translationUniformLocation = app.ctx.getUniformLocation(program, "u_translation");
  var scaleUniformLocation =       app.ctx.getUniformLocation(program, "u_scale");
  var rotationUniformLocation =    app.ctx.getUniformLocation(program, "u_rotation");
  var colorUniformLocation =       app.ctx.getUniformLocation(program, "u_color");

  // Turn on the attribute
  app.ctx.enableVertexAttribArray(positionAttributeLocation);

  // set the resolution
  app.ctx.uniform2f(resolutionUniformLocation, app.ctx.canvas.width, app.ctx.canvas.height);

  var positionBuffer = app.ctx.createBuffer();
  app.ctx.bindBuffer(app.ctx.ARRAY_BUFFER, positionBuffer);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = app.ctx.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  app.ctx.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset)

  ///////////////////////////////////////////////////////////////////////////////////////
  // RENDERING
  ///////////////////////////////////////////////////////////////////////////////////////

  function drawTree(dna, origin, width, height, rotation, taper, shrink, angle, depth) {
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
    app.ctx.uniform2fv(translationUniformLocation,  origin);

    // Set rotation.
    var rot = vipr.sinAndCosForAngle(expressedRotation);
    app.ctx.uniform2fv(rotationUniformLocation, [rot.sin, rot.cos]);

    // Set the scale.
    app.ctx.uniform2fv(scaleUniformLocation, [1, 1]);

    // Set rectangle
    vipr.setRectangle(app.ctx, -width / 2, 0, width, expressedHeight);
 
    // Draw the rectangle.
    var primitiveType = app.ctx.TRIANGLES;
    var offset = 0;
    var count = 6;
    app.ctx.drawArrays(primitiveType, offset, count);

    // Find new Translation
    var rads = expressedRotation * (Math.PI / 180);

    var a = Math.sin(rads) * expressedHeight;
    var b = Math.cos(rads) * expressedHeight;

    var newX = origin[0] + a;
    var newY = origin[1] + b;

    var newTranslation = [newX, newY];

    drawTree(
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

  function DEVELOPMENT(dna, origin) {
    Log.info('DEVELOPMENT', `DNA: ${dnaString(dna)}`)

    const height = 50;
    const width = 1;
    const taper = 1;
    const shrink = 0.7 + dna[2] / 27;
    const angle = 45 + dna[1] * 45 / 9;
    const depth = 6 + dna[0];

    drawTree(dna, origin, width, -height, 0, taper, shrink, angle, depth);
  }

  function REPRODUCTION(dna, maxMutation = 1) {
    const indexOfMutation = Math.floor(Math.random() * dna.length);
    const mutationDirection = Math.random() > .5 ? 1 : -1;
    const newDna = [...dna];
    const newValue = newDna[indexOfMutation] + maxMutation * mutationDirection;
    if (newValue > -10 && newValue < 10) {
      newDna[indexOfMutation] = newValue;
    }
    return newDna;
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  // MAIN PROGRAM
  ///////////////////////////////////////////////////////////////////////////////////////

  const origin = [app.canvas.width / 2, app.canvas.height / 2 + 70];
  const numGenerations = 20;
  const numGenes = 9;

  var dna = zeroedDna(numGenes);
  for (var i of Array(numGenerations).keys()) {
    dna = REPRODUCTION(dna);
    Log.info(this, `generation ${i}: ${dnaString(dna)}`);
  }


  app.setRandomColor(colorUniformLocation);
  DEVELOPMENT(dna, origin);

}
