#!/usr/bin/env node

/**
 * 进行计算和截图
 * @param {*} page 
 * @param {*} selector 
 * @param {*} path 
 * @param {*} padding 
 */
async function screenshotDOMElement(page, selector, path, padding = 0) {
    const rect = await page.evaluate(selector => {
        try{
            const element = document.querySelector(selector);
            const {x, y, width, height} = element.getBoundingClientRect();
            if(width * height != 0){
                return {left: x, top: y, width, height, id: element.id};
            }else{
                return null;
            }
        }catch(e){
            return null;
        }
    }, selector);
    
    return await page.screenshot({
        path: path,
        clip: rect ? {
            x: rect.left - padding,
            y: rect.top - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2
            } : null
    });
}


async function getUA(UAtype){
    if(UAtype === 'ios'){
        return browserUI.ios;
    }else if(UAtype === 'android'){
        return browserUI.android;
    }else if(UAtype === 'pc'){
        return browserUI.pc;
    }else{
        return browserUI.pc;
    }
}


const puppeteer = require('puppeteer');


const browserUI = {
    ios: {
            viewport: {
                width: 375,
                height: 667,
                isMobile: true
            },
            userAgent: '"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1"'
        },
    android: {
            viewport: {
                width: 375,
                height: 667,
                isMobile: true
            },
            userAgent: '"Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Mobile Safari/537.36"'
        },
    pc: {
            viewport: {
                width: 1920,
                height: 937,
                isMobile: false
            },
            userAgent: '"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36"' 
        }
};



(async () => {
    /** 需要通过命令行拿到：UA、selector、url 
     * 
     *  // const program = require('commander');
     * 	// var args = process.argv.splice(2);
     *  // console.log(args);
     *  // console.log(args[1])
     * 
     *  node spec-selector.js --ua ios --selector 'div[id*="sogou_vr_70019705"]' --url 'http://10.144.13.224/web/searchList.jsp?keyword=%E6%B8%B8%E8%AE%B0&pid='
    */

    var argv = require('optimist')
                .usage('Usage: $0 --ua [str] --selector [str] --url [str]')
                .demand(['ua', 'selector', 'url'])
                .argv;
    var parseArgs = require('minimist')
    
    console.log(argv.ua)
    console.log(argv.selector)
    console.log(argv.url)
    
	const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
	const page    = await browser.newPage();
	await page.emulate(getUA(argv.ua));

    await page.goto(argv.url, {
              waitUntil: 'networkidle2'
        });

    await screenshotDOMElement(page, argv.selector, 'ss.png');
    await browser.close();

})();
