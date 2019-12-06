/**
 * 此controller控制目录相关的行为, 包括: 目录新建, 目录重命名, 目录调序
 * 在执行写入动作时, 此controller还会维护user-config, 以保持user-config和目录的一致性
 * 在读取操作时, 将直接返回, 一致性仅在写入时进行维护
 */
const path = require('path');
const config = require('../../config');
const Files = require('../models/files');
const Directories = require('../models/directories');
const UserConfig = require('../models/user-config');
const tools = require('../../tools/tools');

/**
 * 获取目录
 * 注意是直接从user-config中读取排序好的目录, 这依赖于user-config和真实目录的一致性
 */
exports.get = async (req, res) => {
  await UserConfig.getUserConfig(['catalog', 'order'])
    .then((data) => {
      console.log(`${new Date().toLocaleString()}: [get catalog]`);
      res.json(data);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json(err);
    });
};

/**
 * 创建目录
 * 如果是三级目录, 也会同时创建文件
 * 创建时会维护user-config(新增目录并排序)
 */
exports.create = async (req, res) => {
  // 准备
  let errRecord;
  if (!tools.isFileNameValid(req.body.catName)) {
    res.status(500).send(`文件名不合法: ${req.body.catName}`);
    return;
  }

  // 拼装完整的路径, 比如: 拼装后是a/b/, 则表示需要在a/b/下创建新目录
  let newFilePath = config.user.dirs.notes;
  for (let i = 0; i < req.body.ancestorCatNames.length; i += 1) {
    newFilePath += req.body.ancestorCatNames[i];
    newFilePath += '/';
  }
  newFilePath += req.body.catName;
  newFilePath += '/';

  // 创建目录: 创建文件夹
  await Directories.create(newFilePath)
    .then(() => {
      console.log(`${new Date().toLocaleString()}: [create catalog] `, newFilePath);
    })
    .catch((err) => {
      errRecord = err;
      console.error(err);
    });

  // 如果是3级目录, 则还需要创建文件
  if (!errRecord && req.body.catLv === 3) {
    await Files.create(`${newFilePath}${req.body.catName}.md`)
      .then(() => {
        console.log(`${new Date().toLocaleString()}: [create catalog] create file `, `${newFilePath}${req.body.catName}.md`);
      })
      .catch((err) => {
        errRecord = err;
        console.error(err);
      });
  }

  // 更新user-config: 把新的目录顺序merge进入用户配置
  if (!errRecord) {
    const newConfig = {}; // 这个对象会对userConfig.catalog.order文件进行merge更新
    for (const cat of req.body.catOrderAfterCreate) {
      newConfig[cat] = {};
    }
    const props = ['catalog', 'order'].concat(req.body.ancestorCatNames);
    // 这里把newConfig放在前面, 是为了让merge之后的配置报错newConfig对象的属性顺序, 把userConfig对象中的数据merge进入newConfig中
    await UserConfig.setUserConfig(props, newConfig, 'new-old')
      .then(() => {
        console.log(`${new Date().toLocaleString()}: [create catalog] update user config: `, JSON.stringify(req.body.catOrderAfterCreate));
      })
      .catch((err) => {
        errRecord = err;
        console.error(err);
      });
  }

  // 返回给前端
  if (!errRecord) {
    res.send();
  } else {
    res.status(500).json(errRecord);
  }
};

/**
 * 删除目录
 */
