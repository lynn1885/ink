const _ = require('lodash');
const fs = require('fs');
const path = require('path');

/**
 * isFileNameValid: 检测文件名是否合法
 * @param {string} fileName 文件名
 * @return {boolean} 合法返回true, 否则返回false
 */
exports.isFileNameValid = function isFileNameValid(fileName) {
  // 校验
  if (typeof fileName !== 'string') {
    console.error(`目录名不是string: ${fileName}`);
    return false;
  }
  // 目录名不能为空
  if (fileName.length < 1) {
    return false;
  }
  // 目录名不能超过200个字符
  if (fileName.length > 200) {
    return false;
  }
  // 目录名不能为纯数字
  if (fileName.match(/^\d+$/)) {
    return false;
  }
  // 目录名不能包含四字节字符
  // eslint-disable-next-line no-restricted-syntax
  for (const char of fileName) {
    if (char.codePointAt(0) > 0xFFFF) return false;
  }

  // 目录名不能以 . 空格, tab, 换行 开头或结尾
  if (fileName[0] === '.'
    || fileName[fileName.length - 1] === '.'
    || fileName[0] === ' '
    || fileName[fileName.length - 1] === ' '
    || fileName[0] === '\t'
    || fileName[fileName.length - 1] === '\t'
    || fileName[0] === '\n'
    || fileName[fileName.length - 1] === '\n'
  ) {
    return false;
  }

  // 目录名不能包含 < > : " / \ | ? *
  const r = /[<>:"/\\|?*]/;
  if (fileName.match(r)) {
    return false;
  }
  const trimedFileName = fileName.trim();
  // 目录名不能以__开头的同时以__结尾
  if (trimedFileName[0] === '_'
    && trimedFileName[1] === '_'
    && trimedFileName[trimedFileName.length - 1] === '_'
    && trimedFileName[trimedFileName.length - 2] === '_') {
    return '笔记名不能以__开头的同时以__结尾';
  }
  return true;
};

/**
 * uniformizeCatalogObj: 一致化catalog对象
 * 会根据传入的realDir, 对userCatalog对象进行补全和移除, 返回生成的新catalog记录
 * @param {Object} userCatalog 用户配置中的目录, 和user-config.json中的catalog.order对象的格式强耦合
 * @param {Object} realDir 真实目录, 需要和userCatalog的格式保持一致
 */
exports.uniformizeCatalogObj = function uniformizeCatalogObj(userCatalog, realDir) {
  const allDir = _.merge(userCatalog, realDir); // 会改变recordDir
  r(allDir, realDir); // 会直接改变allDir
  return allDir;

  function r(all, real) {
    for (const k in all) {
      if (typeof real[k] !== 'object') {
        // eslint-disable-next-line no-param-reassign
        delete all[k];
      } else {
        r(all[k], real[k]);
      }
    }
  }
};

/**
 * calWordCount
 * ⚠️ This algorithm is coupled with the front-end word count algorithm.
 * @param {String} text
 */
exports.calWordCount = function calWordCount(text) {
  let englishWordCount = 0;
  text = text.replace(/\b[a-zA-Z-]+\b/g, () => {
    englishWordCount += 1;
    return '';
  });
  text = text.replace(/\s+/g, '');
  return text.length + englishWordCount;
};

/**
 * 获取文件列表
 * @param {string} p 要获取文件的路径
 * @param {string[]} extNames 设置文件名必须包含的字段，如['.txt', '.md']，不设置则包含所有文件
 * @returns {string[]} 数组中是所有符合的文件路径
 */
exports.getFileList = function getFileList(p, extNames) {
  // 路径必须存在
  if (!fs.existsSync(p)) return;
  const maxFileNum = 5000;

  const fileList = [];
  try {
    // 递归获取所有文件
    _getCurPathFiles(p, extNames, fileList, maxFileNum);
  } catch (error) {
    console.error('[getFileList] 递归获取文件失败：', error);
    return;
  }

  return fileList;
};


// 获取文件列表的递归函数
function _getCurPathFiles(p, extNames, fileList, maxFileNum) {
  const items = fs.readdirSync(p);
  // console.log(p, fileList);
  // 当前目录中的内容
  for (const item of items) {
    if (fileList.length >= maxFileNum) return;
    const newP = path.join(p, item);
    const itemStat = fs.statSync(newP);
    if (itemStat.isDirectory()) { // 是目录
      _getCurPathFiles(newP, extNames, fileList, maxFileNum);
    } else if (itemStat.isFile) { // 是文件
      const fileExtName = path.extname(newP);
      if (extNames && extNames.length && extNames.includes(fileExtName)) {
        fileList.push(newP);
      } else if (!extNames || extNames.length === 0) {
        fileList.push(newP);
      }
    }
  }
}
