const puppeteer = require('puppeteer');

const puppeteerComp = { // some values for puppeteer
  browser: null, // a puppetter chromium instance
};

/**
 * get website
 * @param {string} url 网址
 * @returns {string} 网页内容
 */
exports.getWebsite = async (url) => {
  if (!puppeteer) {
    console.warn('the function searchOnline() needs puppeteer');
    return [];
  }

  let res;
  let page;
  try {
    // create/get the browser
    if (!puppeteerComp.browser) {
      puppeteerComp.browser = await (puppeteer.launch({
        // headless: false,
      }));
    }

    // create a new webpage
    page = await puppeteerComp.browser.newPage();
    await page.goto(url);
    res = await page.evaluate(() => document.body.innerHTML);
  } catch (error) {
    console.error('[error] 获取网页失败: ', url);
  } finally {
    // close webpage, and return the results
    await page.close();
  }

  return res;
};
