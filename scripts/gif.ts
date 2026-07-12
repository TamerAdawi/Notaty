// Records a short looping GIF of the core loop: Arabic natural-language text
// typed into the composer, live-parsed into a reminder with the right date/time.
//   npm run dev   then:   npx tsx scripts/gif.ts   → public/demo.gif
import { chromium } from 'playwright';
import gifenc from 'gifenc';
import sharp from 'sharp';

const { GIFEncoder, quantize, applyPalette } = gifenc;
import { writeFileSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const TEXT = 'ذكّرني بكرا الساعة وحدة اتصل بالبنك';
const GIF_WIDTH = 300;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.goto(BASE);
await page.getByRole('button', { name: /Try the demo/ }).click();
await page.getByText("What's on your mind?").waitFor();
await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
await page.evaluate(() => (document as any).fonts?.ready).catch(() => {});
await page.waitForTimeout(400);

const ta = page.getByPlaceholder("What's on your mind?");
await ta.click();

const frames: { buf: Buffer; delay: number }[] = [];
const grab = async (delay: number) => {
  frames.push({ buf: await page.screenshot(), delay });
};

// empty composer (hold a beat)
await grab(700);

// type word by word so the live-parse chips fill in
const words = TEXT.split(' ');
let acc = '';
for (const w of words) {
  acc = acc ? `${acc} ${w}` : w;
  await ta.fill(acc);
  await page.waitForTimeout(160);
  await grab(300);
}

// hold on the finished parse
await grab(1600);

await browser.close();

// encode
const enc = GIFEncoder();
let w = 0;
let h = 0;
for (const f of frames) {
  const { data, info } = await sharp(f.buf)
    .resize({ width: GIF_WIDTH })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  w = info.width;
  h = info.height;
  const palette = quantize(data, 256, { format: 'rgba4444' });
  const index = applyPalette(data, palette, 'rgba4444');
  enc.writeFrame(index, w, h, { palette, delay: f.delay });
}
enc.finish();
writeFileSync('public/demo.gif', enc.bytesView());
console.log(`wrote public/demo.gif  ${w}x${h}, ${frames.length} frames`);
