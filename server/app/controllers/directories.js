const config = require('../../config');
const Directories = require('../models/directories');

exports.get = async (req, res) => {
  await Directories.getRecursively(config.notesDir, config.ignoreNoteDir)
    .then(data => {
      res.json(data);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json(err)
    });
}
