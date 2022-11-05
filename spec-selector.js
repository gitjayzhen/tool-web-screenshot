#!/usr/bin/env node

/**
 * 直接使用指定的css selector进行计算和截图
 * @param {*} page  浏览器对象
 * @param {*} sKey  完整的定位key
 * @param {*} path  图像命名
 * @param {*} padding   截图的内边距
 */
async function screenshotDOMElement(page, selector, path, padding = 0) {
    const rect = await page.evaluate(seltor => {
        try{
            const element = document.querySelector(seltor);
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

    if(!rect){
        return null;
    }
    
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

/**
 * 通过定位元素然后找到爷爷层级的元素，进行定位
 * @param {*} page  浏览器对象
 * @param {*} sKey  完整的定位key
 * @param {*} path  图像命名
 * @param {*} padding   截图的内边距
 */
async function srceenshotFromChild(page, sKey, path, padding = 0){
    const rect = await page.evaluate(seltor => {
        try{
            const element = document.querySelector(seltor);
            const elem = element.parentElement.parentElement;
            const {x, y, width, height} = elem.getBoundingClientRect();
            if(width * height != 0){
                return {left: x, top: y, width, height, id: elem.id};
            }else{
                return null;
            }
        }catch(e){
            return null
        }
    }, sKey);

    if(!rect){
        return null;
    }
    
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

function getUA(UAtype=''){
    UAtype = UAtype.toLowerCase();
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

function url_encode(url){
    url = encodeURIComponent(url);
    url = url.replace(/\%3A/g, ":");
    url = url.replace(/\%2F/g, "/");
    url = url.replace(/\%3F/g, "?");
    url = url.replace(/\%3D/g, "=");
    url = url.replace(/\%26/g, "&");
    return url;
}

function url_decode(url){
    url = decodeURIComponent(url);
    return url;
}

const puppeteer = require('puppeteer');
const program   = require('commander');


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
     * selector、url ： 构建名两行的时候需要urlencode下
     * 
     *  await page.screenshot({path: 'full-page.png', fullPage: true});
     * 
     *   0 正常
     *   1 页面打不开
     *   2 我的python部分执行异常 比如puppeteer崩了
     *   3 js执行整体出错
     *   4 页面无法正常解析（以前做的容错 位置可以保留）
     *   
     *  node spec-selector.js -t pc -m uncss -k sogou_vr_30010097  -u https%3a%2f%2fwww.sogou.com%2fweb%3fquery%3diccup -n jwensh
     *  node spec-selector.js -t pc -m css -k a%5bid*%3d%22sogou_vr_30010097%22%5d  -u https%3a%2f%2fwww.sogou.com%2fweb%3fquery%3diccup -n jwensh
     *  node spec-selector.js -t android -m css -k div%5bid*%3d%22sogou_vr_30010097%22%5d  -u https%3a%2f%2fwap.sogou.com%2fweb%2fsearchList.jsp%3fs_from%3dpcsearch%26keyword%3diccup -n jwensh
    */
    
    try {
        //实现命令行调用方式
        program.version('1.0.0')
            .description('Designed for Search Web@testing . You can use this script in the node environment. ^_^')
            .usage(' [options]')
            .option('-t, --ua-type <value>', 'Specifies the style of the browser, choose in: [ios、android、pc ]')
            .option('-m, --selector-mode <value>', 'The mode determines the positioning scheme, choose in:[css、uncss]')
            .option('-k, --selector-key <value>', 'Keywords for location, must to urlencode')
            .option('-u, --url <value>', 'URL for visit site and do snapshot,URL must to urlencode')
            .option('-n, --name <value>', 'File naming for screenshots.')

        program.parse(process.argv);

        if(program.uaType === undefined || program.selectorKey === undefined || program.url === undefined || program.name === undefined || program.selectorMode === undefined){
            //参数有误
            console.log(3);
            process.exit(0);
        }

        //初始化浏览器
        const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page    = await browser.newPage();

        //设置浏览器的样式
        await page.emulate(getUA(`${program.uaType}`));

        try {
            //访问指定的url地址
            await page.goto(url_decode(`${program.url}`), {
                    waitUntil: 'networkidle2'
            });
        } catch (error) {
            //浏览器访问报错
            console.log(1);
            process.exit(0);
        }

        //根据定位mode来决定流程逻辑
        let sMode = `${program.selectorMode}`.toLowerCase();
        let captureStatus = null;
        if(sMode === 'css'){
            captureStatus = await screenshotDOMElement(page, url_decode(`${program.selectorKey}`), `${program.name}` + '.png');
        }else if(sMode === 'uncss'){
            let sKey = url_decode(`${program.selectorKey}`);
            // 可以在这里改动uncss的定位模板
            sKey = 'a[id*="' + sKey + '"]';
            captureStatus = await srceenshotFromChild(page, sKey, `${program.name}` + '.png');
        }

        if(captureStatus === null){
            //解析和截图过程发生错误
            console.log(4)
            await browser.close();
            process.exit(0);
        }

        console.log(0);
        await browser.close();
    } catch (error) {
        console.log(3);
        process.exit(0);
    }
})();
