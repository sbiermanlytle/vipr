import * as vipr from '../../src';
import { Log } from '../core';

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
  var rotationUniformLocation =    app.ctx.getUniformLocation(program, "u_rotation");
  var scaleUniformLocation =       app.ctx.getUniformLocation(program, "u_scale");
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

  app.ctx.uniform4fv(colorUniformLocation, [Math.random(), Math.random(), Math.random(), 1]);

  // Draw a the scene.
  function drawSegment(origin, width, height, rotation, taper, shrink, angle, depth) {
    if (depth <= 0) {
      return;
    }

    // Set translation
    app.ctx.uniform2fv(translationUniformLocation,  origin);

    // Set rotation.
    var rot = vipr.sinAndCosForAngle(rotation);
    app.ctx.uniform2fv(rotationUniformLocation, [rot.sin, rot.cos]);

    // Set the scale.
    app.ctx.uniform2fv(scaleUniformLocation, [1, 1]);

    // Set rectangle
    vipr.setRectangle(app.ctx, -width / 2, 0, width, height);
 
    // Draw the rectangle.
    var primitiveType = app.ctx.TRIANGLES;
    var offset = 0;
    var count = 6;
    app.ctx.drawArrays(primitiveType, offset, count);

    // Find new Translation
    var rads = rotation * (Math.PI / 180);

    var a = Math.sin(rads) * height;
    var b = Math.cos(rads) * height;

    var newX = origin[0] + a;
    var newY = origin[1] + b;

    var newTranslation = [newX, newY];

    drawSegment(
      newTranslation,
      width * taper,
      height * shrink,
      rotation + angle,
      taper,
      shrink,
      angle,
      depth - 1
    );

    drawSegment(
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

  var height = 100;
  var width = 8;
  var taper = 0.5;
  var shrink = 0.7;
  var angle = 20;
  var depth = 10;

  var origin = [app.canvas.width / 2, app.canvas.height];

  drawSegment(origin, width, -height, 0, taper, shrink, angle, depth);
}
