const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT_DIR = path.resolve(__dirname, "..", "src", "static", "icons");
const SIZE = 64;
const STROKE = 3;

const colors = {
  normal: "#7a878c",
  active: "#1e6a5a",
};

const hexToRgba = (hex) => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return { r, g, b, a: 255 };
};

const createPixels = (width, height) => new Uint8ClampedArray(width * height * 4);

const setPixel = (pixels, width, height, x, y, color) => {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return;
  }
  const index = (y * width + x) * 4;
  pixels[index] = color.r;
  pixels[index + 1] = color.g;
  pixels[index + 2] = color.b;
  pixels[index + 3] = color.a;
};

const drawFilledCircle = (pixels, width, height, cx, cy, r, color) => {
  const r2 = r * r;
  for (let y = cy - r; y <= cy + r; y += 1) {
    for (let x = cx - r; x <= cx + r; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        setPixel(pixels, width, height, x, y, color);
      }
    }
  }
};

const drawCircleStroke = (pixels, width, height, cx, cy, r, thickness, color) => {
  const outer = r + thickness / 2;
  const inner = Math.max(0, r - thickness / 2);
  const outer2 = outer * outer;
  const inner2 = inner * inner;
  const minX = Math.floor(cx - outer);
  const maxX = Math.ceil(cx + outer);
  const minY = Math.floor(cy - outer);
  const maxY = Math.ceil(cy + outer);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 <= outer2 && d2 >= inner2) {
        setPixel(pixels, width, height, x, y, color);
      }
    }
  }
};

const drawLine = (pixels, width, height, x1, y1, x2, y2, thickness, color) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const radius = Math.max(1, Math.round(thickness / 2));
  for (let i = 0; i <= steps; i += 1) {
    const x = Math.round(x1 + (dx * i) / steps);
    const y = Math.round(y1 + (dy * i) / steps);
    drawFilledCircle(pixels, width, height, x, y, radius, color);
  }
};

const drawCurve = (pixels, color) => {
  drawLine(pixels, SIZE, SIZE, 8, 44, 22, 30, STROKE, color);
  drawLine(pixels, SIZE, SIZE, 22, 30, 34, 38, STROKE, color);
  drawLine(pixels, SIZE, SIZE, 34, 38, 52, 18, STROKE, color);
  drawFilledCircle(pixels, SIZE, SIZE, 22, 30, 3, color);
  drawFilledCircle(pixels, SIZE, SIZE, 34, 38, 3, color);
  drawFilledCircle(pixels, SIZE, SIZE, 52, 18, 3, color);
};

const drawRecord = (pixels, color) => {
  drawFilledCircle(pixels, SIZE, SIZE, 14, 18, 3, color);
  drawFilledCircle(pixels, SIZE, SIZE, 14, 32, 3, color);
  drawFilledCircle(pixels, SIZE, SIZE, 14, 46, 3, color);
  drawLine(pixels, SIZE, SIZE, 24, 18, 52, 18, STROKE, color);
  drawLine(pixels, SIZE, SIZE, 24, 32, 52, 32, STROKE, color);
  drawLine(pixels, SIZE, SIZE, 24, 46, 52, 46, STROKE, color);
};

const drawBike = (pixels, color) => {
  drawCircleStroke(pixels, SIZE, SIZE, 18, 44, 10, STROKE, color);
  drawCircleStroke(pixels, SIZE, SIZE, 46, 44, 10, STROKE, color);
  drawLine(pixels, SIZE, SIZE, 18, 44, 28, 30, STROKE, color);
  drawLine(pixels, SIZE, SIZE, 28, 30, 40, 30, STROKE, color);
  drawLine(pixels, SIZE, SIZE, 40, 30, 46, 44, STROKE, color);
  drawLine(pixels, SIZE, SIZE, 28, 30, 24, 22, STROKE, color);
  drawLine(pixels, SIZE, SIZE, 24, 22, 34, 22, STROKE, color);
};

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    c = crcTable[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const makeChunk = (type, data) => {
  const typeBuf = Buffer.from(type);
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
};

const encodePng = (width, height, pixels) => {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    const rowPixels = pixels.subarray(y * stride, y * stride + stride);
    Buffer.from(rowPixels).copy(raw, rowStart + 1);
  }

  const compressed = zlib.deflateSync(raw);
  const chunks = [
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0)),
  ];

  return Buffer.concat([signature, ...chunks]);
};

const renderIcon = (draw, colorHex) => {
  const pixels = createPixels(SIZE, SIZE);
  const color = hexToRgba(colorHex);
  draw(pixels, color);
  return encodePng(SIZE, SIZE, pixels);
};

const icons = [
  { key: "curve", draw: drawCurve },
  { key: "record", draw: drawRecord },
  { key: "bike", draw: drawBike },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

icons.forEach(({ key, draw }) => {
  const normalPath = path.join(OUT_DIR, `${key}.png`);
  const activePath = path.join(OUT_DIR, `${key}-active.png`);
  const normalBuffer = renderIcon(draw, colors.normal);
  const activeBuffer = renderIcon(draw, colors.active);
  fs.writeFileSync(normalPath, normalBuffer);
  fs.writeFileSync(activePath, activeBuffer);
});

console.log("Tabbar icons generated:", OUT_DIR);
