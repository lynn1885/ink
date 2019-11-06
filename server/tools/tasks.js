const UserConfig = require('../app/models/user-config');
const Directories = require('../app/models/directories');
const config = require('../config');
const tools = require('./tools');

/**
 * unifyCatalog: make the catalog in user's config.json consistent with the real catalog
 * Because the user's config.json file will record some directories that do not actually exist.
 */
exports.unifyCatalog = async () => {
  // get the catalog in user's config file
  const userConfigCatOrder = await UserConfig.getUserConfig(['catalog', 'order']);
  // get the real catalog in user's note directory
  const realDir = await Directories.getRecursively(config.notesDir);
  // generate a new catalog from the real catalog
  const uniformizedCatalog = tools.uniformizeCatalogObj(userConfigCatOrder, realDir);
  // write to user's config file
  await UserConfig.setUserConfig(['catalog', 'order'], uniformizedCatalog);
  console.log(`${new Date().toLocaleString()}: [task] unify catalog`);
};

// clear logs

// clear deleted notes

// clear images
