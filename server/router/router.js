const express = require('express');
const router = express.Router();
const directories = require('../app/controllers/directories');
const files = require('../app/controllers/files');
const images = require('../app/controllers/images');
const bodyParser = require('body-parser');
const config = require('../config');
const multer = require ('multer');
const upload = multer()

//home page
router.get('/', (req, res) => {
  res.send('hello');
})

// file & directory
router.get('/directories', directories.get);
// router.put('/directories', directories.update);
// router.post('/directories', directories.create);
// router.delete('/directories', directories.delete);
router.get('/files', files.get);
router.put('/files', bodyParser.json({limit: `${config.fileSizeLimit}kb`}), files.update);
// router.post('/files', files.post);
// router.delete('/files', files.delete);
router.post('/images', upload.single('file'), images.create);

module.exports = router;
