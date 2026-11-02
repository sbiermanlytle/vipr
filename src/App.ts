export default class App {
  constructor(canvas, script, settings = {}) {
    // set app reference for shared functions
    this.app = this;
    this.canvas = canvas;
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
    this.ctx = canvas.getContext('webgl');
    if (!this.ctx) {
      console.warn('[vipr] cannot load webgl context, falling back to 2d');
      this.ctx = canvas.getContext('2d');
      this.webgl = false;
      return;
    }
    this.webgl = true;
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
