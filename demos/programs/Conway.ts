import * as vipr from '../../src';
import { Log, hexToRgb } from '../core';

export interface ConwayProps {
  cellSize: number;
  color: string; // hex only
  initialFill: number;
  disableLogs: boolean;
}

export default function Conway(app: App, settings: ConwayProps = {}) {
  let startTime = Math.round(performance.now());
  let endTime = 0;
  let renderTime = 0;

  Log.info(this, `awaken: ${startTime}ms`);
  Log.info(this, `canvas size: ${app.ctx.canvas.width}, ${app.ctx.canvas.height}`);

  const CELL_SIZE = settings.cellSize || 4;
  const ROWS = Math.ceil(app.ctx.canvas.width / CELL_SIZE);
  const COLS = Math.ceil(app.ctx.canvas.height / CELL_SIZE);
  const INITIAL_FILL = settings.initialFill || .35;
  const ENABLE_LOGS = settings.disableLogs ? false : true;
  let COLOR = [];
  if (settings.color) {
    const col = hexToRgb(settings.color);
    COLOR = [col.r / 255, col.g / 255, col.b / 255];
  } else {
    COLOR = [Math.random(), Math.random(), Math.random()];
  }

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

  let positionAttributeLocation = app.ctx.getAttribLocation(program, "a_position");
  let resolutionUniformLocation = app.ctx.getUniformLocation(program, "u_resolution");
  let colorUniformLocation =      app.ctx.getUniformLocation(program, "u_color");

  app.ctx.enableVertexAttribArray(positionAttributeLocation);
  app.ctx.uniform2f(resolutionUniformLocation, app.ctx.canvas.width, app.ctx.canvas.height);

  // Bind the position buffer.
  const positionBuffer = app.ctx.createBuffer();
  app.ctx.bindBuffer(app.ctx.ARRAY_BUFFER, positionBuffer);
   
  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  let size = 2;          // 2 components per iteration
  let type = app.ctx.FLOAT;   // the data is 32bit floats
  let normalize = false; // don't normalize the data
  let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  let offset = 0;        // start at the beginning of the buffer
  app.ctx.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

  ///////////////////////////////////////////////////////////////////////////////////////
  // RENDER HELPERS
  ///////////////////////////////////////////////////////////////////////////////////////

  startTime = 0;

  let numNeighbors = 0;
  let c = 0;
  let r = 0;

  // Every live cell's rectangle (two triangles, 12 numbers), uploaded and drawn at once each
  // generation, into a buffer big enough for a grid of nothing but live cells, made once. Drawing
  // each cell on its own meant an upload and a draw call per cell, about 320,000 a second on the
  // demo page's 200 by 200 grid, which made the browser's GPU process grow by hundreds of
  // megabytes.
  const vertices = new Float32Array(ROWS * COLS * 12);
  let live = 0;
  app.ctx.uniform4f(colorUniformLocation, COLOR[0], COLOR[1], COLOR[2], 1);

  this.nextGeneration = () => {
    startTime = Math.round(performance.now());
    live = 0;

    for (c = 0; c < this.cells.length; c++) {

      for (r = 0; r < this.cells[c].length; r++) {
        // The grid wraps around: past its right edge is its left, past its bottom its top, so no
        // cell is on an edge and every one has eight neighbors, as on the game's endless plane.
        const height = this.cells.length;
        const width = this.cells[c].length;
        const up = (c + height - 1) % height;
        const down = (c + 1) % height;
        const left = (r + width - 1) % width;
        const right = (r + 1) % width;
        numNeighbors =
          this.cells[up][left] + this.cells[up][r] + this.cells[up][right] +
          this.cells[c][left] + this.cells[c][right] +
          this.cells[down][left] + this.cells[down][r] + this.cells[down][right];

        if (this.cells[c][r]) {
          this.nextCells[c][r] = (numNeighbors === 2 || numNeighbors === 3);
        } else {
          this.nextCells[c][r] = (numNeighbors === 3);
        }

        // A live cell's rectangle, in the same order setRectangle gives: its top left first.
        if (this.nextCells[c][r]) {
          const x1 = r * CELL_SIZE, y1 = c * CELL_SIZE, x2 = x1 + CELL_SIZE, y2 = y1 + CELL_SIZE;
          const i = live * 12;
          vertices[i] = x1; vertices[i + 1] = y1; vertices[i + 2] = x2; vertices[i + 3] = y1;
          vertices[i + 4] = x1; vertices[i + 5] = y2; vertices[i + 6] = x1; vertices[i + 7] = y2;
          vertices[i + 8] = x2; vertices[i + 9] = y1; vertices[i + 10] = x2; vertices[i + 11] = y2;
          live++;
        }
      }
    }

    // The dead cells are the cleared canvas; the live ones are drawn in one call.
    app.clear();
    if (live > 0) {
      app.ctx.bufferData(app.ctx.ARRAY_BUFFER, vertices.subarray(0, live * 12), app.ctx.DYNAMIC_DRAW);
      app.ctx.drawArrays(app.ctx.TRIANGLES, 0, live * 6);
    }

    endTime = Math.round(performance.now());
    renderTime = endTime - startTime;
    if (ENABLE_LOGS) {
      Log.info(this, `generation ${this.generation} | render time: ${renderTime}ms`);
    }
    // Swap the grids, so the next generation reads this one and writes over the one before it.
    [this.cells, this.nextCells] = [this.nextCells, this.cells];
    this.generation++;
  }

  ///////////////////////////////////////////////////////////////////////////////////////
  // MAIN PROGRAM
  ///////////////////////////////////////////////////////////////////////////////////////

  this.generation = 0;

  this.cells = [];
  this.nextCells = [];
  for (let c = 0; c < COLS; c++) {
    this.cells[c] = [];
    this.nextCells[c] = [];
    for (let r = 0; r < ROWS; r++) {
      this.cells[c][r] = Math.random() < INITIAL_FILL;
    }
  }

  this.loop = () => {
    if (app.stopped) return;
    this.nextGeneration();

    setTimeout(() => {
      this.loop();
    }, Math.floor(1000 / 8));
  }

  this.nextGeneration();
  this.loop();

  Log.info(this, `num cells: ${ROWS * COLS}`);
  Log.info(this, `color: ${COLOR[0]}, ${COLOR[1]}, ${COLOR[2]}`);
}
