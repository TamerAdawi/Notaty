// Builds a LinkedIn carousel PDF (1200x1500 portrait pages) from the mobile
// screenshots: dark app-matching background, phone-framed shots, short labels.
//   npx tsx scripts/carousel.ts   → screenshots/notaty-carousel.pdf
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const img = (p: string) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
const shot = (name: string) => img(`screenshots/mobile/${name}.png`);
const logo = img('public/icons/icon-512.png');

type Page =
  | { kind: 'cover'; title: string; sub: string }
  | { kind: 'feature'; src: string; title: string; sub: string }
  | { kind: 'close'; title: string; sub: string };

const pages: Page[] = [
  { kind: 'cover', title: 'Notaty', sub: 'Dump any thought — in English or Arabic.<br/>It figures out what it is and files it.' },
  { kind: 'feature', src: shot('03-capture-arabic'), title: 'It reads Arabic', sub: 'Free-form text parsed live into the right type, date & time' },
  { kind: 'feature', src: shot('05-notes'), title: 'Auto-sorted', sub: 'Tasks, reminders, events, lists, goals — detected, not tagged by hand' },
  { kind: 'feature', src: shot('09-saved'), title: 'Save reels', sub: 'Links from Instagram, TikTok & YouTube — shared straight in' },
  { kind: 'feature', src: shot('10-hustle'), title: 'Hustle ideas', sub: 'A dedicated home for money-making ideas' },
  { kind: 'feature', src: shot('11-wish'), title: 'Wish list', sub: 'Things to buy, with prices and a running total' },
  { kind: 'feature', src: shot('12-since'), title: 'Since when?', sub: 'A recurring-cycle tracker that nudges you when you’re overdue' },
  { kind: 'feature', src: shot('14-review'), title: 'Nothing rots', sub: 'Forgotten notes resurface for a quick keep / do / drop' },
  { kind: 'feature', src: shot('18-light-theme'), title: 'Installable PWA', sub: 'Dark & light, offline-first, real push reminders' },
  { kind: 'close', title: 'Try it', sub: 'notaty-delta.vercel.app · React · TypeScript · Supabase' },
];

const css = `
  @page { size: 1200px 1500px; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Segoe UI', Arial, sans-serif; }
  .page {
    position: relative; width: 1200px; height: 1500px; overflow: hidden;
    background: linear-gradient(180deg,#0a0a0f 0%,#050506 55%,#020203 100%);
    color: #EDEDEF; display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 90px 60px; page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }
  .glow { position: absolute; width: 820px; height: 820px; border-radius: 50%;
    background: radial-gradient(circle, rgba(232,168,8,0.18), transparent 68%); }
  .glow.a { top: -260px; right: -180px; }
  .glow.b { bottom: -300px; left: -220px; opacity: 0.7; }
  .label { text-align: center; margin-bottom: 54px; z-index: 2; }
  .title { font-size: 58px; font-weight: 800; letter-spacing: -1.5px; }
  .sub { font-size: 27px; line-height: 1.4; color: #8A8F98; margin-top: 14px; max-width: 900px; }
  .phone { position: relative; z-index: 2; width: 392px; background: #0d0d10;
    border: 2px solid #26262c; border-radius: 48px; padding: 12px;
    box-shadow: 0 40px 90px -25px rgba(0,0,0,0.85); }
  .phone img { width: 100%; border-radius: 36px; display: block; }
  .foot { position: absolute; bottom: 52px; font-size: 22px; color: #6b7280; z-index: 2; }
  .accent { color: #E8A808; }
  .cover-logo { width: 156px; height: 156px; border-radius: 36px; margin-bottom: 40px;
    box-shadow: 0 20px 50px -15px rgba(232,168,8,0.5); z-index: 2; }
  .cover-title { font-size: 108px; font-weight: 800; letter-spacing: -3px; z-index: 2; }
  .cover-ar { color: #8A8F98; font-size: 40px; font-weight: 400; }
`;

function render(p: Page): string {
  const glows = `<div class="glow a"></div><div class="glow b"></div>`;
  if (p.kind === 'cover') {
    return `<section class="page">${glows}
      <img class="cover-logo" src="${logo}"/>
      <div class="cover-title">Notaty <span class="cover-ar">نوتاتي</span></div>
      <div class="sub" style="font-size:30px;margin-top:24px">${p.sub}</div>
      <div class="foot">notaty-delta.vercel.app</div></section>`;
  }
  if (p.kind === 'close') {
    return `<section class="page">${glows}
      <img class="cover-logo" src="${logo}"/>
      <div class="title" style="font-size:76px">${p.title}</div>
      <div class="sub" style="font-size:30px;margin-top:20px"><span class="accent">${p.sub}</span></div>
      </section>`;
  }
  return `<section class="page">${glows}
    <div class="label"><div class="title">${p.title}</div><div class="sub">${p.sub}</div></div>
    <div class="phone"><img src="${p.src}"/></div>
    <div class="foot">notaty-delta.vercel.app</div></section>`;
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
  <body>${pages.map(render).join('')}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => (document as any).fonts?.ready).catch(() => {});
await page.pdf({
  path: 'screenshots/notaty-carousel.pdf',
  preferCSSPageSize: true,
  printBackground: true,
});
if (process.argv.includes('--preview')) {
  await page.locator('.page').nth(0).screenshot({ path: 'screenshots/_preview-cover.png' });
  await page.locator('.page').nth(1).screenshot({ path: 'screenshots/_preview-feature.png' });
}
await browser.close();
console.log(`wrote screenshots/notaty-carousel.pdf (${pages.length} pages)`);
