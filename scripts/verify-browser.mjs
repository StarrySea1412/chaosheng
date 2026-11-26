import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const urlIndex = process.argv.indexOf('--url');
const remoteUrl = urlIndex >= 0 ? process.argv[urlIndex + 1] : process.env.DUSK_TEST_URL;
const baseUrl = remoteUrl || 'http://127.0.0.1:4328';
const channel = process.env.DUSK_BROWSER_CHANNEL;
let server;
let browser;
let page;
let passed = 0;
const errors = [];
const out = path.join(root, 'artifacts');

async function check(name, callback) {
  await callback();
  passed += 1;
  console.log(`PASS ${name}`);
}

const actions = () => page.locator('.scene-actions');
const state = () => page.evaluate(() => window.duskTown.getState());
const visit = async (id) => {
  await page.locator(`#town-nav [data-visit="${id}"]`).click();
  await page.waitForFunction((scene) => window.duskTown.getState().location === scene && document.getElementById('scene-image').complete && document.getElementById('scene-image').naturalWidth > 0, id);
};
const act = (id) => actions().locator(`[data-action="${id}"]`).click();
const screenshot = (name) => page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
const freshPage = async (options = {}) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, timezoneId: 'Asia/Shanghai', locale: 'zh-CN', reducedMotion: 'reduce', acceptDownloads: true, ...options });
  const next = await context.newPage();
  next.on('pageerror', (error) => errors.push(error.message));
  next.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  return next;
};