exports.delete = async (req, res) => {
  let deleteErr;

  // 拼装要删除的路径
  let catPath;
  if (req.query && req.query && req.query.paths) {
    catPath = path.join(config.user.dirs.notes, ...req.query.paths);
  } else {
    res.status(500).send(`参数错误: ${req.query}`);
    console.error(`delete(), 参数错误: ${req.query}`);
  }

  // 删除
  // 删除方式1: 把要删除的文件放到_deleted目录下
  const backupPath = path.join(
    config.user.dirs.notes,
    path.relative(config.user.dirs.notes, config.user.dirs.noteDeleted),
    `${Date.now()}--${req.query.paths.join(', ')}`,
  );
  await Directories.rename(catPath, backupPath)
    .then(() => {
      console.log(`${new Date().toLocaleString()}: [delete catalog] ${catPath}`);
      console.log(`${new Date().toLocaleString()}: [delete catalog] move to deleted folder: ${backupPath}`);
    })
    .catch((err) => {
      deleteErr = err;
      console.error('delete(): 删除失败', err);
    });
  // 删除方式2: 真的删除
  // await Directories.deleteRecursively(catPath)
  //   .then(() => {
  //     console.log(`[delete catalog] ${catPath}`);
  //   })
  //   .catch((err) => {
  //     deleteErr = err;
  //     console.error('delete(): 删除失败', err);
  //   });

  // 如果删除时发生错误: 可能有些文件被删除了, 有些文件没有被删除
  // 需要参照真实目录, 一致化当前用户配置的catalog, 让catalog和真实目录保持一致
  if (deleteErr) {
    console.error('删除失败后, 尝试参照真实目录, 一致化当前用户配置的catalog');
    // 获取用户配置中的catlog.order
    const userConfigCatOrder = await UserConfig.getUserConfig(['catalog', 'order']);
    // 获取真实目录
    const realDir = await Directories.getRecursively(config.user.dirs.notes);
    // 根据真实目录, 生成干净且完整的catalog.order
    const uniformizedCatalog = tools.uniformizeCatalogObj(userConfigCatOrder, realDir);
    // 写入配置文件
    await UserConfig.setUserConfig(['catalog', 'order'], uniformizedCatalog);
    res.status(500).send(`删除失败: ${JSON.stringify(deleteErr)}`);
  }

  // 更新user-config
  if (!deleteErr) {
    await UserConfig.deleteUserConfig(['catalog', 'order'].concat(req.query.paths))
      .then(() => {
        res.send();
        console.log(`${new Date().toLocaleString()}: [delete catalog] update user config: ${req.query.paths}`);
      })
      .catch((err) => {
        console.error(`delete(): 删除成功, 但同步删除用户配置失败: ${JSON.stringify(err)}`);
        res.status(500).send('删除成功, 但同步删除用户配置失败');
      });
  }
};

/**
 * 更新目录, 包括目录重命名, 目录调序
 */
exports.update = async (req, res) => {
  // 校验
  if (!req.body || !req.body.task) {
    console.log(`${new Date().toLocaleString()}: update(): 参数不匹配, 未找到task名: ${req.body.task}`);
    res.status(500).send(`${new Date().toLocaleString()}: update(): 参数不匹配, 未找到task名: ${req.body.task}`);
    return;
  }

  // 重命名
  if (req.body.task === 'RENAME') {
    // 校验
    if (
      !Array.isArray(req.body.ancestorCatNames)
      || typeof req.body.oldName !== 'string'
      || typeof req.body.newName !== 'string'
      || req.body.catOrderAfterRename.length === 0
      || !tools.isFileNameValid(req.body.newName)
    ) {
      res.status(500).send('rename: 参数不匹配, 或文件名不合法');
      return;
    }

    // 调用
    await _rename(
      req.body.ancestorCatNames,
      req.body.oldName,
      req.body.newName,
    )
      .then(() => {
        console.log(`${new Date().toLocaleString()}: [rename catalog] ${req.body.ancestorCatNames}: ${req.body.oldName} → ${req.body.newName}`);
        res.send();
      })
      .catch((err) => {
        console.error(`update(), rename failed: ${JSON.stringify(err)}`);
        res.status(500).send(`rename failed: ${JSON.stringify(err)}`);
      });
    // eslint-disable-next-line brace-style
  }

  // 重排序
  else if (req.body.task === 'REORDER') {
    // 校验
    // 最多只接收两个目录的重排序
    // 只有一个目录时, 表示同级目录重排序, 不涉及文件移动
    // 有两个目录时, 表示跨目录的重排序, 需要移动物理目录
    // 此时默认第一个目录是移出目录, 第二个目录是移入目录
    if (
      !Array.isArray(req.body.affectedCatalogs)
      || req.body.affectedCatalogs.length > 2
      || typeof req.body.catName !== 'string'
    ) {
      res.status(500).send('reorder(): 参数不匹配');
      return;
    }

    // 校验: 检查文件是否重名
    let isFileNameDuplicated = false;
    req.body.affectedCatalogs.forEach((cat) => {
      if (new Set(cat.newCatOrder).size !== cat.newCatOrder.length) {
        isFileNameDuplicated = true;
      }
    });
    if (isFileNameDuplicated) {
      res.status(500).send('reorder(), Duplicate file names exist in newCatOrder');
      return;
    }

    // 调用
    await _reorder(req.body.affectedCatalogs, req.body.catName)
      .then(() => {
        console.log(`${new Date().toLocaleString()}: [catalog reorder] ${JSON.stringify(req.body.affectedCatalogs)}`);
        res.send();
      })
      .catch((err) => {
        console.error(`update(), reorder failed: ${JSON.stringify(err)}`);
        res.status(500).send(`reorder failed: ${JSON.stringify(err)}`);
      });
  }
};

