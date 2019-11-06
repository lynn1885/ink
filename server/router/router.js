const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

const router = express.Router();
const directories = require('../app/controllers/directories');
const files = require('../app/controllers/files');
const images = require('../app/controllers/images');
const userConfig = require('../app/controllers/user-config');
const config = require('../config');

const upload = multer();

// home page
router.get('/', (req, res) => {
  res.send('hello');
});

// directory
router.get('/directories', directories.get);
router.put('/directories', bodyParser.json(), directories.update);
router.post('/directories', bodyParser.json(), directories.create);
router.delete('/directories', directories.delete);

// file
router.get('/files', files.get);
router.get('/search-all-files', files.searchAllFiles);
router.put('/files', bodyParser.json({ limit: `${config.fileSizeLimit}kb` }), files.update);

// image
router.post('/images', upload.single('file'), images.create);

// user-config
router.get('/user-config', userConfig.get);

module.exports = router;
