const fs = require('fs');

exports.get = async (path) => {
  return await new Promise((resolve, reject) => {
    fs.readdir(path, { encoding: 'utf8' }, async (err, files) => {
      if (err) {
        console.error('get(): ', err);
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

exports.getRecursively = async (path, ignorePath) => {
  return await r(path);

  async function r(path) {
    let catalog = {};
    return await new Promise((resolve, reject) => {
      fs.readdir(path, { encoding: 'utf8' }, async (err, files) => {
        if (err) {
          console.error('getRecursively(): ', err);
          reject(err)
        } else {
          for (let f of files) {
            let newPath;
            if (path.slice(-1) === '/') {
              newPath = `${path}${f}`;
            } else {
              newPath = `${path}/${f}`;
            }
            if (newPath + '/' === ignorePath) {
              break;
            }
            await new Promise((resolve, reject) => {
              fs.stat(newPath, async (err, stats) => {
                if (err) {
                  console.error('getRecursively(): ', err);
                  reject(err);
                } else {
                  if (stats.isDirectory()) {
                    catalog[f] = await r(newPath);
                  } else if (newPath.includes('.md')) {
                    catalog[f] = true;
                  }
                }
                resolve();
              })
            })
          }
          resolve(catalog);
        }
      });
    });
  }
};
