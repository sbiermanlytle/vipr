import * as vipr from '../../src';
import { Log } from '../core';
import { Sim, Grass } from '../sims';

export default function Grassland(app, settings) {
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

  const renderScene = (t, objects) => {
    let positions = [];
    objects.forEach((obj) => {
      positions = positions.concat(obj.getPositions());
    });
    Log.info(this, `t: ${t} | rectangles: ${positions.length / 12}`)
    renderFrame([0, 0], positions, scale);
  }

  // const prevStep = (t, scale) => {
  //   if (t <= 0) {
  //     return 0;
  //   }
  //   grass.reverseDevelopment();
  //   renderScene(t - 1, objects);
  //   return t - 1;
  // }

  const nextStep = (t, scale) => {
    let newObjects = [];
    objects.forEach((obj) => {
      newObjects = newObjects.concat(obj.nextStep());
    });
    objects = objects.concat(newObjects);
    renderScene(t + 1, objects);
    return t + 1;
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  // INPUT HANDLING
  ///////////////////////////////////////////////////////////////////////////////////////

  let loopId = 0;

  document.body.onkeydown = (e) => {
    // if(e.keyCode == 37){
    //   t = prevStep(t, scale)
    // }
    if (e.keyCode == 39) {
      loopId = window.setTimeout(() => {
        if (app.stopped) return;
        t = nextStep(t, scale);
      }, 100);
    }
  }

  document.body.onkeyup = (e) => {
    if(e.keyCode == 39){
      window.clearTimeout(loopId);
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  // MAIN PROGRAM
  ///////////////////////////////////////////////////////////////////////////////////////

  let t = 0;
  let scale = 1;

  const groundY = app.canvas.height / 2;
  const ground = {
    getPositions: () => {
      return vipr.getRectangleCoordinates(
        [app.canvas.width / 2, groundY], app.canvas.width, 2, 0, 1
      );
    },
    nextStep: () => { return [] }
  }

  const getRandomX = (padding) => {
    return Math.random() * (app.canvas.width - padding * 2);
  }

  const getRandomY = (padding) => {
    return Math.random() * (app.canvas.height / 2 - padding * 2);
  }

  let objects = [ground];

  const padding = 10;

  app.setColor(colorUniformLocation, 0, 1, 0, 1);

  let grass = new Grass(
    Sim.randomDna(1),
    [getRandomX(padding) + padding, app.canvas.height / 2 + getRandomY(padding) + padding],
    groundY,
    'A'
  );

  let grass2 = new Grass(
    Sim.randomDna(1),
    [getRandomX(padding) + padding, app.canvas.height / 2 + getRandomY(padding) + padding],
    groundY,
    'B'
  );

  let grass3 = new Grass(
    Sim.randomDna(1),
    [getRandomX(padding) + padding, app.canvas.height / 2 + getRandomY(padding) + padding],
    groundY,
    'C'
  );

  objects.push(grass);
  objects.push(grass2);
  objects.push(grass3);

  renderScene(t, objects);
}
