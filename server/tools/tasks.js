const fs = require('fs');
const path = require('path');
const UserConfig = require('../app/models/user-config');
const Directories = require('../app/models/directories');
const config = require('../config');
const tools = require('./tools');

/**
 * create default user dir & default note
 */
exports.createDefaultUserDir = () => {
  console.log(`${new Date().toLocaleString()}: [task] create default user dir`);
  // eslint-disable-next-line guard-for-in
  for (const dir in config.user.dirs) {
    if (!fs.existsSync(config.user.dirs[dir])) {
      console.warn('[WARNING] This user directory does not exist and will be created automatically: ', config.user.dirs[dir]);
      fs.mkdirSync(config.user.dirs[dir]);
      // create default notes
      if (dir === 'notes') {
        fs.mkdirSync(path.join(config.user.dirs[dir], '一级目录'));
        fs.mkdirSync(path.join(config.user.dirs[dir], '一级目录', '二级目录'));
        fs.mkdirSync(path.join(config.user.dirs[dir], '一级目录', '二级目录', '用户手册'));
        const defaultNote = fs.readFileSync(config.inner.files.defaultNote, { encoding: 'utf8' });
        fs.writeFileSync(path.join(config.user.dirs[dir], '一级目录', '二级目录', '用户手册', '用户手册.md'), defaultNote);
      }
    }
  }
};

exports.creatDefaultInnerNotes = () => {
  console.log(`${new Date().toLocaleString()}: [task] create default inner notes`);
  // get inner notes
  function r(dir) {
    // calculate
    const relativeD = path.relative(config.inner.dirs.res, dir);
    const targetPath = path.join(config.user.dirs.notes, relativeD);
    const isDir = fs.statSync(dir).isDirectory();
    // create inner notes in user notes
    if (!fs.existsSync(targetPath)) {
      console.warn('[WARNING] this inner note does not exist and will be created automatically: ', targetPath);
      if (isDir) {
        fs.mkdirSync(targetPath);
      } else {
        fs.copyFileSync(dir, targetPath);
      }
    }

    // is dir, recursion
    if (isDir) {
      const thisLvDirs = fs.readdirSync(dir);
      for (const d of thisLvDirs) {
        const completeD = path.join(dir, d);
        r(completeD);
      }
    }
  }
  r(config.inner.dirs.innerNotes);
};

/**
 * create default user config file
 */
exports.createDefaultUserConfig = () => {
  console.log(`${new Date().toLocaleString()}: [task] create default user config file`);
  if (!fs.existsSync(config.user.files.configFile)) {
    console.warn('[WARNING] User config file does not exist and will be created automatically: ', config.user.files.configFile);
    const defaultUserConfig = fs.readFileSync(config.inner.files.defaultConfigFile, { encoding: 'utf8' });
    fs.writeFileSync(config.user.files.configFile, defaultUserConfig);
  }
};

/**
 * create default note icon
 */
exports.createDefaultNoteIcon = () => {
  console.log(`${new Date().toLocaleString()}: [task] create default note icon`);
  if (!fs.existsSync(config.user.files.defaultNoteIcon)) {
    console.warn('[WARNING] default note icon does not exist and will be created automatically: ', config.user.files.defaultNoteIcon);
    fs.copyFileSync(config.inner.files.defaultNoteIcon, config.user.files.defaultNoteIcon);
  }
};

/**
 * unifyCatalog: make the catalog in user's config.json consistent with the real catalog
 * Because the user's config.json file will record some directories that do not actually exist.
 */
exports.unifyCatalog = async () => {
  // get the catalog in user's config file
  const userConfigCatOrder = await UserConfig.getUserConfig(['catalog', 'order']);
  // get the real catalog in user's note directory
  const realDir = await Directories.getRecursively(config.user.dirs.notes);
  // generate a new catalog from the real catalog
  const uniformizedCatalog = tools.uniformizeCatalogObj(userConfigCatOrder, realDir);
  // write to user's config file
  await UserConfig.setUserConfig(['catalog', 'order'], uniformizedCatalog);
  console.log(`${new Date().toLocaleString()}: [task] unify catalog`);
};

// clear logs

// clear deleted notes

// clear images
