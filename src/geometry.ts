export function computeNewOrigin(originX: number, originY: number, rotation: number, height: number) {
  var rads = rotation * (Math.PI / 180);

  var a = Math.sin(rads) * height;
  var b = Math.cos(rads) * height;

  return [originX + a, originY + b]
}

export function setRectangle(gl: WebGLRenderingContext, x: number, y: number, width: number, height: number) {
  let x1 = x;
  let x2 = x + width;
  let y1 = y;
  let y2 = y + height;
 
  // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
  // whatever buffer is bound to the `ARRAY_BUFFER` bind point
  // but so far we only have one buffer. If we had more than one
  // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.
 
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2]), gl.STATIC_DRAW);
}

export function getRectangleCoordinates(origin: Array<number>, width: number, height: number, rotation: number, taper: number = 1) : Array<number> {
  const x1 = origin[0] - width / 2;
  const y1 = origin[1];

  const x2 = origin[0] + width / 2;
  const y2 = origin[1] + height;

  const x3 = origin[0] + width * taper / 2;
  const x4 = origin[0] - width * taper / 2;

  const rads = rotation * (Math.PI / 180);
  const cosRads = Math.cos(rads);
  const sinRads = Math.sin(rads);

  const BX = x4 * cosRads - y2 * sinRads;
  const BY = y2 * cosRads + x4 * sinRads;

  const DX = x2 * cosRads - y1 * sinRads;
  const DY = y1 * cosRads + x2 * sinRads;

  return [
    x1 * cosRads - y1 * sinRads, y1 * cosRads + x1 * sinRads, // A
    DX, DY, // D
    BX, BY, // B
    BX, BY, // B
    DX, DY, // D
    x3 * cosRads - y2 * sinRads, y2 * cosRads + x3 * sinRads  // C
  ];
}

export function getRectangleCoordinatesUnoptimized(origin: Array<number>, width: number, height: number, rotation: number, taper: number = 1) : Array<number> {
  const x1 = origin[0] - width / 2;
  const y1 = origin[1];

  const x2 = origin[0] + width / 2;
  const y2 = origin[1] + height;

  const x3 = origin[0] + width * taper / 2;
  const x4 = origin[0] - width * taper / 2;

  const a = [x1, y1];
  const b = [x4, y2];
  const c = [x3, y2];
  const d = [x2, y1];

  const rads = rotation * (Math.PI / 180);
  const cosRads = Math.cos(rads);
  const sinRads = Math.sin(rads);

  const AX = a[0] * cosRads - a[1] * sinRads;
  const AY = a[1] * cosRads + a[0] * sinRads;

  const BX = b[0] * cosRads - b[1] * sinRads;
  const BY = b[1] * cosRads + b[0] * sinRads;

  const CX = c[0] * cosRads - c[1] * sinRads;
  const CY = c[1] * cosRads + c[0] * sinRads;

  const DX = d[0] * cosRads - d[1] * sinRads;
  const DY = d[1] * cosRads + d[0] * sinRads;

  return [
    AX, AY, // A
    DX, DY, // D
    BX, BY, // B
    BX, BY, // B
    DX, DY, // D
    CX, CY  // C
  ];
}
