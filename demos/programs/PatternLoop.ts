import * as vipr from '../../src';
import { Log } from '../core';

export default function Conway(app, settings) {
  const startTime = Math.round(performance.now());
  Log.info(this, `awaken: ${startTime}ms`);

  Log.info(this, `canvas size: ${app.ctx.canvas.width}, ${app.ctx.canvas.height}`);

  const CELL_SIZE = 5;
  // A line a redraw, forever, is kept by a console with DevTools open.
  const ENABLE_LOGS = !(settings && settings.disableLogs);
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


  // Every lit cell's rectangle (two triangles, 12 numbers), uploaded and drawn at once each redraw,
  // into a buffer big enough for a grid of nothing but lit cells, made once. Drawing each cell on
  // its own meant an upload and a draw call per cell, about 64,000 a second on the demo page's
  // 160 by 160 grid, which grows the browser's GPU process by hundreds of megabytes.
  const vertices = new Float32Array(ROWS * COLS * 12);

  this.redraw = () => {
    const startTime = Math.round(performance.now());
    let lit = 0;

    for (var c = 0; c < this.cells.length; c++) {
      for (var r = 0; r < this.cells[c].length; r++) {
        this.cells[c][r] = Math.random() > .5;

        // A lit cell's rectangle, in the same order setRectangle gives: its top left first.
        if (this.cells[c][r]) {
          const x1 = r * CELL_SIZE, y1 = c * CELL_SIZE, x2 = x1 + CELL_SIZE, y2 = y1 + CELL_SIZE;
          const i = lit * 12;
          vertices[i] = x1; vertices[i + 1] = y1; vertices[i + 2] = x2; vertices[i + 3] = y1;
          vertices[i + 4] = x1; vertices[i + 5] = y2; vertices[i + 6] = x1; vertices[i + 7] = y2;
          vertices[i + 8] = x2; vertices[i + 9] = y1; vertices[i + 10] = x2; vertices[i + 11] = y2;
          lit++;
        }
      }
    }

    // The unlit cells are the cleared canvas; the lit ones are drawn in one call.
    app.clear();
    if (lit > 0) {
      app.ctx.bufferData(app.ctx.ARRAY_BUFFER, vertices.subarray(0, lit * 12), app.ctx.DYNAMIC_DRAW);
      app.ctx.drawArrays(app.ctx.TRIANGLES, 0, lit * 6);
    }

    const endTime = Math.round(performance.now());
    const renderTime = endTime - startTime;
    if (ENABLE_LOGS) {
      Log.info(this, `generation ${this.generation} | render time: ${renderTime}ms`);
    }
    this.generation++;
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  // MAIN PROGRAM
  ///////////////////////////////////////////////////////////////////////////////////////

  this.generation = 0;
  this.color = [Math.random(), Math.random(), Math.random()];
  app.ctx.uniform4f(colorUniformLocation, this.color[0], this.color[1], this.color[2], 1);

  this.cells = [];
  for (var c = 0; c < COLS; c++) {
    this.cells[c] = [];
    for (var r = 0; r < ROWS; r++) {
      this.cells[c][r] = Math.random() > .5;
    }
  }

  this.loopRedraw = () => {
    if (app.stopped) return;
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
