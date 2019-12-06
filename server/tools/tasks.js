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
        fs.mkdirSync(path.join(config.user.dirs[dir], '一级目录', '二级目录', '使用说明'));
        const defaultNote = fs.readFileSync(path.join(__dirname, '../res/default-note.md'), { encoding: 'utf8' });
        fs.writeFileSync(path.join(config.user.dirs[dir], '一级目录', '二级目录', '使用说明', '使用说明.md'), defaultNote);
      }
    }
  }
};

/**
 * create default user config file
 */
exports.createDefaultUserConfig = () => {
  console.log(`${new Date().toLocaleString()}: [task] create default user config file`);
  if (!fs.existsSync(config.user.files.configFile)) {
    console.warn('[WARNING] User config file does not exist and will be created automatically: ', config.user.files.configFile);
    const defaultUserConfig = fs.readFileSync(path.join(__dirname, '../res/default-user-config.json'), { encoding: 'utf8' });
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
    fs.copyFileSync(path.join(__dirname, '../res/default-note-icon.png'), config.user.files.defaultNoteIcon);
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
