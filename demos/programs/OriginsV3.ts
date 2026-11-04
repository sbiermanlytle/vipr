import * as vipr from '../../src';
import { Meadow } from '../sims/meadow/Meadow';

// Each vertex carries its own color, so the whole meadow is one draw call.
const vertexShader = `
  attribute vec2 a_position;
  attribute vec3 a_color;
  uniform vec2 u_resolution;
  varying vec3 v_color;

  void main() {
    vec2 clipSpace = a_position / u_resolution * 2.0 - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_color = a_color;
  }
`;

const fragmentShader = `
  precision mediump float;
  varying vec3 v_color;

  void main() {
    gl_FragColor = vec4(v_color, 1.0);
  }
`;

// Steps a second, while it runs.
const SPEED = 10;

// Origins V3: a meadow of grass, shrubs and trees, grown from a few seeds, competing for light
// (sims/meadow/Meadow.ts). It runs on its own; Space pauses it and → steps it while paused. It
// stops when its canvas loses its WebGL context, as it does when the canvas leaves the page.
export default function OriginsV3(app, settings: { preview?: boolean } = {}) {
  if (!app.webgl) return;
  const gl: WebGLRenderingContext = app.ctx;
  const width = gl.canvas.width;
  const height = gl.canvas.height;
  // The meadow is laid out 550 high, the height the landscape programs are written for, and as
  // wide as the canvas's shape makes that: 1100 on a landscape canvas, 550 on a square one. The
  // plants keep their size either way.
  const scale = height / 550;
  const across = width / scale;
  const groundY = 470;

  const program = vipr.shaderFactory(gl, vertexShader, fragmentShader);
  gl.viewport(0, 0, width, height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), across, 550);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const position = gl.getAttribLocation(program, 'a_position');
  const color = gl.getAttribLocation(program, 'a_color');
  gl.enableVertexAttribArray(position);
  gl.enableVertexAttribArray(color);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 20, 0);
  gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 20, 8);

  // The ground: a strip of soil below a line.
  const soil = [0.12, 0.09, 0.06];
  const line = [0.32, 0.25, 0.16];
  const rect = (x1: number, y1: number, x2: number, y2: number, [r, g, b]: number[]) => [
    x1, y1, r, g, b, x2, y1, r, g, b, x1, y2, r, g, b,
    x1, y2, r, g, b, x2, y1, r, g, b, x2, y2, r, g, b,
  ];
  const ground = new Float32Array([...rect(0, groundY, across, 550, soil), ...rect(0, groundY, across, groundY + 2, line)]);

  const meadow = Meadow.sown(across, groundY);
  // A home page card's preview starts on a grown meadow rather than a few seeds.
  if (settings.preview) for (let i = 0; i < 300; i++) meadow.step();

  const draw = () => {
    const plants = meadow.vertices();
    const data = new Float32Array(ground.length + plants.length);
    data.set(ground);
    data.set(plants, ground.length);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, data.length / 5);
  };

  let paused = false;
  const tick = () => {
    if (app.stopped || gl.isContextLost()) return;
    if (!paused) {
      meadow.step();
      draw();
    }
    window.setTimeout(tick, 1000 / SPEED);
  };

  document.body.onkeydown = (e) => {
    if (e.key === ' ') paused = !paused;
    if (e.key === 'ArrowRight' && paused) {
      meadow.step();
      draw();
    }
  };

  draw();
  window.setTimeout(tick, 1000 / SPEED);
}
