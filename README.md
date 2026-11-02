# vipr [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/sbiermanlytle/vipr/blob/master/LICENSE)

WebGL API: a thin layer over raw WebGL that takes the boilerplate out of drawing with shaders.

It's TypeScript source with no dependencies and no build step: import `src/` from your own
bundler (webpack, Vite and so on). Version 2.0 is the version Project Gaia's programs draw with,
moved here from the `okapi` monorepo, where it lived as `libs/vipr`. Version 1.0, the earlier
JavaScript library with its Rollup build and step-by-step examples, is tagged
[`v1.0`](https://github.com/sbiermanlytle/vipr/tree/v1.0).

## What's in it

| File | What it does |
|---|---|
| `src/App.ts` | `App` takes a canvas, gets its WebGL context (falling back to 2D if WebGL isn't available), and starts a program with `new program(app, settings)`. Helpers: `setColor`, `setRandomColor`, `drawBackgroundColor` and `clear`. |
| `src/core.ts` | `start(program, canvasId)` finds the canvas and makes an `App` on it. `shaderFactory` compiles a vertex and a fragment shader and links them; `createBuffer`, `createShader` and `createShaderProgram` are the steps it's built from. `setupLocations` turns on the position attribute and finds the standard uniforms (resolution, translation, scale, rotation, color). Also `randomInt` and `sinAndCosForAngle`. |
| `src/shaders.ts` | GLSL source as strings: `simpleVertexShader` / `simpleFragmentShader` draw in pixel coordinates in one color, and `genericVertexShader` / `genericFragmentShader` add translation, rotation and scale. `vsSource` / `fsSource` are the minimal pair. |
| `src/geometry.ts` | `getRectangleCoordinates` gives the corners of a rotated, optionally tapered rectangle (two triangles), and `computeNewOrigin` where one ends, so the next can start there: how branches and plant cells are drawn. `setRectangle` fills the bound buffer with an axis-aligned rectangle. |
| `src/index.ts` | Exports all of the above. |

## Usage

A program is a function. `App` calls it with `new`, passing the app (its `canvas` and WebGL
context, `ctx`) and any settings.

```ts
import * as vipr from 'vipr'

function Squares(app) {
  const gl = app.ctx
  const program = vipr.shaderFactory(gl, vipr.simpleVertexShader, vipr.simpleFragmentShader)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  app.clear()
  gl.useProgram(program)

  const position = gl.getAttribLocation(program, 'a_position')
  const resolution = gl.getUniformLocation(program, 'u_resolution')
  const color = gl.getUniformLocation(program, 'u_color')
  gl.uniform2f(resolution, gl.canvas.width, gl.canvas.height)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  for (let i = 0; i < 20; i++) {
    vipr.setRectangle(gl, vipr.randomInt(300), vipr.randomInt(300), 40, 40)
    app.setRandomColor(color)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
}

vipr.start([Squares, { webgl: true }], 'canvas')
```

Anything that moves redraws itself, on a timer or `requestAnimationFrame`.

## Vocab

- Buffers: arrays of binary data that are uploaded to the GPU (positions, normals, texture coordinates, vertex colors, anything you want)
- Attributes: specify how to pull data out of a buffer (which buffer, which data type, offset to start at, number of bytes for each segment of data)
- Uniforms: global variables for the shader program

## Shader Notes

- Vertex shader provides clipspace coordinates
- Fragment shader provides the color
- all shaders have a main() function
- `gl_Position` must be set by the vertex shader
- `gl_FragColor` must be set by the fragment shader

## General Notes

- range is [-1,1] for colors and clipspace coordinates

## Optimization Notes

- Looking up attribute locations (and uniform locations) is something you should do during initialization, not in your render loop.
