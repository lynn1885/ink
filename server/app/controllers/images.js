const path = require('path');
const config = require('../../config');
const Images = require('../models/images');

exports.create = async (req, res) => {
  if (!req.body.fileDir) {
    throw new Error(`create(), invalid req.body.fileDir: ${req.body}`);
  }
  if (!req.file) {
    throw new Error(`create(), cannot find req.file: ${req.file}`);
  }

  const { fileDir } = req.body;
  const { fileName } = req.body;
  const { file } = req;
  const dir = config.noteImagesDir;
  const ext = `.${file.mimetype.split('/')[1]}`;
  let name = new Date().valueOf().toString();
  if (fileName) {
    name += path.parse(fileName).name;
  }
  const wholePath = dir + name + ext;

  await Images.create(wholePath, file)
    .then(() => {
      res.json({
        fileDir,
        fileName: name + ext,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json(err);
    });
};

// exports.delete = async (req, res) => {

// };