try {
  await mkdir(out, { recursive: true });
  if (!remoteUrl) {
    server = spawn(process.execPath, ['scripts/serve.mjs', '--port', '4328'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Test server did not start.')), 8000);
      server.stdout.once('data', () => { clearTimeout(timeout); resolve(); });
      server.once('error', (error) => { clearTimeout(timeout); reject(error); });
      server.once('exit', (code) => { if (code) reject(new Error(`Test server exited with ${code}.`)); });
    });
  }
  browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
  page = await freshPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  await check('all six locations load actual scene images', async () => {
    assert.equal(await page.locator('#town-nav button').count(), 6);
    for (const id of ['street', 'bookshop', 'workshop', 'home', 'ferry', 'grocery']) {
      await visit(id);
      assert.equal(await page.locator('#scene-image').evaluate((image) => image.naturalWidth), 1536);
      assert.equal(await page.locator('#scene-image').evaluate((image) => image.naturalHeight), 1024);
    }
    await visit('street');
    await screenshot('desktop');
  });

  await check('keyboard keeps focus while moving and taking the diary', async () => {
    await page.locator('#town-nav [data-visit="bookshop"]').focus();
    await page.keyboard.press('Enter');
    assert.equal((await state()).location, 'bookshop');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.visit), 'bookshop');
    await actions().locator('[data-action="take-diary"]').focus();
    await page.keyboard.press('Enter');
    assert.equal((await state()).flags.holdingDiary, true);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'read-diary');
    await act('read-diary');
    await screenshot('bookshop');
  });

  await check('the diary return closes the first chapter', async () => {
    await visit('ferry');
    assert.equal(await actions().locator('[data-action="return-diary"]').count(), 1);
    assert.equal(await actions().locator('[data-action="keep-diary"]').count(), 1);
    await act('return-diary');
    assert.equal((await state()).flags.chapterComplete, true);
    assert.equal((await state()).flags.holdingDiary, false);
    assert.equal(await actions().locator('[data-action="return-diary"]').count(), 0);
    assert.equal(await page.locator('.chapter-complete').isVisible(), true);
    await screenshot('ferry');
  });

  await check('every place adds one discovery and saves survive reload', async () => {
    for (const [scene, action] of [['street', 'look-timetable'], ['workshop', 'ring-bell'], ['home', 'listen-piano'], ['ferry', 'read-tides'], ['grocery', 'fold-star']]) {
      await visit(scene);
      await act(action);
    }
    assert.equal((await state()).discoveries.length, 6);
    assert.equal((await state()).journal.length, 8);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal((await state()).discoveries.length, 6);
    assert.equal((await state()).flags.diaryReturned, true);
    assert.equal((await state()).location, 'grocery');
  });

  await check('journal export contains the story, and tabs work by keyboard', async () => {
    await page.locator('#tab-now').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#tab-journal').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('.journal-list li').count(), 8);
    const downloaded = page.waitForEvent('download');
    await page.locator('.journal-export').click();
    const file = await downloaded;
    const text = await readFile(await file.path(), 'utf8');
    assert.ok(text.includes('许舟') && text.includes('潮生') && text.includes('小满') && text.includes('星星'));
    await screenshot('journal');
    await page.keyboard.press('j');
    assert.equal(await page.locator('#tab-now').getAttribute('aria-selected'), 'true');
  });

  await check('weather, light and opt-in sound controls work', async () => {
    await page.locator('button[data-weather]').click();
    await page.locator('button[data-time]').click();
    assert.equal((await state()).weather, 'rain');
    assert.equal((await state()).time, 1);
    assert.equal((await state()).discoveries.length, 6);
    await page.waitForFunction(()=>document.querySelector('#scene-image').complete&&document.querySelector('#scene-image').getAttribute('src').endsWith('grocery-t1-rain.webp'));
    assert.equal(await page.locator('#scene-image').evaluate(image=>getComputedStyle(image).filter),'none');
    await page.locator('[data-sound]').click();
    assert.equal(await page.locator('[data-sound]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-sound]').click();
    assert.equal(await page.locator('[data-sound]').getAttribute('aria-pressed'), 'false');
  });

  await check('reset asks once, cancel preserves progress, confirmation restarts', async () => {
    await page.locator('[data-about]').click();
    await page.locator('[data-reset]').click();
    assert.equal((await state()).discoveries.length, 6);
    await page.locator('[data-cancel-reset]').click();
    assert.equal((await state()).discoveries.length, 6);
    await page.locator('[data-reset]').click();
    await page.locator('[data-confirm-reset]').click();
    assert.equal((await state()).discoveries.length, 0);
    assert.equal((await state()).day, 1);
    assert.equal((await state()).location, 'street');
  });

  await check('keeping the diary waits until tomorrow, including after reload', async () => {
    await visit('bookshop');
    await act('take-diary');
    await act('read-diary');
    await visit('ferry');
    await act('keep-diary');
    assert.equal(await actions().locator('[data-action="return-diary"]').count(), 0);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await actions().locator('[data-action="return-diary"]').count(), 0);
    await page.locator('[data-nextday]').click();
    assert.equal((await state()).day, 2);
    assert.equal(await actions().locator('[data-action="return-diary"]').count(), 1);
    await act('return-diary');
    assert.equal((await state()).flags.diaryReturned, true);
  });

  page = await freshPage();
  await page.addInitScript(() => {
    window.__timeShift = 0;
    const OriginalDate = window.Date;
    window.Date = class extends OriginalDate {
      constructor(...args) { super(...(args.length ? args : [OriginalDate.now() + window.__timeShift])); }
      static now() { return OriginalDate.now() + window.__timeShift; }
    };
  });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await check('a still-open tab remembers a later calendar-day return', async () => {
    await act('look-timetable');
    await page.evaluate(() => { window.__timeShift += 86400000; window.dispatchEvent(new Event('pageshow')); });
    assert.equal((await state()).day, 2);
    assert.equal((await state()).discoveries.length, 1);
    await page.evaluate(() => { window.__timeShift += 86400000; });
    await page.locator('button[data-weather]').click();
    assert.equal((await state()).day, 3);
    assert.equal((await state()).discoveries.length, 1);
  });

  page = await freshPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await check('mobile help and reset are reachable, hotspots lead to readable story', async () => {
    assert.equal(await page.locator('[data-about]').isVisible(), true);
    await page.locator('[data-about]').click();
    assert.equal(await page.locator('#about-dialog').isVisible(), true);
    await page.locator('[data-close]').click();
    await page.locator('#hotspots [data-visit="bookshop"]').click();
    await page.locator('#hotspots [data-action="take-diary"]').click();
    assert.equal((await state()).flags.holdingDiary, true);
    assert.ok(await page.locator('.story-sheet').evaluate((sheet) => sheet.getBoundingClientRect().top < innerHeight / 2));
    await screenshot('mobile');
    await visit('ferry');
    await page.locator('#hotspots [data-action="read-tides"]').focus();
    const label = await page.locator('#hotspots [data-action="read-tides"] .hotspot-label').boundingBox();
    assert.ok(label.x >= 0 && label.x + label.width <= 390);
  });

  await check('320px, 390px, 768px and desktop layouts have no horizontal overflow', async () => {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}px`);
    }
  });

  page = await freshPage();
  const albumUrl=new URL('gallery.html',baseUrl.endsWith('/')?baseUrl:baseUrl+'/').href;
  await page.goto(albumUrl,{waitUntil:'networkidle'});
  await check('the album contains all120 actual paintings and the category counts match',async()=>{
    assert.equal(await page.locator('#album-total').textContent(),'120');
    assert.equal(await page.locator('.album-card').count(),24);
    for(const [category,count]of[['places',24],['story',24],['details',24],['portraits',12],['weather',36]]){
      await page.locator(`[data-category="${category}"]`).click();
      assert.equal(await page.locator(`[data-category="${category}"]`).getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('.album-card').count(),Math.min(count,24));
    }
    await page.locator('#album-more').click();
    assert.equal(await page.locator('.album-card').count(),36);
    await page.locator('.album-card').last().scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{const images=[...document.querySelectorAll('.album-card img')];const last=images.at(-1);return last.complete&&last.naturalWidth===480;});
  });
  await check('album lightbox turns real images by keyboard and downloads full artwork',async()=>{
    await page.locator('.album-card').first().click();
    await page.waitForFunction(()=>document.querySelector('#lightbox-image').complete&&document.querySelector('#lightbox-image').naturalWidth===1536);
    const first=await page.locator('#lightbox-image').getAttribute('src');
    await page.keyboard.press('ArrowRight');
    assert.notEqual(await page.locator('#lightbox-image').getAttribute('src'),first);
    await page.waitForFunction(()=>document.querySelector('#lightbox-image').complete&&document.querySelector('#lightbox-image').naturalWidth===1536);
    const downloading=page.waitForEvent('download');await page.locator('#lightbox-download').click();
    const downloaded=await downloading;const bytes=await readFile(await downloaded.path());
    assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
    await page.keyboard.press('Escape');assert.equal(await page.locator('#album-lightbox').isVisible(),false);
  });
  await page.locator('[data-category="all"]').click();
  await page.evaluate(async()=>{const images=[...document.querySelectorAll('.album-card img')];for(const image of images)image.loading='eager';await Promise.all(images.map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.onload=resolve;image.onerror=resolve;})));});
  await screenshot('album-desktop');
  await check('the album is readable at320px and390px without horizontal overflow',async()=>{
    for(const width of[320,390]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
    await screenshot('album-mobile');
    await page.locator('.album-card').first().click();assert.equal(await page.locator('#album-lightbox').isVisible(),true);
    await page.locator('#album-close').click();
  });

  await check('all browser paths finish without console or script errors', async () => assert.deepEqual(errors, []));
  console.log(`Passed ${passed} browser checks. Screenshots saved to artifacts/.`);
} catch (error) {
  if (page) await screenshot('failure').catch(() => {});
  console.error(error.stack || error.message);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
}
