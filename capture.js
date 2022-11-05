const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: true,args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.goto('https://baike.sogou.com');
  await page.screenshot({path: 'example-1.png'});
  
  await browser.close();
})();
