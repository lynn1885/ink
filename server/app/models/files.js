const fs = require('fs');

exports.readFile = async (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, {encoding: 'utf8'}, (err, data) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(data);
      }
    })
  })
};

exports.writeFile = async (path, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, {encoding: 'utf8', flag: 'w'}, (err) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve();
      }
    })
  })
};

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
