// Screenshot walker. Runs against the LOCAL dev server (cloud mode), enters the
// no-account demo, and captures every screen/state at mobile + desktop.
//   npm run dev   (in another terminal)   then:   npx tsx scripts/shots.ts
import { chromium, type Page, type BrowserContext } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173';

const VIEWPORTS = [
  { dir: 'mobile', viewport: { width: 390, height: 844 }, dsf: 3, mobile: true },
  { dir: 'desktop', viewport: { width: 1440, height: 900 }, dsf: 2, mobile: false },
];

async function settle(page: Page) {
  await page.addStyleTag({
    content: `*,*::before,*::after{animation:none!important;transition:none!important}`,
  });
  await page.evaluate(() => (document as any).fonts?.ready).catch(() => {});
  await page.waitForTimeout(450);
}

async function run(context: BrowserContext, dir: string) {
  const out = (name: string) => `screenshots/${dir}/${name}.png`;
  mkdirSync(`screenshots/${dir}`, { recursive: true });
  const page = await context.newPage();
  const snap = async (name: string) => {
    await settle(page);
    await page.screenshot({ path: out(name) });
    console.log('  ', dir, name);
  };
  const back = async () => {
    await page.getByLabel('Back to capture').click();
    await page.getByText("What's on your mind?").waitFor();
  };
  const openSection = async (label: RegExp) => {
    await page.getByRole('button', { name: label }).click();
    await page.waitForTimeout(300);
  };

  // fresh guest each run
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE);

  // 1. auth screen (with Try-the-demo)
  await page.getByText('Dump your thoughts').waitFor();
  await snap('01-signin');

  // 2. enter demo → capture / home
  await page.getByRole('button', { name: /Try the demo/ }).click();
  await page.getByText("What's on your mind?").waitFor();
  await snap('02-home');

  // 3. live parse — Arabic reminder
  const ta = page.getByPlaceholder("What's on your mind?");
  await ta.fill('ذكّرني بكرا الساعة وحدة اتصل بالبنك');
  await page.waitForTimeout(300);
  await snap('03-capture-arabic');

  // 4. live parse — English task with priority
  await ta.fill('call the dentist tomorrow 5pm !important #health');
  await page.waitForTimeout(300);
  await snap('04-capture-english');
  await ta.fill('');

  // 5. notes list
  await openSection(/My notes/);
  await snap('05-notes');
  // 6. a type filter
  const filters = page.locator('button', { hasText: /^Task|Reminder|Today$/ });
  if (await filters.first().isVisible().catch(() => false)) {
    await filters.first().click();
    await snap('06-notes-filter');
    await page.getByRole('button', { name: /^🗂 All$|^All$/ }).first().click().catch(() => {});
  }
  // 7. search + 8. empty search
  await page.getByPlaceholder(/Search/).fill('دكتور');
  await snap('07-search');
  await page.getByPlaceholder(/Search/).fill('zzqqxx');
  await snap('08-empty-state');
  await page.getByPlaceholder(/Search/).fill('');
  await back();

  // 9. saved reels
  await openSection(/Saved/);
  await snap('09-saved');
  await back();
  // 10. hustle
  await openSection(/Hustle/);
  await snap('10-hustle');
  await back();
  // 11. wish list
  await openSection(/Wish list/);
  await snap('11-wish');
  await back();
  // 12. since when + 13. detail
  await openSection(/Since when/);
  await snap('12-since');
  await page.locator('.rounded-2xl button', { hasText: /Haircut|Water|grandma|oil/ }).first().click().catch(() => {});
  await page.waitForTimeout(300);
  await snap('13-since-detail');
  await page.getByRole('button', { name: 'Back', exact: true }).click().catch(() => {});
  await page.waitForTimeout(250);
  await back().catch(() => {});

  // 14. review
  const review = page.getByRole('button', { name: /Review .* forgotten/ });
  if (await review.isVisible().catch(() => false)) {
    await review.click();
    await snap('14-review');
    await back();
  }

  // 15. menu, 16. notifications (guest-gated), 17. save (guest-gated)
  await page.getByLabel('Menu').first().click();
  await snap('15-menu');
  await page.getByRole('button', { name: /Notifications/ }).click();
  await snap('16-notifications');
  await page.getByRole('button', { name: /^✕$|Close/ }).first().click().catch(() => {});
  await page.getByLabel('Menu').first().click();
  await page.getByRole('button', { name: /Save reels/ }).click();
  await snap('17-save-setup');
  await page.getByRole('button', { name: /^✕$|Close/ }).first().click().catch(() => {});

  // 18. light theme
  await page.getByLabel('Menu').first().click();
  await page.getByRole('button', { name: /Light mode/ }).click();
  await snap('18-light-theme');

  await page.close();
}

const browser = await chromium.launch();
for (const v of VIEWPORTS) {
  console.log('viewport:', v.dir);
  const context = await browser.newContext({
    viewport: v.viewport,
    deviceScaleFactor: v.dsf,
    isMobile: v.mobile,
    hasTouch: v.mobile,
  });
  await run(context, v.dir);
  await context.close();
}
await browser.close();
console.log('done.');
