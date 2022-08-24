const fs = require('fs');
const puppeteer = require('puppeteer');

const puppeteerComp = { // some values for puppeteer
  browser: null, // a puppetter chromium instance
};

/**
 * create file
 * @param {String} path, image path
 * @param {FormData} file, image data
 */
exports.create = async (path, file) => new Promise((resolve, reject) => {
  fs.writeFile(path, file.buffer, 'binary', (err) => {
    if (err) {
      reject(err);
    } else {
      console.log(`${new Date().toLocaleString()}: [image uploaded]`, path);
      resolve();
    }
  });
});

/**
 * search images from websites
 * @param {string} keyword, search keyword
 * @returns {string[]} found images array
 */
exports.searchOnline = async (keyword) => {
  if (!puppeteer) {
    console.warn('the function searchOnline() needs puppeteer');
    return [];
  }

  // create/get the browser
  if (!puppeteerComp.browser) {
    puppeteerComp.browser = await (puppeteer.launch({
      // headless: true,
    }));
  }

  // create a new webpage
  const page = await puppeteerComp.browser.newPage();
  let imgs1 = [];
  let imgs2 = [];
  // search bing image
  try {
    await page.goto(`https://cn.bing.com/images/search?q=${keyword}&form=HDRSC2&first=1&tsc=ImageBasicHover`);
    imgs1 = await page.$$eval('.img_cont > .mimg', (searchedImgs) => {
      searchedImgs = searchedImgs.slice(0, 6);
      return searchedImgs.map(img => img.src).filter(img => img);
    });

    // search bing for cartoon images
    await page.goto(`https://cn.bing.com/images/search?q=${keyword} 卡通&form=HDRSC2&first=1&tsc=ImageBasicHover`);
    imgs2 = await page.$$eval('.img_cont > .mimg', (searchedImgs) => {
      searchedImgs = searchedImgs.slice(0, 6);
      return searchedImgs.map(img => img.src).filter(img => img);
    });
  } catch (error) {
    console.warn('images: 爬取图片失败 ', error);
  }

  // close webpage, and return the results
  await page.close();
  return imgs1.concat(imgs2);
};

// exports.delete = async path => new Promise((resolve, reject) => {
//   fs.unlink(path, (err) => {
//     if (err) {
//       console.error(err);
//       reject(err);
//     } else {
//       resolve();
//     }
//   });
// });
