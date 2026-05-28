import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = path.resolve(import.meta.dirname, "..");
const iconDir = path.join(root, "src-tauri", "icons");
fs.mkdirSync(iconDir, { recursive: true });

const size = 512;
const colors = {
  bg: [24, 26, 31, 255],
  gold: [246, 195, 95, 255],
  mint: [159, 224, 199, 255],
  paper: [244, 241, 235, 255],
  dark: [24, 26, 31, 255],
};

function roundedRect(x, y, w, h, r, px, py) {
  if (px >= x + r && px <= x + w - r && py >= y && py <= y + h) return true;
  if (px >= x && px <= x + w && py >= y + r && py <= y + h - r) return true;
  const corners = [
    [x + r, y + r],
    [x + w - r, y + r],
    [x + r, y + h - r],
    [x + w - r, y + h - r],
  ];
  return corners.some(([cx, cy]) => Math.hypot(px - cx, py - cy) <= r);
}

const rects = [
  [[56, 56, 400, 400, 96], colors.gold],
  [[116, 92, 280, 328, 42], colors.dark],
  [[166, 132, 180, 46, 20], colors.mint],
  [[154, 220, 204, 32, 12], colors.paper],
  [[154, 286, 180, 32, 12], colors.paper],
  [[154, 352, 140, 32, 12], colors.paper],
];

const raw = Buffer.alloc((size * 4 + 1) * size);
let offset = 0;
for (let y = 0; y < size; y += 1) {
  raw[offset++] = 0;
  for (let x = 0; x < size; x += 1) {
    let color = colors.bg;
    for (const [rect, fill] of rects) {
      if (roundedRect(...rect, x, y)) color = fill;
    }
    raw[offset++] = color[0];
    raw[offset++] = color[1];
    raw[offset++] = color[2];
    raw[offset++] = color[3];
  }
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(size, 0);
ihdr.writeUInt32BE(size, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
]);

fs.writeFileSync(path.join(iconDir, "icon.png"), png);

const iconDirectory = Buffer.alloc(6);
iconDirectory.writeUInt16LE(0, 0);
iconDirectory.writeUInt16LE(1, 2);
iconDirectory.writeUInt16LE(1, 4);

const iconEntry = Buffer.alloc(16);
iconEntry[0] = 0;
iconEntry[1] = 0;
iconEntry[2] = 0;
iconEntry[3] = 0;
iconEntry.writeUInt16LE(1, 4);
iconEntry.writeUInt16LE(32, 6);
iconEntry.writeUInt32LE(png.length, 8);
iconEntry.writeUInt32LE(iconDirectory.length + iconEntry.length, 12);

fs.writeFileSync(path.join(iconDir, "icon.ico"), Buffer.concat([iconDirectory, iconEntry, png]));
