/** Browser checks for the non-secret installation flow; no external form is submitted. */
const { createServer } = require('node:http');
const { readFileSync, mkdirSync } = require('node:fs');
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const routes = new Map(
    ['/', '/index.html', '/ui.mjs', '/setup.mjs', '/i18n.mjs', '/styles.css'].map((path) => [
      path,
      readFileSync('site/' + (path === '/' ? 'index.html' : path.slice(1))),
    ]),
  );
  const server = createServer((request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (!routes.has(path)) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.setHeader(
      'Content-Type',
      path.endsWith('.mjs') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html',
    );
    response.end(routes.get(path));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    const errors = [],
      requests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) =>
      requests.push({ url: request.url(), method: request.method() }),
    );
    await page.route('https://raw.githubusercontent.com/**', (route) => route.abort());
    const base = 'http://127.0.0.1:' + server.address().port;
    await page.goto(base + '/?lang=en');
    await page.getByLabel('GitHub username', { exact: true }).fill('test-user');
    await page.getByRole('button', { name: 'Prepare my installation', exact: true }).click();
    assert.ok(await page.locator('#results').isVisible());
    assert.ok(
      (await page.locator('#workflow').inputValue()).includes(
        'generate.yml@v' + JSON.parse(readFileSync('package.json', 'utf8')).version,
      ),
    );
    assert.equal(
      await page.locator('#markdown').inputValue(),
      '![Commando Activity](https://raw.githubusercontent.com/test-user/test-user/output/commando-activity.svg)',
    );
    await page.getByRole('button', { name: 'Русский', exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'ru');
    assert.equal(await page.locator('#ru').getAttribute('aria-pressed'), 'true');
    assert.ok(
      await page.locator('#results').isVisible(),
      'Switching language must not discard the prepared installation',
    );
    assert.match(await page.locator('#guide').getAttribute('href'), /docs\/ru\/INSTALL.md$/);
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'), 'ru');
    await page.goto(base + '/?lang=en');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await page.getByLabel('GitHub username', { exact: true }).fill('bad--login');
    await page.getByRole('button', { name: 'Prepare my installation', exact: true }).click();
    assert.ok(!(await page.locator('#results').isVisible()));
    assert.ok(await page.locator('#error').innerText());
    assert.deepEqual(errors, []);
    assert.ok(requests.every((request) => request.method === 'GET'));
    assert.ok(
      requests.every(
        (request) =>
          request.url.startsWith(base) ||
          request.url.startsWith('https://raw.githubusercontent.com/'),
      ),
    );
    console.log(
      'PASS: English/Russian setup, language URL priority and persistence, valid/invalid output, no form transmission or browser errors',
    );
  } catch (error) {
    if (browser) {
      const pages = browser.contexts().flatMap((context) => context.pages());
      if (pages[0]) {
        mkdirSync('generated', { recursive: true });
        await pages[0].screenshot({ path: 'generated/setup-failure.png', fullPage: true });
      }
    }
    throw error;
  } finally {
    if (browser) await browser.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
