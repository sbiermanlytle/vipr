import * as vipr from '../../src';
import { Log } from '../core';
import { Sim, Tree2, SimplePlant } from '../sims';

export default function Origins(app, settings) {
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

  function renderFrame(origin, positions, scale = 1) {
    // Set translation
    app.ctx.uniform2fv(translationUniformLocation,  origin);

    // // Set rotation.
    var rot = vipr.sinAndCosForAngle(0);
    app.ctx.uniform2fv(rotationUniformLocation, [rot.sin, rot.cos]);

    // // Set the scale.
    app.ctx.uniform2fv(scaleUniformLocation, [scale, scale]);

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
  // APP FUNCTIONS
  ///////////////////////////////////////////////////////////////////////////////////////

  // dna = [-2, -2, -1, 3, 0, -1, 3, 2, 0]

  // app.setRandomColor(colorUniformLocation);

  // const renderTree = (t, origin) => {
  //   let positions = tree.development(t);

  //   app.clear();
  //   renderFrame(origin, positions);
  // }

  // const growTree = () => {
  //   renderTree(t)

  //   if (t >= tree.maxAge) {
  //     Log.info(this, 'max age reached');
  //     return;
  //   }
  //   t += 1;

  //   // next frame
  //   setTimeout(() => {
  //     growTree();
  //   }, 1000 / 60);
  // }

  const prevStep = (t, scale) => {
    if (t <= 0) {
      return 0;
    }
    plant.reverseDevelopment();
    let positions = plant.getPositions();
    Log.info(this, `t: ${t - 1} | positions: ${positions.length}`)
    renderFrame(plantOrigin, positions, scale);
    return t - 1;
  }

  const nextStep = (t, scale) => {
    plant.development();
    let positions = plant.getPositions();
    Log.info(this, `t: ${t + 1} | positions: ${positions.length}`)
    renderFrame(plantOrigin, positions, scale);
    return t + 1;
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  // INPUT HANDLING
  ///////////////////////////////////////////////////////////////////////////////////////

  document.body.onkeyup = (e) => {
    if(e.keyCode == 37){
      t = prevStep(t, scale)
    }
    if(e.keyCode == 39){
      t = nextStep(t, scale)
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  // MAIN PROGRAM
  ///////////////////////////////////////////////////////////////////////////////////////

  let t = 0;
  let scale = 5;

  // app.setColor(colorUniformLocation, 1, 0, 0, 1);
  // var treeOrigin = [app.canvas.width * 3 / 4, app.canvas.height];
  // var treeDna = Sim.randomDna(9, 20);
  // let tree = new Tree2(treeDna, [0, 0]);
  // // growTree();
  // renderTree(tree.maxAge, treeOrigin);

  app.setColor(colorUniformLocation, 0, 1, 0, 1);
  var plantOrigin = [app.canvas.width / 2, app.canvas.height / 2];
  var plantDna = Sim.randomDna(1);
  let plant = new SimplePlant(plantDna, [0, 0]);

  let positions = plant.getPositions();
  Log.info(this, `t: ${t} | positions: ${positions.length} | dna: ${plant.dnaString()}`);
  renderFrame(plantOrigin, positions, scale);
}
