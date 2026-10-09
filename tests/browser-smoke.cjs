const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'build/browser-tests');
const mime = {'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.md':'text/plain'};

(async () => {
  const server = http.createServer(async (request, response) => {
    try {
      let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const filename = path.resolve(root, '.' + pathname);
      if (!filename.startsWith(root + path.sep)) throw new Error('outside repository');
      response.setHeader('Content-Type', mime[path.extname(filename)] || 'application/octet-stream');
      response.end(await fs.readFile(filename));
    } catch { response.statusCode = 404; response.end('not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/web/`;
  let browser;
  try {
    await fs.mkdir(output, {recursive:true});
    browser = await chromium.launch({headless:true,
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE} : {}),
      args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
    const page = await browser.newPage({viewport:{width:1440,height:1100}});
    const errors = []; page.on('pageerror', error => errors.push(String(error)));
    await page.goto(url); await page.waitForFunction(() => document.getElementById('count').textContent === '20 of 20');
    assert.equal(await page.locator('#rows button').count(), 20);
    await page.locator('#conflicts').check();
    assert.equal(await page.locator('#count').textContent(), '3 of 20');
    assert.match(await page.locator('#detail .difference').textContent(), /Summary table:.*partly, or in progress/);
    await page.locator('[data-row="control-13"]').click();
    assert.match(await page.locator('#detail h2').textContent(), /Per-cluster/);
    assert.equal(await page.locator('#detail').evaluate(node => node === document.activeElement), true);
    const bookmarked = page.url();
    await page.reload(); await page.waitForSelector('#detail .difference');
    assert.equal(page.url(), bookmarked);
    assert.match(await page.locator('#detail h2').textContent(), /Per-cluster/);
    await page.locator('#role').selectOption('EO');
    assert.equal(await page.locator('#count').textContent(), '1 of 20');
    await page.locator('#clear').click();
    await page.locator('#phase').selectOption('C/F');
    assert.equal(await page.locator('#count').textContent(), '1 of 20');
    await page.getByText('Phase context & source status', {exact:true}).click();
    assert.match(await page.locator('#detail').textContent(), /C · Initial access to HF/);
    assert.match(await page.locator('#detail').textContent(), /F ·/);
    const source = await page.locator('#detail .detail-actions a').getAttribute('href');
    assert.ok(source.includes('/blob/450ddf5a34a8f69cbab16db7618b4714200b771b/'));
    await page.locator('#clear').click();
    await page.locator('#search').fill('retention transcripts');
    assert.equal(await page.locator('#count').textContent(), '1 of 20');
    const downloaded = page.waitForEvent('download');
    await page.locator('#export-json').click();
    const download = await downloaded;
    const stream = await download.createReadStream(); let json = '';
    for await (const chunk of stream) json += chunk;
    const exported = JSON.parse(json);
    assert.equal(exported.controls.length, 1); assert.equal(exported.controls[0].row, '7');
    assert.equal(exported.source.sha256.length, 64);
    const csvDownload = page.waitForEvent('download'); await page.locator('#export-csv').click();
    assert.equal((await csvDownload).suggestedFilename(), 'control-matrix-selection.csv');
    const closed = await page.locator('#detail details:not([open])').count();
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    assert.equal(await page.locator('#detail details:not([open])').count(), 0);
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    assert.equal(await page.locator('#detail details:not([open])').count(), closed);
    await page.locator('#search').fill('no such matching control');
    assert.equal(await page.locator('#count').textContent(), '0 of 20');
    assert.equal(await page.locator('#export-json').isDisabled(), true);
    await page.locator('#empty-clear').click();
    await page.locator('#conflicts').check();
    await page.locator('#audit summary').click();
    assert.match(await page.locator('#audit-content').textContent(), /0 CSV cell differences/);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({path:path.join(output,'desktop.png'),fullPage:true});
    const mobile = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    mobile.on('pageerror', error => errors.push(String(error)));
    await mobile.goto(url + '?phase=G');
    await mobile.waitForFunction(() => document.getElementById('count').textContent === '2 of 20');
    await mobile.locator('[data-row="control-15"]').click();
    assert.match(await mobile.locator('#detail h2').textContent(), /Narrower GitHub/);
    await mobile.getByText('Numbered references used in this row', {exact:true}).click();
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await mobile.getByText('Numbered references used in this row', {exact:true}).click();
    await mobile.screenshot({path:path.join(output,'mobile.png'),fullPage:true});
    const failed = await browser.newPage();
    await failed.route('**/data.json', route => route.fulfill({status:503,body:'offline'}));
    await failed.goto(url); await failed.waitForSelector('#error:not([hidden])');
    assert.match(await failed.locator('#error').textContent(), /could not load/);
    assert.equal(await failed.locator('#export-json').isDisabled(), true);
    assert.deepEqual(errors, []);
    console.log('Browser checks passed: filtering, source conflicts, row focus, bookmark reload, composite phases, JSON/CSV export, print restoration, empty/error states, mobile layout.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {console.error(error);process.exitCode=1;});
