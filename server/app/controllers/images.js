const path = require('path');
const config = require('../../config');
const Images = require('../models/images');
const Directories = require('../models/directories');

// write a image into the image directory
exports.create = async (req, res) => {
  if (!req.body.fileDir) {
    throw new Error(`create(), invalid req.body.fileDir: ${req.body}`);
  }
  if (!req.file) {
    throw new Error(`create(), cannot find req.file: ${req.file}`);
  }

  const dateMs = new Date().valueOf();
  const { fileDir } = req.body;
  const { file } = req;
  const imageDir = config.user.dirs.noteImages;

  // images will be placed in different directories
  // create new directories base on time
  // averagely, create a new directory each month
  // 30 * 24 * 3600 * 1000 = 2592000000
  const middleDirNum = Math.floor(dateMs / 2592000000);
  const middleDir = String(middleDirNum);
  const name = (dateMs - middleDirNum * 2592000000).toString();
  const ext = `.${file.mimetype.split('/')[1]}`;

  // create a image file
  // or create a new directory, then create a new image file
  const fullDir = path.join(imageDir, middleDir);
  const fullPath = path.format({ dir: fullDir, base: name + ext });
  await Directories.isExist(fullDir)
    .catch(async () => {
      await Directories.create(fullDir);
    });
  await Images.create(fullPath, file)
    .then(() => {
      res.json({
        dir: middleDir,
        fileName: name + ext,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json(err);
    });
};

// get images
exports.get = async (req, res) => {
  if (!req.query || !req.query.keyword || !req.query.type) {
    res.status(400).send('错误的keyword参数');
    return;
  }

  switch (req.query.type) {
    case 'illustration': {
      const imgs = await Images.searchOnline(String(req.query.keyword));
      res.send(imgs);
    }
      break;

    default:
      res.status(400).send('无法识别的type参数: ', req.query.type);
      break;
  }
};
