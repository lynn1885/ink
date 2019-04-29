const config = require('../../config');
const Images = require('../models/images');
const path = require('path');
const fs = require('fs');

exports.create = async (req, res) => {
  if (!req.body.fileDir) {
    throw new Error(`create(), invalid req.body.fileDir: ${req.body}`);
  }
  if (!req.file) {
    throw new Error(`create(), cannot find req.file: ${req.file}`);
  }

  const fileDir = req.body.fileDir;
  const fileName = req.body.fileName;
  const file = req.file;
  let name, ext, wholePath;
  let dir = config.noteImagesDir;

  ext = `.${file.mimetype.split('/')[1]}`;
  name = new Date().valueOf().toString();
  if (fileName) {
    name += path.parse(fileName).name;
  }
  wholePath = dir + name + ext;
  
  await Images.create(wholePath, file)
  .then(data => {
    res.json({
      fileDir,
      fileName: name + ext,
    });
  })
  .catch(err => {
    console.error(err);
    res.status(500).json(err)
  });
}

exports.delete = async (req, res) => {

}
