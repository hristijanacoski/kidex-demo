// Usage: node tools/check-showcase.cjs [path-to-playwright]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.argv[2] || 'playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.audit');
fs.mkdirSync(output, { recursive: true });
const report = { interactions: [], accessibility: [], errors: [] };
const url = prefix => pathToFileURL(path.join(root, prefix, 'index.html')).href;

(async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce', hasTouch: true });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    for (const prefix of ['', 'mk']) {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(url(prefix));
        await page.locator('.showcase-slide img').evaluateAll(images => images.forEach(image => image.loading = 'eager'));
        await page.evaluate(() => Promise.all(Array.from(document.querySelectorAll('.showcase-slide img'), image => image.decode())));
        const tabs = page.locator('.showcase-tab');
        const slides = page.locator('.showcase-slide');
        async function checkSelection(index) {
          assert.equal(await page.locator('.showcase-tab[aria-selected="true"]').count(), 1);
          assert.equal(await tabs.nth(index).getAttribute('aria-selected'), 'true');
          assert.equal(await page.locator('.showcase-tab[tabindex="0"]').count(), 1);
          assert.equal(await slides.nth(index).evaluate(element => element.inert), false);
          assert.equal(await page.locator('.showcase-slide[inert]').count(), 2);
          assert.equal(await page.locator('[data-showcase-current]').innerText(), `0${index + 1}`);
        }
        await checkSelection(0);
        await tabs.nth(2).click();
        await checkSelection(2);
        await page.locator('.showcase-next').click();
        await checkSelection(0);
        await page.locator('.showcase-prev').click();
        await checkSelection(2);
        await tabs.nth(2).focus();
        await page.keyboard.press(width <= 860 ? 'ArrowRight' : 'ArrowDown');
        await checkSelection(0);
        assert(await tabs.nth(0).evaluate(element => element === document.activeElement));
        await page.keyboard.press('End');
        await checkSelection(2);
        await page.keyboard.press('Home');
        await checkSelection(0);
        // Tab from the selected theme must skip the hidden panels' service links.
        await page.keyboard.press('Tab');
        assert(await slides.nth(0).locator('a').evaluate(element => element === document.activeElement));
        assert(await page.locator('.showcase-slide img').first().evaluate(element => parseFloat(getComputedStyle(element).transitionDuration) < .01));
        assert(await page.locator('.showcase-tab').evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth + 1)));
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        if ([320, 1440].includes(width)) {
          await page.addScriptTag({ path: path.join(output, 'axe.min.js') });
          for (let index = 0; index < 3; index++) {
            await tabs.nth(index).click();
            const violations = await page.evaluate(async () => (await axe.run('.work-showcase', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } })).violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })));
            report.accessibility.push({ prefix, width, slide: index + 1, violations });
            assert.deepEqual(violations, []);
          }
        }
        await tabs.nth(0).click();
        await page.locator('.work-showcase').screenshot({ path: path.join(output, `showcase-${prefix || 'en'}-${width}.png`) });
        if (width === 390) {
          // Exercise browser touch events, not just the carousel's callbacks.
          const client = await context.newCDPSession(page);
          const stage = await page.locator('.showcase-stage').boundingBox();
          const x = stage.x + stage.width * .8, y = stage.y + stage.height * .3;
          await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
          await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 120, y }] });
          await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await checkSelection(1);
          assert.equal(page.url(), url(prefix), 'Swipe should not follow a service link');
          await client.detach();
        }
        report.interactions.push(`${prefix || 'en'} at ${width}px: selection, wrap, keyboard, focus, reduced motion, layout passed`);
      }
    }
    // Motion stays finite and all three images remain available without JS.
    const motionPage = await browser.newPage({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 1000 } });
    await motionPage.goto(url(''));
    await motionPage.locator('.work-showcase').scrollIntoViewIfNeeded();
    await motionPage.waitForFunction(() => document.querySelector('.work-showcase').classList.contains('has-entered'));
    assert.equal(await motionPage.locator('.photo-heading').evaluate(element => getComputedStyle(element).animationIterationCount), '1');
    await motionPage.locator('.showcase-next').click();
    await motionPage.waitForFunction(() => getComputedStyle(document.querySelectorAll('.showcase-slide')[1]).opacity === '1');
    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 1000 } });
    const staticPage = await nojs.newPage();
    for (const prefix of ['', 'mk']) {
      await staticPage.goto(url(prefix));
      assert.equal(await staticPage.locator('.showcase-tabs').isVisible(), false);
      assert.equal(await staticPage.locator('.showcase-controls').isVisible(), false);
      for (const slide of await staticPage.locator('.showcase-slide').all()) assert(await slide.isVisible());
      await staticPage.locator('.showcase-slide a').last().click();
      assert(staticPage.url().endsWith('services.html#it-solutions'));
    }
    await nojs.close();
    assert.deepEqual(report.errors, []);
    console.log(`PASS: ${report.interactions.length} responsive interaction checks, ${report.accessibility.length} accessibility scans, touch swipes, finite motion, and both no-JavaScript fallbacks.`);
  } finally {
    fs.writeFileSync(path.join(output, 'showcase-checks.json'), JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
