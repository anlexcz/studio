const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const server = spawn('python3', ['-m', 'http.server', '8765', '--directory', '_site']);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        const animation = animate.apply(this, args);
        if (this.id === 'supportersTrack') window.creditsAnimation = animation;
        return animation;
      };
    });
    await page.goto('http://127.0.0.1:8765/outro/outro.html');
    await page.waitForFunction(() => window.creditsAnimation, null, { timeout: 20000 });
    await page.evaluate(() => {
      window.creditsAnimation.pause();
      window.creditsAnimation.currentTime = 16000;
    });
    const layout = await page.evaluate(() => {
      const rect = selector => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height };
      };
      return {
        guests: rect('.guests-block'), cta: rect('.cta-block'),
        credits: rect('.supporters-window'), panel: rect('.right-column'),
        names: document.querySelectorAll('.supporter').length,
        overflowing: [...document.querySelectorAll('.supporter, .social-value')]
          .filter(e => e.scrollWidth > e.clientWidth + 1).length,
        duration: window.creditsAnimation.effect.getTiming().duration,
        bottom: window.creditsAnimation.effect.getKeyframes().at(-1).transform,
        trackHeight: document.querySelector('#supportersTrack').scrollHeight
      };
    });
    assert.equal(layout.names, JSON.parse(fs.readFileSync('_site/outro/supporters.json', 'utf8')).supporters.length);
    assert(layout.guests.bottom <= layout.cta.top, 'Guest and CTA panels overlap');
    assert(layout.cta.bottom <= 905, 'CTA collides with footer');
    assert(layout.credits.height > 400);
    assert.equal(layout.overflowing, 0, 'Names or socials overflow horizontally');
    assert.equal(layout.bottom, `translateY(${-layout.trackHeight - 30}px)`);
    fs.mkdirSync('review', { recursive: true });
    await page.screenshot({ path: 'review/outro.png', omitBackground: true });
    await page.clock.install();
    await page.clock.fastForward(120000);
    assert.equal(await page.locator('#app').evaluate(e => e.classList.contains('fade-out')), false);
    await page.evaluate(() => window.creditsAnimation.finish());
    await page.waitForFunction(() => document.querySelector('#supportersThanks').classList.contains('credits-complete'));
    await page.clock.runFor(3499);
    assert.equal(await page.locator('#app').evaluate(e => e.classList.contains('fade-out')), false);
    await page.clock.runFor(1);
    assert.equal(await page.locator('#app').evaluate(e => e.classList.contains('fade-out')), true);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify(layout, null, 2));
  } finally {
    await browser.close();
    server.kill();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
