// Turn logo.png into all Notaty PWA icons.
// Trims the surrounding background, then centers the mark on a matching
// solid field so every icon is full-bleed (looks right after iOS rounds it).
// Run: node scripts/logo-to-icons.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'logo.png';
mkdirSync('public/icons', { recursive: true });

// Trim the flat background border aggressively, keep the mark.
const trimmed = await sharp(SRC).trim({ threshold: 60 }).png().toBuffer();

// Crop to the central square (inside the rounded corners) so edges are pure
// amber with no border/corner artefacts. The OS re-rounds the icon itself.
const meta = await sharp(trimmed).metadata();
const side = Math.min(meta.width, meta.height);
const crop = Math.round(side * 0.88);
const core = await sharp(trimmed)
  .extract({
    left: Math.round((meta.width - crop) / 2),
    top: Math.round((meta.height - crop) / 2),
    width: crop,
    height: crop,
  })
  .png()
  .toBuffer();

async function make(size, file) {
  await sharp(core).resize(size, size, { fit: 'cover', position: 'center' }).png().toFile(file);
  console.log('wrote', file);
}

await make(192, 'public/icons/icon-192.png');
await make(512, 'public/icons/icon-512.png');
await make(512, 'public/icons/maskable-512.png');
await make(180, 'public/apple-touch-icon.png');
await make(64, 'public/favicon.png');

console.log('done');
