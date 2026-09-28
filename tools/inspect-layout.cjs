// Local visual inspection. Pass a path to playwright if it is not installed here.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.argv[2] || 'playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.audit');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'translations/mk.json'), 'utf8'));
fs.mkdirSync(output, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    res.writeHead(error ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(error ? 'Not found' : data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    const results = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    const base = `http://127.0.0.1:${server.address().port}/`;
    for (const width of [320, 360, 390, 620, 621, 768, 860, 861, 1024, 1080, 1081, 1100, 1101, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      for (const lang of ['', 'mk/']) {
        for (const name of ['index', 'about', 'services', 'contact']) {
          await page.goto(`${base}${lang}${name}.html`);
          await page.locator('img').evaluateAll(images => images.forEach(i => i.loading = 'eager'));
          await page.evaluate(() => Promise.all(Array.from(document.images, i => i.decode())));
          if ([390, 768, 1440].includes(width)) await page.screenshot({ path: path.join(output, `${lang ? 'mk-' : ''}${name}-${width}.png`), fullPage: true });
          const issues = await page.evaluate(() => {
            const problems = [];
            const rect = e => e.getBoundingClientRect();
            if (document.documentElement.scrollWidth > innerWidth) problems.push('Horizontal overflow');
            if (document.querySelectorAll('link[rel="stylesheet"]').length !== 1) problems.push('Duplicate stylesheet');
            const containers = Array.from(document.querySelectorAll('.container'), rect);
            if (containers.some(r => Math.abs(r.x - containers[0].x) > 1 || Math.abs(r.width - containers[0].width) > 1)) problems.push('Container edges do not align');
            const header = rect(document.querySelector('.site-header'));
            const eyebrow = rect(document.querySelector('main .eyebrow'));
            if (eyebrow.top < header.bottom + 24) problems.push('Hero hidden by header');
            const nav = Array.from(document.querySelector('.site-header .container').children).filter(e => e.getClientRects().length).map(rect);
            if (nav.some((r, i) => i && r.left < nav[i - 1].right - 1)) problems.push('Header overlap');
            document.querySelectorAll('.service-index').forEach(e => {
              if (e.scrollWidth > e.clientWidth + 1) problems.push('Service number exceeds its column');
            });
            if (innerWidth > 620) {
              const photos = Array.from(document.querySelectorAll('.photo-grid figure'), rect);
              if (photos.some(r => Math.abs(r.top - photos[0].top) > 1)) problems.push('Orphan photo');
            }
            if (innerWidth > 1080) {
              for (const selector of ['.it-card h3', '.it-card > p', '.it-list']) {
                const rows = Array.from(document.querySelectorAll(selector), rect);
                if (rows.some(r => Math.abs(r.top - rows[0].top) > 1)) problems.push(`Card alignment: ${selector}`);
              }
            }
            const contact = document.querySelector('.contact-grid');
            if (contact && innerWidth > 860) {
              const form = rect(contact.querySelector('form'));
              const details = rect(contact.querySelector('dl'));
              if (Math.abs(form.top - details.top) > 1) problems.push('Contact column alignment');
            }
            document.querySelectorAll('.flow-node strong, .flow-node small').forEach(e => {
              if (e.scrollWidth > e.clientWidth + 1) problems.push('Clipped diagram label');
            });
            const support = document.querySelector('.support-photo-grid');
            if (support && !support.firstElementChild.classList.contains('support-photo-copy')) problems.push('Image precedes its introduction');
            if (innerWidth <= 620) document.querySelectorAll('.hero-actions .btn, .cta-actions .btn').forEach(e => {
              if (Math.abs(rect(e).width - rect(e.parentElement).width) > 1) problems.push('Mobile button width');
            });
            return problems;
          });
          assert.deepEqual(issues, [], `${lang}${name} at ${width}px: ${issues.join(', ')}`);
          if (width === 390) {
            if (!lang) {
              const strings = await page.evaluate(() => {
                const strings = [];
                const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
                while (walker.nextNode()) {
                  const node = walker.currentNode;
                  if (!node.parentElement.closest('script, style, svg, noscript') && node.textContent.trim()) strings.push(node.textContent.trim());
                }
                document.querySelectorAll('[alt], [aria-label], meta[name="description"], meta[property="og:title"], meta[property="og:description"]').forEach(e => {
                  for (const attr of ['alt', 'aria-label', 'content']) if (e.hasAttribute(attr)) strings.push(e.getAttribute(attr).trim());
                });
                return strings;
              });
              // Empty alt text is intentional for decorative images; the build also leaves it untranslated.
              const missing = [...new Set(strings.filter(s => s && !(s in catalog)))];
              assert.deepEqual(missing, [], `Missing Macedonian build translations in ${name}`);
            }
            const urls = await page.locator('[href], [src]').evaluateAll(elements => elements.flatMap(e => [e.getAttribute('href'), e.getAttribute('src')].filter(Boolean)));
            for (const url of urls) {
              if (/^(?:[a-z]+:|\/\/)/i.test(url)) continue;
              const target = new URL(url, `${base}${lang}${name}.html`);
              const file = path.join(root, decodeURIComponent(target.pathname));
              assert(fs.existsSync(file), `Missing resource: ${file}`);
              if (target.hash && file.endsWith('.html')) assert(fs.readFileSync(file, 'utf8').includes(`id="${target.hash.slice(1)}"`), `Missing anchor: ${url}`);
            }
          }
          results.push(`${lang}${name}: ${width}px OK`);
        }
      }
      console.log(`PASS: all eight pages at ${width}px`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const lang of ['', 'mk/']) {
      await page.goto(`${base}${lang}services.html#laboratory-equipment`);
      await page.locator('.language-switch a:not([aria-current])').click();
      assert(page.url().endsWith('services.html#laboratory-equipment'));
      assert.equal(await page.locator('html').getAttribute('lang'), lang ? 'en' : 'mk');
      await page.waitForFunction(() => Math.abs(document.querySelector('#laboratory-equipment').getBoundingClientRect().top - 92) < 2);
      await page.locator('.hamburger').click();
      assert(await page.locator('main').evaluate(e => e.inert));
      assert(await page.locator('.mobile-panel a').first().evaluate(e => e === document.activeElement));
      await page.keyboard.press('Escape');
      assert(await page.locator('.hamburger').evaluate(e => e === document.activeElement));
      await page.locator('.hamburger').click();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForFunction(() => !document.querySelector('main').inert);
      assert(await page.locator('.main-nav a[aria-current="page"]').evaluate(e => e === document.activeElement));
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${base}${lang}contact.html`);
      await page.locator('#cf-name').fill('Test User');
      await page.locator('#cf-email').fill('invalid');
      await page.locator('#cf-message').fill('A product enquiry & special characters: + % ?');
      await page.locator('button[type="submit"]').click();
      assert(!(await page.locator('#cf-email').evaluate(e => e.validity.valid)));
      assert.equal(await page.locator('#cf-email').getAttribute('aria-invalid'), 'true');
      await page.locator('#cf-email').fill('test@example.com');
      assert.equal(await page.locator('.form-status').innerText(), '');
      await page.locator('#cf-name').fill('   ');
      await page.locator('.copy-message').click();
      assert(await page.locator('#cf-name').evaluate(e => e === document.activeElement));
      assert.equal(await page.locator('#cf-name').getAttribute('aria-invalid'), 'true');
      await page.locator('#cf-name').fill('Test User');
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.copiedText = text; } }, configurable: true }));
      await page.locator('.copy-message').click();
      await page.waitForFunction(() => window.copiedText?.includes('test@example.com'));
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw Error('Denied'); } }, configurable: true }));
      await page.locator('.copy-message').click();
      assert(await page.locator('#cf-message').evaluate(e => e === document.activeElement && e.selectionEnd === e.value.length));
    }
    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const staticPage = await nojs.newPage();
    for (const lang of ['', 'mk/']) {
      await staticPage.goto(`${base}${lang}index.html`);
      assert(await staticPage.locator('.main-nav').isVisible());
      assert(await staticPage.locator('.reveal').first().isVisible());
      await staticPage.locator('.main-nav a[href="contact.html"]').click();
      assert(await staticPage.locator('a[href="mailto:info@kidex.mk"]').first().isVisible());
    }
    await nojs.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'alignment-checks.json'), JSON.stringify({ layouts: results, functional: 'Language/anchor switching, menu/focus/Escape/resize, form validation, clipboard/fallback, no-JS navigation, local links and resources passed', errors }, null, 2));
    console.log(`PASS: ${results.length} layouts plus interaction and resource checks.`);
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
