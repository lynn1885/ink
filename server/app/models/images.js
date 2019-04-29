const fs = require('fs');

exports.create = async function (path, file) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, file.buffer, 'binary', function(err){
      if (err) {
        reject(err);
      } else {
        console.log('image uploaded', path);
        resolve();
      }
    });
  });
}

exports.unlink = async (path) => {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve();
      }
    })
  })
};