/**
 * _rename 重命名目录, 内部函数, 供update()接口调用
 * @param {string []} ancestorCatNames 要重命名的目录的祖先目录们
 * @param {string} oldName 旧目录名
 * @param {string} newName 新目录名
 * @return {object} 会在函数体内完成操作, 操作成功时无返回值, 操作失败时: `Throw new Error(错误对象)`, 需要在外界进行捕获
 */
async function _rename(ancestorCatNames, oldName, newName) {
  // 准备
  let dirRenameErr;
  let fileRenameErr;
  let oldPath;
  let newPath;

  // 重命名目录
  oldPath = path.join(config.user.dirs.notes, ...ancestorCatNames, oldName);
  newPath = path.join(config.user.dirs.notes, ...ancestorCatNames, newName);

  // 重命名文件
  await Directories.rename(oldPath, newPath)
    .catch((err) => { dirRenameErr = err; });

  // 如果是三级目录, 且文件夹重命名成功, 还需要重命名文件. 注意, 需要到重命名后的新文件夹中进行重名名
  if (ancestorCatNames.length === 2 && !dirRenameErr) {
    oldPath = path.join(config.user.dirs.notes, ...ancestorCatNames, newName, `${oldName}.md`);
    newPath = path.join(config.user.dirs.notes, ...ancestorCatNames, newName, `${newName}.md`);
    await Directories.rename(oldPath, newPath)
      .catch((err) => { fileRenameErr = err; });
  }

  // 重命名后处理
  if (!dirRenameErr && !fileRenameErr) { // 无错误发生, 更新用户配置
    await UserConfig.renameUserConfig(['catalog', 'order'].concat(ancestorCatNames), oldName, newName)
      .catch((err) => { throw new Error(`_rename(): 重命名用户配置失败: ${err}`); });
  } else if (dirRenameErr) { //  一二三级目录重命名失败: 抛出错误即可
    throw new Error(`目录重命名失败: ${oldPath} -> ${newPath}, ${dirRenameErr}`);
  } else if (fileRenameErr) { // 三级目录命名成功, 但目录下的文件命名失败: 抛出错误, 并回滚文件重命名名. ⚠️ 但回滚也可能失败, 这是致命错误
    oldPath = path.join(config.user.dirs.notes, ...ancestorCatNames, newName);
    newPath = path.join(config.user.dirs.notes, ...ancestorCatNames, oldName);
    await Directories.rename(oldPath, newPath)
      .catch((err) => { throw new Error(` _rename(): FATAL ERROR, 回滚目录命名失败: ${oldPath} -> ${newPath}, ${err}`); });
    throw new Error(`文件重命名失败: ${oldPath} -> ${newPath}, ${fileRenameErr}`);
  }
}

/**
 * _reorder 重排序目录, 内部函数, 供update()接口调用
 * @param {array} affectedCatalogs 受影响的目录
 * @param {string} catName 移动的目名
 */
async function _reorder(affectedCatalogs, catName) {
  // 跨文件重排序: 需移动文件
  if (affectedCatalogs.length === 2) { // 表示
    const oldPath = path.join(config.user.dirs.notes, ...affectedCatalogs[0].ancestorCatNames, catName);
    const newPath = path.join(config.user.dirs.notes, ...affectedCatalogs[1].ancestorCatNames, catName);
    await Directories.rename(oldPath, newPath)
      .then(() => {
        console.log(`${new Date().toLocaleString()}: [catalog reorder] move file. from: ${oldPath} to ${newPath}`);
      });
  }

  // 写入用户配置: 不跨文件重排序
  if (affectedCatalogs.length === 1) {
    const newCatOrder = {};
    for (const o of affectedCatalogs[0].newCatOrder) {
      newCatOrder[o] = {};
    }
    await UserConfig.reorderUserConfig(['catalog', 'order'].concat(affectedCatalogs[0].ancestorCatNames), newCatOrder);
    // 写入用户配置: 跨文件重排序, 注意只是把旧目录中的配置转移到新目录中, 并不按传入的newCatOrder排序
  } else if (affectedCatalogs.length === 2) {
    const oldProps = ['catalog', 'order'].concat(affectedCatalogs[0].ancestorCatNames, catName);
    const newProps = ['catalog', 'order'].concat(affectedCatalogs[1].ancestorCatNames, catName);
    const catInfo = await UserConfig.getUserConfig(oldProps);
    await UserConfig.deleteUserConfig(oldProps);
    await UserConfig.setUserConfig(newProps, catInfo, undefined, true);
  }
}
