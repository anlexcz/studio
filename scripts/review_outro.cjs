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
    assert(layout.cta.bottom <= 876, 'CTA collides with footer');
    assert(layout.credits.height > 470);
    assert(Math.abs(layout.cta.bottom-layout.panel.bottom)<1,'Panel bottom edges differ');
    assert.equal(await page.locator('a').count(),0,'Video overlay contains interactive links');
    assert.equal(layout.overflowing, 0, 'Names or socials overflow horizontally');
    assert.equal(layout.bottom, `translateY(${-layout.trackHeight - 30}px)`);
    fs.mkdirSync('review', { recursive: true });
    const screenshot = await page.screenshot({ path: 'review/outro.png', omitBackground: true });
    const design = await page.evaluate(async screenshot64 => {
      const style = selector => getComputedStyle(document.querySelector(selector));
      const guestTitle = style('#guestsTitle'), ctaTitle = style('#ctaLeadTitle');
      const shot = new Image(); shot.src = 'data:image/png;base64,' + screenshot64; await shot.decode();
      const canvas = document.createElement('canvas'); canvas.width = 1920; canvas.height = 1080;
      const ctx = canvas.getContext('2d'); ctx.drawImage(shot, 0, 0);
      const centerAlpha = ctx.getImageData(1000, 450, 1, 1).data[3];
      const edgeAlpha = ctx.getImageData(10, 450, 1, 1).data[3];
      const badge = new Image(); badge.src = 'assets/metrobus_badge.png'; await badge.decode();
      canvas.width = badge.naturalWidth; canvas.height = badge.naturalHeight;
      ctx.drawImage(badge, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3] > 8) {
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      }
      const logo = document.querySelector('.footer-logo');
      const scale = parseFloat(getComputedStyle(logo, '::before').maskSize) / 100;
      const width = logo.clientWidth * scale, height = width * badge.naturalHeight / badge.naturalWidth;
      const offsetX = (logo.clientWidth - width) / 2, offsetY = (logo.clientHeight - height) / 2;
      return {
        guestHeading: [guestTitle.fontSize, guestTitle.lineHeight, guestTitle.fontWeight],
        ctaHeading: [ctaTitle.fontSize, ctaTitle.lineHeight, ctaTitle.fontWeight],
        centerAlpha, edgeAlpha,
        logoBounds: { left: offsetX + minX / badge.naturalWidth * width,
          top: offsetY + minY / badge.naturalHeight * height,
          right: offsetX + maxX / badge.naturalWidth * width,
          bottom: offsetY + maxY / badge.naturalHeight * height,
          width: logo.clientWidth, height: logo.clientHeight },
        logoTop: logo.getBoundingClientRect().top
      };
    }, screenshot.toString('base64'));
    assert.deepEqual(design.guestHeading, design.ctaHeading, 'Left headings have inconsistent typography');
    assert(design.centerAlpha > 0 && design.centerAlpha < 50, 'Center vignette is too opaque');
    assert(design.edgeAlpha>design.centerAlpha && design.edgeAlpha<100,'Vignette is missing or too heavy');
    assert(design.logoBounds.left >= 2 && design.logoBounds.top >= 2 &&
      design.logoBounds.right <= design.logoBounds.width - 2 &&
      design.logoBounds.bottom <= design.logoBounds.height - 2, 'Footer logo mask clips the badge');
    assert(design.logoTop + design.logoBounds.bottom <= 1080 - 8, 'Footer logo touches the canvas boundary');
    await page.evaluate(() => {
      document.body.style.backgroundImage = 'repeating-conic-gradient(#293850 0% 25%, #788da6 0% 50%)';
      document.body.style.backgroundSize = '160px 160px';
    });
    await page.screenshot({ path: 'review/outro-video-check.png' });
    await page.evaluate(() => { document.body.style.backgroundImage = ''; });
    await page.evaluate(() => {
      for (const name of ['Další host', 'Čtvrtý host']) {
        const item = document.createElement('div'); item.textContent = name;
        document.querySelector('#guestsList').appendChild(item);
      }
    });
    assert.equal(await page.evaluate(() => document.querySelector('.guests-block').getBoundingClientRect().bottom <= document.querySelector('.cta-block').getBoundingClientRect().top), true);
    console.log(JSON.stringify(design, null, 2));
    await page.clock.install({ time: new Date('2026-10-13T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-13T00:00:01Z'));
    await page.clock.fastForward(120000);
    assert.equal(await page.locator('#app').evaluate(e => e.classList.contains('fade-out')), false);
    await page.evaluate(async () => {
      window.creditsAnimation.finish();
      await window.creditsAnimation.finished;
    });
    assert.equal(await page.locator('#supportersThanks').evaluate(e => e.classList.contains('credits-complete')), true);
    await page.clock.runFor(3499);
    assert.equal(await page.locator('#app').evaluate(e => e.classList.contains('fade-out')), false);
    await page.clock.runFor(1);
    assert.equal(await page.locator('#app').evaluate(e => e.classList.contains('fade-out')), true);
    assert.deepEqual(errors, []);
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundImage), 'none');
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#app'), '::after').clipPath), 'none');
    const preview = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await preview.goto('http://127.0.0.1:8765/outro/outro.html?preview=photo');
    await preview.waitForFunction(() => document.querySelector('#supportersTrack').getAnimations().length > 0);
    await preview.evaluate(() => {
      const scroll = document.querySelector('#supportersTrack').getAnimations()[0];
      scroll.pause(); scroll.currentTime = 16000;
    });
    await preview.waitForFunction(() => document.querySelector('#easterEgg').classList.contains('is-visible'));
    await preview.waitForTimeout(450);
    assert(await preview.evaluate(() => getComputedStyle(document.body).backgroundImage.includes('preview-photo.webp')));
    const photoWidth = await preview.evaluate(async () => {
      const photo = new Image(); photo.src = 'assets/preview-photo.webp';
      await photo.decode(); return photo.naturalWidth;
    });
    assert(photoWidth >= 1000, 'Preview photo did not load');
    const footerAlignment = await preview.evaluate(() => {
      const a = document.querySelector('#footer').getBoundingClientRect();
      const b = document.querySelector('#easterEgg').getBoundingClientRect();
      return { delta: Math.abs((a.top + a.bottom) / 2 - (b.top + b.bottom) / 2), gap: b.left - a.right };
    });
    assert(footerAlignment.delta < 1, 'Footer text blocks are not aligned');
    assert(footerAlignment.gap >= 16, 'Footer text blocks overlap');
    await preview.screenshot({ path: 'review/outro-photo-preview.png' });
    await preview.close();
    console.log(JSON.stringify(layout, null, 2));
  } finally {
    await browser.close();
    server.kill();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
