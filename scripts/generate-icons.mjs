// Generates Notaty PWA icons (no native deps) — full-bleed indigo gradient + white "N".
// Run: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

const W = 512;
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const C1 = [0x6e, 0x7b, 0xe8]; // top-left
const C2 = [0x4f, 0x46, 0xe5]; // bottom-right

// distance from point p to segment ab
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function render(size) {
  const s = size / 512;
  const buf = Buffer.alloc(size * size * 4);
  // N geometry (scaled)
  const lx0 = 150 * s, lx1 = 194 * s;
  const rx0 = 318 * s, rx1 = 362 * s;
  const y0 = 150 * s, y1 = 362 * s;
  const half = 22 * s; // diagonal half-width
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * (size - 1));
      let r = lerp(C1[0], C2[0], t);
      let g = lerp(C1[1], C2[1], t);
      let b = lerp(C1[2], C2[2], t);
      const inLeft = x >= lx0 && x <= lx1 && y >= y0 && y <= y1;
      const inRight = x >= rx0 && x <= rx1 && y >= y0 && y <= y1;
      const inDiag = segDist(x, y, lx0 + half, y0 + half, rx1 - half, y1 - half) <= half;
      if (inLeft || inRight || inDiag) {
        r = g = b = 0xff;
      }
      const i = (y * size + x) * 4;
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 0xff;
    }
  }
  return buf;
}

/* ---- minimal PNG encoder ---- */
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, 'ascii');
  const body = Buffer.concat([tb, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

for (const size of [192, 512]) {
  writeFileSync(join(OUT, `icon-${size}.png`), encodePNG(render(size), size));
}
// maskable = same full-bleed art (N sits within the safe zone)
writeFileSync(join(OUT, 'maskable-512.png'), encodePNG(render(512), 512));
// apple touch icon (180)
writeFileSync(join(OUT, '..', 'apple-touch-icon.png'), encodePNG(render(180), 180));

console.log('Icons written to', OUT);
