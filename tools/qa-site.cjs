// Usage: node tools/qa-site.cjs [path-to-playwright] [report-name] [chromium,firefox,webkit]
// Optional accessibility dependency: .audit/axe.min.js (axe-core 4.10.3).
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const playwright = require(process.argv[2] || 'playwright');
const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, '.audit');
fs.mkdirSync(artifacts, { recursive: true });
const report = { browsers: {}, checks: [], failures: [], accessibility: [], limitations: [] };
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  let requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (requested.endsWith('/')) requested += 'index.html';
  const file = path.resolve(root, '.' + requested);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    res.writeHead(error ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(error ? 'Not found' : data);
  });
});
async function check(browser, name, task) {
  try { await task(); report.checks.push({ browser, name, result: 'PASS' }); }
  catch (error) { report.failures.push({ browser, name, error: error.message }); console.log(`FAIL ${browser}: ${name}: ${error.message.split('\n')[0]}`); }
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const axe = path.join(artifacts, 'axe.min.js');
  if (!fs.existsSync(axe)) report.limitations.push('axe-core unavailable: automated accessibility scans skipped.');
  for (const engine of (process.argv[4] || 'chromium,firefox,webkit').split(',')) {
    console.log(`Launching ${engine}...`);
    let browser;
    try { browser = await playwright[engine].launch({ timeout: 20000 }); }
    catch (error) { report.limitations.push(`${engine} could not launch: ${error.message.split('\n')[0]}`); continue; }
    report.browsers[engine] = browser.version();
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    const runtime = [];
    page.on('pageerror', error => runtime.push(error.message));
    page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) runtime.push(`HTTP ${response.status()}: ${response.url()}`); });
    try {
      for (const viewport of [{ width: 320, height: 700 }, { width: 768, height: 900 }, { width: 1440, height: 900 }, { width: 812, height: 375 }]) {
        await page.setViewportSize(viewport);
        for (const lang of ['', 'mk/']) for (const name of ['index', 'about', 'services', 'contact']) {
          const label = `${lang}${name} ${viewport.width}x${viewport.height}`;
          await check(engine, `Page integrity: ${label}`, async () => {
            await page.goto(`${base}${lang}${name}.html`);
            await page.locator('img').evaluateAll(images => images.forEach(i => i.loading = 'eager'));
            await page.evaluate(() => Promise.all(Array.from(document.images, i => i.decode())));
            assert.equal(await page.locator('h1').count(), 1);
            assert.equal(await page.locator('html').getAttribute('lang'), lang ? 'mk' : 'en');
            assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow');
            assert(await page.evaluate(() => {
              const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
              return ids.length === new Set(ids).size;
            }), 'Duplicate IDs');
            assert(await page.evaluate(() => [...document.querySelectorAll('svg use')].every(e => document.querySelector(e.getAttribute('href')))), 'Missing SVG symbol');
            assert(await page.evaluate(() => {
              const elements = [...document.querySelectorAll('a, button, input, textarea')].filter(e => e.getClientRects().length && !e.closest('[inert], .skip-link'));
              return elements.every(e => { const r = e.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; });
            }), 'Interactive control outside viewport');
          });
          if ([320, 1440].includes(viewport.width) && fs.existsSync(axe)) {
            await check(engine, `Accessibility: ${label}`, async () => {
              await page.addScriptTag({ path: axe });
              const scan = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })));
              report.accessibility.push({ browser: engine, page: label, violations: scan });
              assert.equal(scan.length, 0, scan.map(v => v.id).join(', '));
            });
          }
        }
        console.log(`Checked ${engine}: 8 pages at ${viewport.width}x${viewport.height}`);
      }
      for (const lang of ['', 'mk/']) {
        await page.setViewportSize({ width: 390, height: 844 });
        await check(engine, `${lang}Skip link and keyboard menu`, async () => {
          await page.goto(base + lang);
          await page.keyboard.press('Tab');
          assert(await page.locator('.skip-link').evaluate(e => e === document.activeElement));
          await page.keyboard.press('Enter');
          assert(await page.locator('main').evaluate(e => e === document.activeElement));
          await page.locator('.hamburger').click();
          assert(await page.locator('main').evaluate(e => e.inert));
          const first = page.locator('.hamburger');
          const last = page.locator('.mobile-panel a').last();
          await last.focus(); await page.keyboard.press('Tab');
          assert(await first.evaluate(e => e === document.activeElement));
          await page.keyboard.press('Shift+Tab');
          assert(await last.evaluate(e => e === document.activeElement));
          await page.keyboard.press('Escape');
          assert(await page.locator('.hamburger').evaluate(e => e === document.activeElement));
          assert(!(await page.locator('main').evaluate(e => e.inert)));
        });
        await check(engine, `${lang}Language links preserve fragments before activation`, async () => {
          await page.goto(base + lang + 'services.html#development');
          const link = page.locator('.language-switch a:not([aria-current])');
          assert((await link.getAttribute('href')).endsWith('#development'), 'Language link loses section when opened in a new tab');
          await page.evaluate(() => { location.hash = 'optimization'; });
          await page.waitForFunction(() => document.querySelector('.language-switch a:not([aria-current])').hash === '#optimization');
          await page.evaluate(() => { location.hash = ''; });
          await page.waitForFunction(() => !document.querySelector('.language-switch a:not([aria-current])').hash);
        });
        await check(engine, `${lang}Focus survives desktop-to-mobile resize`, async () => {
          await page.setViewportSize({ width: 1440, height: 900 });
          await page.goto(base + lang + 'about.html');
          await page.locator('.main-nav a[aria-current]').focus();
          await page.setViewportSize({ width: 390, height: 844 });
          await page.waitForFunction(() => document.activeElement === document.querySelector('.hamburger'));
        });
        await check(engine, `${lang}Form validation and complete clipboard content`, async () => {
          await page.goto(base + lang + 'contact.html');
          await page.locator('.copy-message').click();
          assert(await page.locator('#cf-name').evaluate(e => e === document.activeElement));
          await page.locator('#cf-name').fill('   ');
          await page.locator('#cf-email').fill('test@example.com');
          await page.locator('#cf-message').fill('   ');
          await page.locator('.copy-message').click();
          assert(await page.locator('#cf-name').evaluate(e => !e.validity.valid));
          await page.locator('#cf-name').fill('QA Тест');
          await page.locator('#cf-message').fill('Пример & details + ? # %');
          await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.qaCopiedText = text; } } }));
          await page.locator('.copy-message').click();
          await page.waitForFunction(() => window.qaCopiedText);
          const content = await page.evaluate(() => window.qaCopiedText);
          assert(content.includes('QA Тест') && content.includes('test@example.com') && content.includes('Пример & details + ? # %'));
          await page.locator('#cf-email').fill('invalid');
          await page.locator('.copy-message').click();
          assert.equal(await page.locator('#cf-email').getAttribute('aria-invalid'), 'true');
          assert(await page.locator('#cf-email').evaluate(e => e === document.activeElement));
        });
        await check(engine, `${lang}No-JavaScript navigation`, async () => {
          const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 700 } });
          try {
            const staticPage = await nojs.newPage();
            await staticPage.goto(base + lang);
            assert(await staticPage.locator('.main-nav').isVisible());
            await staticPage.locator('.main-nav a[href="contact.html"]').click();
            assert(await staticPage.locator('a[href="mailto:info@kidex.mk"]').first().isVisible());
          } finally { await nojs.close(); }
        });
        await check(engine, `${lang}Navigation survives blocked script`, async () => {
          const failed = await browser.newContext({ viewport: { width: 320, height: 700 } });
          try {
            await failed.route('**/js/script.js*', route => route.abort());
            const failedPage = await failed.newPage();
            await failedPage.goto(base + lang);
            assert(await failedPage.locator('.main-nav').isVisible(), 'Primary links hidden when JavaScript fails');
            assert(!(await failedPage.locator('.hamburger').isVisible()), 'Inoperative hamburger shown');
          } finally { await failed.close(); }
        });
        await check(engine, `${lang}200% text remains usable`, async () => {
          await page.setViewportSize({ width: 390, height: 844 });
          await page.goto(base + lang + 'services.html');
          await page.addStyleTag({ content: 'html { font-size: 200%; }' });
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow with enlarged text');
          const header = await page.locator('.site-header').boundingBox();
          const heading = await page.locator('h1').boundingBox();
          assert(heading.y >= header.y + header.height, 'Heading hidden with enlarged text');
        });
      }
      await check(engine, 'No runtime or resource errors', async () => assert.deepEqual(runtime, []));
    } finally {
      await browser.close();
      fs.writeFileSync(path.join(artifacts, (process.argv[3] || 'qa-results') + '.json'), JSON.stringify(report, null, 2));
    }
  }
})().catch(error => { report.failures.push({ browser: 'runner', name: 'Unexpected failure', error: error.stack }); }).finally(() => {
  server.close();
  const name = process.argv[3] || 'qa-results';
  fs.writeFileSync(path.join(artifacts, name + '.json'), JSON.stringify(report, null, 2));
  console.log(`${report.checks.length} passed; ${report.failures.length} failed; ${report.accessibility.length} accessibility scans; ${report.limitations.length} limitations.`);
  if (report.failures.length) process.exitCode = 1;
});
