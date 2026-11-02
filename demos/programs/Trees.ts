import * as vipr from '../../src';
import { Log } from '../core';
import { Sim, Tree } from '../sims';

export default function Trees(app, settings) {
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

  function renderFrame(origin, positions) {
    // Set translation
    app.ctx.uniform2fv(translationUniformLocation,  origin);

    // // Set rotation.
    var rot = vipr.sinAndCosForAngle(0);
    app.ctx.uniform2fv(rotationUniformLocation, [rot.sin, rot.cos]);

    // // Set the scale.
    app.ctx.uniform2fv(scaleUniformLocation, [1, 1]);

    // Set rectangle
    let rect0Positions = vipr.getRectangleCoordinates([0, 0], 10, -100, 0, .5);
    let rect1Positions = vipr.getRectangleCoordinates([0, 0], 10, -100, 45, 5);
    // positions = rect0Positions.concat(rect1Positions);

    // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
    // whatever buffer is bound to the `ARRAY_BUFFER` bind point
    // but so far we only have one buffer. If we had more than one
    // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.
    app.ctx.bufferData(app.ctx.ARRAY_BUFFER, new Float32Array(positions), app.ctx.STATIC_DRAW);

    // Log.info('renderFrame', `rect0Positions: [${rect0Positions}]`);
    // Log.info('renderFrame', `rect1Positions: [${rect1Positions}]`);
    // Log.info('renderFrame', `positions: [${positions}]`);

    // Draw the rectangle.
    var primitiveType = app.ctx.TRIANGLES;
    var offset = 0;
    var count = positions.length / 2;
    app.ctx.drawArrays(primitiveType, offset, count);
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  // MAIN PROGRAM
  ///////////////////////////////////////////////////////////////////////////////////////

  var origin = [app.canvas.width / 2, app.canvas.height];
  const numGenerations = 20;
  const numGenes = 9;
  const numTrees = 10;

  var dna = Sim.zeroedDna(numGenes);
  
  for (var i of Array(numGenerations).keys()) {
    dna = Sim.reproduction(dna);
    Log.info(this, `generation ${i}: ${Sim.dnaString(dna)}`);
  }

  const trees = [];
  let tree = null;
  for (var i of Array(numTrees).keys()) {
    tree = new Tree(dna, [(-app.canvas.width / 2) + (Math.random() * app.canvas.width), 0]);
    trees.push(tree);
    Log.info(this, `tree dna: [${tree.dna}] | origin: [${tree.origin}] ${tree.constructor.name}`);
    let positions = tree.development();

    app.setRandomColor(colorUniformLocation);
    renderFrame(origin, positions);

    dna = tree.reproduction()
  }
}
