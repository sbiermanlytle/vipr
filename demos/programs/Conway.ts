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

  this.nextGeneration = () => {
    startTime = Math.round(performance.now());

    for (c = 0; c < this.cells.length; c++) {

      for (r = 0; r < this.cells[c].length; r++) {
        numNeighbors = 0;

        if (c > 0) {
          if (this.cells[c - 1][r]) { numNeighbors++; }
          if (r > 0 && this.cells[c - 1][r - 1]) { numNeighbors++; }
        }
        if (r > 0 && this.cells[c][r - 1]) { numNeighbors++; }
        if (c < this.cells.length - 1 && this.cells[c + 1][r]) { numNeighbors++; }

        if (numNeighbors < 4) {
          if (c < this.cells.length - 1 && r > 0 && this.cells[c + 1][r - 1]) {
            numNeighbors++;
          }
          if (numNeighbors < 4) {
            if (c > 0 && r < this.cells[c].length - 1 && this.cells[c - 1][r + 1]) {
              numNeighbors++;
            }
            if (numNeighbors < 4) {
              if (r < this.cells[c].length - 1 && this.cells[c][r + 1]) {
                numNeighbors++;
              }
              if (numNeighbors < 4 && c < this.cells.length - 1 && r < this.cells[c].length - 1 && this.cells[c + 1][r + 1]) {
                numNeighbors++;
              }
            }
          }
        }

        if (this.cells[c][r]) {
          this.nextCells[c][r] = (numNeighbors === 2 || numNeighbors === 3);
        } else {
          this.nextCells[c][r] = (numNeighbors === 3);
        }

        // Setup a random rectangle
        // This will write to positionBuffer because
        // its the last thing we bound on the ARRAY_BUFFER
        // bind point
        vipr.setRectangle(app.ctx, r * CELL_SIZE, c * CELL_SIZE, CELL_SIZE, CELL_SIZE);
     
        if (this.nextCells[c][r]) {
          app.ctx.uniform4f(colorUniformLocation, COLOR[0], COLOR[1], COLOR[2], 1);
        } else {
          app.ctx.uniform4f(colorUniformLocation, 0, 0, 0, 0);
        }
     
        // Draw the rectangle.
        app.ctx.drawArrays(app.ctx.TRIANGLES, 0, 6);
      }
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
