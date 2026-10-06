// Headless smoke test: boots the app, visits every screen, plays a full match via
// the UI (tapping dice and tokens), and fails on any console error.
// Run: python3 -m http.server 8765 & node tests/smoke.mjs [outDir]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(require('node:child_process').execSync('npm root -g').toString().trim() + '/playwright')); }

const BASE = process.env.BASE || 'http://localhost:8765/';
const out = process.argv[2] || 'shots';
const fs = await import('node:fs');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errors.push(`console: ${m.text()}`); });

const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });
const wait = (ms) => page.waitForTimeout(ms);

await page.goto(`${BASE}?nosw`);
await wait(1500);
await shot('01-splash');
await wait(2600);
await shot('02-daily');
// close daily modal: open the box then collect
const box = page.locator('.gift-box');
if (await box.count()) { await box.click(); await wait(1200); await shot('03-daily-open'); await page.locator('[data-a="close"]').click(); await wait(500); }
await shot('04-home');
await page.locator('.scroll').first().evaluate((el) => el.scrollTo(0, 600));
await wait(400);
await shot('05-home-scrolled');

for (const tab of ['play', 'chats', 'rewards', 'profile']) {
  await page.locator(`.nav-item[data-tab="${tab}"]`).click();
  await wait(900);
  await shot(`06-${tab}`);
}
// profile sheet from play grid
await page.locator('.nav-item[data-tab="play"]').click();
await wait(900);
await page.locator('[data-prof]').first().click();
await wait(600);
await shot('07-profile-sheet');
await page.mouse.click(195, 40);
await wait(500);

// Play a 2P match through the UI (turbo mode compresses scripted delays)
await page.goto(`${BASE}?nosw&fast&turbo`);
await wait(1500);
await wait(800);
await page.locator('.play-now').click();
await wait(1800);
await shot('08-matchmaking');
await wait(2600);
await shot('09-vs');
await page.waitForSelector('.game-screen', { timeout: 15000 });
await wait(1200);
await shot('10-game');

let shotsTaken = 0;
const t0 = Date.now();
while (Date.now() - t0 < 240000) {
  if (await page.locator('.result').count()) break;
  const sc = page.locator('.sc-modal [data-a="no"]');
  if (await sc.count()) { await wait(500); await shot('11-second-chance'); await page.evaluate(() => document.querySelector('.sc-modal [data-a="no"]')?.click()); await wait(400); continue; }
  const dice = page.locator('.dice-slot .dice-stage.ready');
  if (await dice.count()) { await page.evaluate(() => document.querySelector('.dice-slot .dice-stage.ready')?.click()); await wait(300); continue; }
  const piece = page.locator('.piece.can-move');
  if (await piece.count()) { await page.evaluate(() => document.querySelector('.piece.can-move')?.click()); await wait(300); continue; }
  if (shotsTaken === 0 && Date.now() - t0 > 25000) { await shot('10b-game-mid'); shotsTaken = 1; }
  if (shotsTaken === 1 && Date.now() - t0 > 60000) {
    await page.locator('[data-act="chat"]').click(); await wait(600); await shot('10c-chat-sheet');
    await page.locator('.chat-sheet [data-q]').first().click(); await wait(300);
    await page.mouse.click(195, 60); await wait(400); shotsTaken = 2;
  }
  await wait(250);
}
await wait(2600);
await shot('12-result');
console.log('result present:', await page.locator('.result').count());

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no errors');
await browser.close();
process.exit(errors.length ? 1 : 0);
