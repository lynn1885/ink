const fs = require('fs');
const path = require('path');

/**
 * get 获取当前层目录, 不进行递归获取
 * @param {string} filePath 要获取目录的路径
 */
exports.get = async filePath => new Promise((resolve, reject) => {
  fs.readdir(filePath, { encoding: 'utf8' }, (err, files) => {
    if (err) {
      console.error('get(): ', err);
      reject(err);
    } else {
      resolve(files);
    }
  });
});

/**
 * getRecursively: 递归的获取目录
 * @param {string} filePath 要获取目录的路径
 * @param {array} ignorePath 忽略的路径
 * @param {boolean} isIncludeFile 是否获取目录是也文件, 默认为false
 * @return {object} 操作成功时: `获取到的目录结构`, 操作失败时: `Throw new Error(错误对象)`, 需要在外界进行捕获
 */
exports.getRecursively = async (filePath, ignorePath, isIncludeFile = false) => {
  const result = await r(filePath);
  return result;

  async function r(fp) {
    const catalog = {};
    return new Promise((resolve, reject) => {
      fs.readdir(fp, { encoding: 'utf8' }, async (err, files) => {
        if (err) {
          console.error('getRecursively(): ', err);
          reject(err);
        } else {
          // eslint-disable-next-line no-restricted-syntax
          for (const f of files) {
            let newFp;
            if (fp.slice(-1) === '/') {
              newFp = `${fp}${f}`;
            } else {
              newFp = `${fp}/${f}`;
            }

            if (ignorePath.includes(`${newFp}/`)) { // 忽略某些文件夹
              break;
            }
            // eslint-disable-next-line no-await-in-loop
            await new Promise((res, rej) => {
              fs.stat(newFp, async (e, stats) => {
                if (e) {
                  console.error('getRecursively(): ', e);
                  rej(e);
                } else if (stats.isDirectory()) {
                  catalog[f] = await r(newFp);
                } else if (newFp.includes('.md')) {
                  if (isIncludeFile) {
                    catalog[f] = true;
                  }
                }
                res();
              });
            });
          }
          resolve(catalog);
        }
      });
    });
  }
};

/**
 * create: 创建目录, 不支持递归创建
 * @param {string} filePath 要创建的目录
 */
exports.create = async filePath => new Promise((resolve, reject) => {
  fs.mkdir(filePath, (err) => {
    if (err) {
      console.error('create(): ', err);
      reject(err);
    } else {
      resolve();
    }
  });
});

/**
 * @todo 修改为异步算法, 当前文同步
 * deleteRecursively: 递归的删除文件
 * @param {string} filePath 要删除的目录
 * @return 操作成功时无返回值, 操作失败`Throw new Error()`说明失败原因, 需要在外界进行捕获
 */
exports.deleteRecursively = async (filePath) => {
  d(filePath);

  function d(fp) {
    let files = [];
    if (fs.existsSync(fp)) {
      files = fs.readdirSync(fp);
      files.forEach((file) => {
        const curDir = path.join(fp, file);
        if (fs.statSync(curDir).isDirectory()) {
          d(curDir); // 递归删除文件夹
        } else {
          fs.unlinkSync(curDir); // 删除文件
        }
      });
      fs.rmdirSync(fp);
    }
  }
};

/**
 * @param {string} oldPath 旧路径名, 注意需要是完整的路径名, 如果是文件还需要带上后缀名
 * @param {string} newPath 新路径名, 注意需要是完整的路径名, 如果是文件还需要带上后缀名
 * @return 操作成功时无返回值, 操作失败`Throw new Error()`说明失败原因, 需要在外界进行捕获
 */
exports.rename = async (oldPath, newPath) => new Promise((resolve, reject) => {
  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      console.error('rename(): ', err);
      reject(err);
    } else {
      resolve();
    }
  });
});
