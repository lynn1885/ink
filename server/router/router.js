const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

const router = express.Router();
const directories = require('../app/controllers/directories');
const files = require('../app/controllers/files');
const images = require('../app/controllers/images');
const userConfig = require('../app/controllers/user-config');
const config = require('../config');
const web = require('../app/controllers/web');

const upload = multer();

// home page
router.get('/', (req, res) => {
  res.send('hello ink');
});

// directory
router.get('/directories', directories.get);
router.put('/directories', bodyParser.json(), directories.update);
router.post('/directories', bodyParser.json(), directories.create);
router.delete('/directories', directories.delete);

// file
router.get('/files', files.get);
router.get('/search-all-files', files.searchAllFiles);
router.get('/get-all-files-info', files.getAllFilesInfoList);
router.put('/files', bodyParser.json({ limit: `${config.fileSizeLimit}kb` }), files.update);
router.get('/export-note', files.exportNote);
router.post('/import-note', upload.single('file'), files.importNote);

// image
router.post('/images', upload.single('file'), images.create);
router.get('/images', images.get);

// user-config
router.get('/user-config', userConfig.get);

// web
router.get('/web', web.get);


module.exports = router;
