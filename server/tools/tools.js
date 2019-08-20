const _ = require('lodash');

/**
 * isFileNameValid: 检测文件名是否合法
 * @param {string} fileName 文件名
 * @return {boolean} 合法返回true, 否则返回false
 */
exports.isFileNameValid = function isFileNameValid(fileName) {
  // 校验
  if (typeof fileName !== 'string') {
    console.error(`文件名不是string: ${fileName}`);
    return false;
  }
  // 文件名不能为空
  if (fileName.length < 1) {
    return false;
  }
  // 文件名不能以 . 开头或结尾
  if (fileName[0] === '.' || fileName[fileName.length - 1] === '.') {
    return false;
  }
  // 文件名不能包含 < > : " / \ | ? *
  const r = /[<>:"/\\|?*]/;
  if (fileName.match(r)) {
    return false;
  }
  return true;
};

/**
 * uniformizeCatalogObj: 一致化catalog对象
 * 会根据传入的realDir, 对userCatalog对象进行补全和移除, 返回生成的新catalog记录
 * @param {object} userCatalog 用户配置中的目录, 和user-config.json中的catalog.order对象的格式强耦合
 * @param {object} realDir 真实目录, 需要和userCatalog的格式保持一致
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
