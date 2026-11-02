import { vsSource, fsSource } from './shaders.js';
import App from './App';

export function start( script, id: string ) {
  const canvas = document.getElementById(id);

  if (script instanceof Array)
    return new App(canvas, script[0], script[1]);
  return new App(canvas, script);
}

export function randomInt(range: number) {
  return Math.floor(Math.random() * range);
}

export function sinAndCosForAngle(angleInDegrees: number) {
  var angleInRadians = angleInDegrees * Math.PI / 180;
  var s = Math.sin(angleInRadians);
  var c = Math.cos(angleInRadians);
  return {
    sin: s,
    cos: c
  }
}

export function shaderFactory(gl: WebGLRenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertexShader || !fragmentShader) {
    alert('Could not create vertex or fragment WebGLShader');
    return null;
  }

  return createShaderProgram(gl, vertexShader, fragmentShader);
}

// Initialize the buffers we'll need.
export function createBuffer(gl: WebGLRenderingContext, positions: Array<number>) {
  // Create a buffer for geometry
  const buffer = gl.createBuffer();

  // Select the buffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);  

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(positions),
                gl.STATIC_DRAW);

  return buffer;
}

// creates a shader of the given type and compiles it.
export function createShader(gl: WebGLRenderingContext, type: any, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    alert('Could not create WebGLShader');
    return null;
  }

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// create a shader program, so WebGL knows how to draw our data
export function createShaderProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
  // Create the shader program
  const shaderProgram = gl.createProgram();
  if (!shaderProgram) {
    alert('Unable to create WebGLRenderingContext');
    return null;
  }
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

export function setupLocations(gl: WebGLRenderingContext, program: WebGLProgram) {
  var positionAttributeLocation =  gl.getAttribLocation(program, "a_position");
  var resolutionUniformLocation =  gl.getUniformLocation(program, "u_resolution");
  var translationUniformLocation = gl.getUniformLocation(program, "u_translation");
  var scaleUniformLocation =       gl.getUniformLocation(program, "u_scale");
  var rotationUniformLocation =    gl.getUniformLocation(program, "u_rotation");
  var colorUniformLocation =       gl.getUniformLocation(program, "u_color");

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // set the resolution
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);

  return {
    position: positionAttributeLocation,
    resolution: resolutionUniformLocation,
    translation: translationUniformLocation,
    scale: scaleUniformLocation,
    rotation: rotationUniformLocation,
    color: colorUniformLocation,
  }
}
