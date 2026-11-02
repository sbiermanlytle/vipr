export const vsSource = `
  attribute vec4 aVertexPosition;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  }
`;

// Fragment shader program

export const fsSource = `
  void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
`;

export const simpleVertexShader = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;
 
  void main() {
    // convert the position from pixels to 0.0 to 1.0
    vec2 zeroToOne = a_position / u_resolution;
 
    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;
 
    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;
 
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

export const simpleFragmentShader = `
  // fragment shaders don't have a default precision so we need
  // to pick one. mediump is a good default
  precision mediump float;
  uniform vec4 u_color;
 
  void main() {
    // gl_FragColor is a special variable
    gl_FragColor = u_color;
  }
`;

export const genericVertexShader = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;
  uniform vec2 u_translation;
  uniform vec2 u_rotation;
  uniform vec2 u_scale;
 
  void main() {

    // Scale the position
    vec2 scaledPosition = a_position * u_scale;
    
    // Rotate the position
    vec2 rotatedPosition = vec2(
       scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
       scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

    // Add in the translation.
    vec2 position = rotatedPosition + u_translation;

    // convert the rectangle from pixels to 0.0 to 1.0
    vec2 zeroToOne = position / u_resolution;
 
    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;
 
    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;
 
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

export const genericFragmentShader = `
  precision mediump float;
  uniform vec4 u_color;
 
  void main() {
    gl_FragColor = u_color;
  }
`;
