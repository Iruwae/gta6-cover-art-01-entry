// Verification + screenshot driver for the Sunset Circuit app.
// Serves app/ with serve.ts, opens it in the headless Chromium shell,
// exercises the real UI (aspect tabs, grade, layout, title edit, export),
// saves the app's own exported PNGs, and screenshots the studio UI.
// Run: node tools-shots.mjs  (from the repository root)
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from '/home/hatch/workspace/makefun/qa-tools/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = '/tmp/sunset-exports';
mkdirSync(OUT, { recursive: true });

const server = spawn('node', ['serve.ts', '--port', '8091'], { cwd: here, stdio: 'pipe' });
await new Promise((resolve) => setTimeout(resolve, 1200));

const browser = await puppeteer.launch({
  executablePath: '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux/headless_shell',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 860 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
page.on('requestfailed', (r) => errors.push('reqfail ' + r.url()));

await page.goto('http://127.0.0.1:8091/', { waitUntil: 'networkidle0', timeout: 30000 });
await page.waitForFunction(() => window.sunsetCircuit && window.sunsetCircuit.ready(), { timeout: 30000 });
console.log('app loaded, demo cast ready');

// Exercise the UI like a user would: switch aspect, grade, layout, edit title.
await page.evaluate(() => window.sunsetCircuit.setAspect('4:5'));
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => window.sunsetCircuit.setGrade('neon'));
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => window.sunsetCircuit.setLayout('grid'));
await new Promise((r) => setTimeout(r, 400));
await page.type('#titleInput', '', { delay: 0 }).catch(() => {});
await page.evaluate(() => {
  const input = document.getElementById('titleInput');
  input.value = 'Sundown Circuit';
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.evaluate(() => window.sunsetCircuit.setLayout('mosaic'));
await page.evaluate(() => window.sunsetCircuit.setGrade('sunset'));
await page.evaluate(() => window.sunsetCircuit.setAspect('16:9'));
await new Promise((r) => setTimeout(r, 600));

// Export all three sizes through the app's own export path.
const results = {};
for (const aspect of ['16:9', '4:5', '1:1']) {
  const res = await page.evaluate(async (a) => window.sunsetCircuit.exportPNG(a), aspect);
  const buf = Buffer.from(res.data);
  const name = `export-${aspect.replace(':', 'x')}.png`;
  writeFileSync(join(OUT, name), buf);
  results[aspect] = { width: res.width, height: res.height, bytes: buf.length };
  console.log('exported', aspect, res.width + 'x' + res.height, buf.length, 'bytes');
}

// Click EXPORT ALL and read the timer line (speed proof).
await page.click('#exportAllBtn');
await new Promise((r) => setTimeout(r, 2500));
const timer = await page.evaluate(() => document.getElementById('exportTimer').textContent);
console.log('export-all timer:', timer);

// Studio UI screenshot, 1280x800, photo loaded, face boxes visible.
// Scroll back to the top first: the export-all click scrolled the page down.
await page.setViewport({ width: 1280, height: 800 });
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: join(OUT, 'ui-1280x800.png') });
console.log('ui screenshot saved');

console.log('console errors:', JSON.stringify(errors, null, 1));
console.log('RESULTS', JSON.stringify(results));
await browser.close();
server.kill();
