import * as vipr from '../../src';
import { Log } from '../core';

export default function Blocks(app, settings) {
  Log.info(this, 'awaken');

  if (!app.webgl) {
    app.ctx.beginPath();
    app.ctx.rect(20, 20, 150, 100);
    app.ctx.fillStyle = 'red';
    app.ctx.fill();
    return;
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  // SHADER SETUP
  ///////////////////////////////////////////////////////////////////////////////////////

  const program = vipr.shaderFactory(app.ctx, vipr.simpleVertexShader, vipr.simpleFragmentShader);

  ///////////////////////////////////////////////////////////////////////////////////////
  // POSITION BUFFERS
  ///////////////////////////////////////////////////////////////////////////////////////

  var positions = [
    10, 20,
    80, 20,
    10, 30,
    10, 30,
    80, 20,
    80, 30,
  ];

  // const app.initShaderProgram(vertexShaderSource, fragmentShaderSource, positions)

  const positionBuffer = vipr.createBuffer(app.ctx, positions);

  var positionAttributeLocation = app.ctx.getAttribLocation(program, "a_position");
  var resolutionUniformLocation = app.ctx.getUniformLocation(program, "u_resolution");
  var colorUniformLocation =      app.ctx.getUniformLocation(program, "u_color");

  ///////////////////////////////////////////////////////////////////////////////////////
  // RENDERING
  ///////////////////////////////////////////////////////////////////////////////////////

  app.ctx.viewport(0, 0, app.ctx.canvas.width, app.ctx.canvas.height);

  // Clear the canvas
  app.clear();
  app.drawBackgroundColor(0, 1, 0, 1);

  app.ctx.useProgram(program);

  app.ctx.enableVertexAttribArray(positionAttributeLocation);
  app.ctx.uniform2f(resolutionUniformLocation, app.ctx.canvas.width, app.ctx.canvas.height);

  // Bind the position buffer.
  app.ctx.bindBuffer(app.ctx.ARRAY_BUFFER, positionBuffer);
   
  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = app.ctx.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  app.ctx.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);


  for (var ii = 0; ii < 50; ++ii) {
    // Setup a random rectangle
    // This will write to positionBuffer because
    // its the last thing we bound on the ARRAY_BUFFER
    // bind point
    vipr.setRectangle(app.ctx, vipr.randomInt(300), vipr.randomInt(300), vipr.randomInt(300), vipr.randomInt(300));
 
    // Set a random color.
    app.ctx.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);
 
    // Draw the rectangle.
    app.ctx.drawArrays(app.ctx.TRIANGLES, 0, 6);
  }

  // // Set a random color.
  // app.ctx.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

  // var primitiveType = app.ctx.TRIANGLES;
  // var offset = 0;
  // var count = 6;
  // app.ctx.drawArrays(primitiveType, offset, count);
}
