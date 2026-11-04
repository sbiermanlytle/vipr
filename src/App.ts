export default class App {
  constructor(canvas, script, settings = {}) {
    // set app reference for shared functions
    this.app = this;
    this.canvas = canvas;
    // Set by stop(): a program's loops check it before they schedule their next step.
    this.stopped = false;
    // Every WebGL context the program draws with: its canvas's, and any it makes off the page
    // with contextFor. stop() gives them all back.
    this.contexts = [];
    this.initContext(canvas, settings);

  // add to global apps list
  // vipr.apps.push(this);

    this.script = new script(this, settings);
  }

  initContext(canvas, settings) {
    if (settings && settings.webgl === false) {
      this.ctx = canvas.getContext('2d');
      this.webgl = false;
      return;
    }
    this.ctx = this.contextFor(canvas);
    if (!this.ctx) {
      console.warn('[vipr] cannot load webgl context, falling back to 2d');
      this.ctx = canvas.getContext('2d');
      this.webgl = false;
      return;
    }
    this.webgl = true;
  }

  // A WebGL context on another canvas, such as one off the page that the program draws on and
  // copies from, which stop() gives back with the rest.
  contextFor(canvas) {
    const gl = canvas.getContext('webgl');
    if (gl) this.contexts.push(gl);
    return gl;
  }

  // Ends the program, for when its canvas leaves the page: its loops stop at their next step, and
  // its WebGL contexts, with every buffer and shader in them, go back to the browser at once
  // rather than whenever they're garbage collected.
  stop() {
    this.stopped = true;
    for (const gl of this.contexts) gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.contexts = [];
  }

  initShaderProgram(vertexShaderSource, fragmentShaderSource, positions) {

  }

  setColor(colorUniformLocation, r, g, b, a) {
    this.ctx.uniform4fv(colorUniformLocation, [r, g, b, a]);
  }

  setRandomColor(colorUniformLocation) {
    this.setColor(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);
  }

  drawBackgroundColor(r, g, b, a) {
    this.ctx.clearColor(r, g, b, a);
    this.ctx.clear(this.ctx.COLOR_BUFFER_BIT);
  }

  clear() {
    this.drawBackgroundColor(0, 0, 0, 0)
  }
}
