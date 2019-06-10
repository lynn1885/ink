const fs = require('fs');

/**
* create
* @param path {String} file path
*/
exports.create = async path => new Promise((resolve, reject) => {
  fs.writeFile(path, '', { encoding: 'utf8', flag: 'w' }, (err) => {
    if (err) {
      console.error(err);
      reject(err);
    } else {
      resolve();
    }
  });
});

/**
* read
* @param path {String} file path
* @return data {string} file data
*/
exports.read = async path => new Promise((resolve, reject) => {
  fs.readFile(path, { encoding: 'utf8' }, (err, data) => {
    if (err) {
      console.error(err);
      reject(err);
    } else {
      resolve(data);
    }
  });
});

/**
* write
* @param path {String} file path
* @return data {string} file data
*/
exports.write = async (path, data) => new Promise((resolve, reject) => {
  fs.writeFile(path, data, { encoding: 'utf8', flag: 'w' }, (err) => {
    if (err) {
      console.error(err);
      reject(err);
    } else {
      resolve();
    }
  });
});

/**
* delete file
* @param path {String} file path
*/
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
