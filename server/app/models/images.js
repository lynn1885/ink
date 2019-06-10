const fs = require('fs');

exports.create = async (path, file) => new Promise((resolve, reject) => {
  fs.writeFile(path, file.buffer, 'binary', (err) => {
    if (err) {
      reject(err);
    } else {
      console.log('[image] uploaded', path);
      resolve();
    }
  });
});

exports.delete = async path => new Promise((resolve, reject) => {
  fs.unlink(path, (err) => {
    if (err) {
      console.error(err);
      reject(err);
    } else {
      resolve();
    }
  });
});
