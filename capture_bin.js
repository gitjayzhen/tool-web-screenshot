const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: true,args: ['--no-sandbox'],executablePath: '/data/puppeteer-dev/chrome/chrome-linux/chrome'});
  const page = await browser.newPage();
  await page.goto('https://www.sogou.com');
  await page.screenshot({path: 'example.png'});
  
  await browser.close();
})();
