import * as vipr from '../../src';
import { Log } from '../core';

export default function Conway(app, settings) {
  const startTime = Math.round(performance.now());
  Log.info(this, `awaken: ${startTime}ms`);

  Log.info(this, `canvas size: ${app.ctx.canvas.width}, ${app.ctx.canvas.height}`);

  const CELL_SIZE = 5;
  const ROWS = Math.ceil(app.ctx.canvas.width / CELL_SIZE);
  const COLS = Math.ceil(app.ctx.canvas.height / CELL_SIZE);

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
  // CONTEXT SETUP
  ///////////////////////////////////////////////////////////////////////////////////////

  app.ctx.viewport(0, 0, app.ctx.canvas.width, app.ctx.canvas.height);

  // Clear the canvas
  app.clear();

  app.ctx.useProgram(program);

  var positionAttributeLocation = app.ctx.getAttribLocation(program, "a_position");
  var resolutionUniformLocation = app.ctx.getUniformLocation(program, "u_resolution");
  var colorUniformLocation =      app.ctx.getUniformLocation(program, "u_color");

  app.ctx.enableVertexAttribArray(positionAttributeLocation);
  app.ctx.uniform2f(resolutionUniformLocation, app.ctx.canvas.width, app.ctx.canvas.height);

  // Bind the position buffer.
  const positionBuffer = app.ctx.createBuffer();
  app.ctx.bindBuffer(app.ctx.ARRAY_BUFFER, positionBuffer);
   
  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = app.ctx.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  app.ctx.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

  ///////////////////////////////////////////////////////////////////////////////////////
  // RENDER HELPERS
  ///////////////////////////////////////////////////////////////////////////////////////


  this.redraw = () => {
    const startTime = Math.round(performance.now());

    for (var c = 0; c < this.cells.length; c++) {
      for (var r = 0; r < this.cells[c].length; r++) {
        this.cells[c][r] = Math.random() > .5;

        // Setup a random rectangle
        // This will write to positionBuffer because
        // its the last thing we bound on the ARRAY_BUFFER
        // bind point
        vipr.setRectangle(app.ctx, r * CELL_SIZE, c * CELL_SIZE, CELL_SIZE, CELL_SIZE);
     
        if (this.cells[c][r]) {
          app.ctx.uniform4f(colorUniformLocation, this.color[0], this.color[1], this.color[2], 1);
        } else {
          app.ctx.uniform4f(colorUniformLocation, 0, 0, 0, 0);
        }
     
        // Draw the rectangle.
        app.ctx.drawArrays(app.ctx.TRIANGLES, 0, 6);
      }
    }

    const endTime = Math.round(performance.now());
    const renderTime = endTime - startTime;
    Log.info(this, `generation ${this.generation} | render time: ${renderTime}ms`);
    this.generation++;
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  // MAIN PROGRAM
  ///////////////////////////////////////////////////////////////////////////////////////

  this.generation = 0;
  this.color = [Math.random(), Math.random(), Math.random()];

  this.cells = [];
  for (var c = 0; c < COLS; c++) {
    this.cells[c] = [];
    for (var r = 0; r < ROWS; r++) {
      this.cells[c][r] = Math.random() > .5;
    }
  }

  this.loopRedraw = () => {
    this.redraw();
    setTimeout(() => {
      this.loopRedraw();
    }, 400);
  }

  this.redraw();
  this.loopRedraw();

  Log.info(this, `num cells: ${ROWS * COLS}`);
  Log.info(this, `color: ${this.color[0]}, ${this.color[1]}, ${this.color[2]}`);
}
