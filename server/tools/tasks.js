const UserConfig = require('../app/models/user-config');
const Directories = require('../app/models/directories');
const config = require('../config');
const tools = require('./tools');

/**
 * uniformizeUserConfigCatalog: 一致化用户配置中的目录
 * 根据真实目录清理用户配置中的catalog.order, 因为catalog.order中可能会记录一些实际上并不存在的幽灵目录
 * 此方法会生成干净的catalog.order
 */
exports.uniformizeUserConfigCatalog = async () => {
  // 获取用户配置中的catlog.order
  const userConfigCatOrder = await UserConfig.getUserConfig(['catalog', 'order']);
  // 获取真实目录
  const realDir = await Directories.getRecursively(config.notesDir, config.ignoreNoteDir);
  // 根据真实目录, 生成干净且完整的catalog.order
  const uniformizedCatalog = tools.uniformizeCatalogObj(userConfigCatOrder, realDir);
  // 写入配置, 并调用下一个中间件
  await UserConfig.setUserConfig(['catalog', 'order'], uniformizedCatalog);
  console.log('[task] standardize user config');
};
