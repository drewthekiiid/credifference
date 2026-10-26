const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'dash-screenshot-top.png' });
  await page.evaluate(() => window.scrollBy(0, window.innerHeight));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'dash-screenshot-mid.png' });
  await page.evaluate(() => window.scrollBy(0, window.innerHeight));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'dash-screenshot-bot.png' });
  await browser.close();
})();
