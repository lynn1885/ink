const fs = require('fs');
const path = require('path');
const _ = require('lodash');

// 配置路径
const defaultConfigPath = path.join(__dirname, '../../user-config/default-config.json');
const userConfigPath = path.join(__dirname, '../../user-config/user-config.json');

/**
 * getDefault: 获取默认配置
 */
exports.getDefaultConfig = async () => new Promise((resolve, reject) => {
  fs.readFile(defaultConfigPath, { encoding: 'utf8' }, (err, data) => {
    if (err) {
      console.error(err);
      reject(err);
    } else {
      resolve(JSON.parse(data));
    }
  });
});

/**
 * getUserConfig: 获取用户配置
 * @param {string []} props 要获取的对象路径, 比如['catalog', 'order']表示要获取userConfig.catalog.order
 * 不传入则获取整个用户配置对象
 */
exports.getUserConfig = async (props) => {
  // 读取用户配置
  let userConfig;
  await new Promise((resolve, reject) => {
    fs.readFile(userConfigPath, { encoding: 'utf8' }, (err, data) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        userConfig = JSON.parse(data);
        resolve();
      }
    });
  });

  // 按需返回
  let res;
  if (!props) {
    res = userConfig;
  } else {
    let p = userConfig;
    // eslint-disable-next-line no-restricted-syntax
    for (const prop of props) {
      if (p[prop]) {
        p = p[prop];
      } else {
        throw new Error(`getUserConfig(), 读取失败. 不存在的props路径: ${props}`);
      }
    }
    res = p;
  }
  return res;
};

/**
 * getUserConfig: 获取混合配置(默认 + 用户)
 * @param {string[]} props 要获取的对象路径, 比如`['catalog', 'order']`表示要获取mergedConfig.catalog.order
 * 不传入则获取整个用户配置对象
 */
exports.getMergedConfig = async (props) => {
  // 混合配置
  const defaultConfig = await exports.getDefaultConfig();
  const userConfig = await exports.getUserConfig();
  // 混合配置, 此时我们需要让userConfig中的"值"覆盖defaultConfig中的值, 所以把userConfig放在后面
  const mergedConfig = _.merge(defaultConfig, userConfig);

  // 按需返回
  let res;
  if (!props) {
    res = mergedConfig;
  } else {
    let p = mergedConfig;
    // eslint-disable-next-line no-restricted-syntax
    for (const prop of props) {
      if (p[prop]) {
        p = p[prop];
      } else {
        throw new Error(`getMergedConfig(), 读取失败. 不存在的props路径: ${props}`);
      }
    }
    res = p;
  }
  return res;
};

/**
 * setUserConfig: 设置用户配置
 * @param {string[]} props  要写入到的对象路径, 比如['catalog', 'order']
 * 表示要写入到userConfig.catalog.order, 而不修改其他部分
 * 不传入则表示修改整个userConfig对象
 * @param {any} data 要写入到指定路径的数据, 函数内部会自动将其转化为json字符串写入文件. 所以传入时不用手动转换
 * @param {string} merge 是否写入时进行merge操作, 不传入则不进行混合. 用写入的数据完全替换旧数据
 * 可取值: `'old-new'`: 把新数据data混入旧数据oldUserconfig中, 实现: _.merge(oldUserConfig, data)
 * 此时会保留oldUserConfig对象的属性顺序, 但data中的同名属性值会替换掉oldUserConfig中的同名属性值(并对oldUserConfig进行属性补全), 常用于更新属性值
 * 可取值: `'new-old'`': 把旧数据oldUserconfig混入新数据data中, 实现: _.merge(data, oldUserConfig)
 * 此时会使用新数据data对象中的属性顺序, 但oldUserConfig中的同名属性值会替换data中的同名属性值(并对data进行属性补全), 常用于调整catlog order的顺序
 * @param {boolean} isRecursively 是否递归写入, 即, 如果该对象路径不存在, 则自动以对象的形式创建该路径, 并执行写入, 默认`false`
 */
exports.setUserConfig = async (props, data, merge, isRecursively = false) => {
  // 读取文件
  let userConfig = await exports.getUserConfig();

  // 修改对象
  if (!props) { // 全部修改
    userConfig = modify(userConfig, data, merge);
  } else if (!Array.isArray(props) || props.length === 0) { // 部分修改
    throw new Error(`setUserConfig(): 传入了props, 但props不是array或长度为0: ${props}`);
  } else if (props.length > 6) { // 最多修改到六层深度
    throw new Error(`setUserConfig(): 传入了props的长度过长, 最长为6: ${props}`);
  } else {
    if (isRecursively) { // 递归生成结构
      let p = userConfig;
      for (const prop of props) {
        if (p[prop] === undefined) {
          p[prop] = {};
        }
        p = p[prop];
      }
    }
    switch (props.length) { // 根据深度修改对象
      case 1:
        userConfig[props[0]] = modify(userConfig[props[0]], data, merge);
        break;
      case 2:
        userConfig[props[0]][props[1]] = modify(userConfig[props[0]][props[1]], data, merge);
        break;
      case 3:
        // eslint-disable-next-line max-len
        userConfig[props[0]][props[1]][props[2]] = modify(userConfig[props[0]][props[1]][props[2]], data, merge);
        break;
      case 4:
        // eslint-disable-next-line max-len
        userConfig[props[0]][props[1]][props[2]][props[3]] = modify(userConfig[props[0]][props[1]][props[2]][props[3]], data, merge);
        break;
      case 5:
        // eslint-disable-next-line max-len
        userConfig[props[0]][props[1]][props[2]][props[3]][props[4]] = modify(userConfig[props[0]][props[1]][props[2]][props[3]][props[4]], data, merge);
        break;
      case 6:
        // eslint-disable-next-line max-len
        userConfig[props[0]][props[1]][props[2]][props[3]][props[4]][props[5]] = modify(userConfig[props[0]][props[1]][props[2]][props[3]][props[4]][props[5]], data, merge);
        break;
      default:
        break;
    }
  }

  // 写入文件
  return new Promise((resolve, reject) => {
    fs.writeFile(userConfigPath, JSON.stringify(userConfig, null, 2), { encoding: 'utf8', flag: 'w' }, (err) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve();
      }
    });
  });

  // 工具: 修改对象数据
  function modify(oldData, newData, mg) {
    if (!mg) {
      return newData;
    } if (mg === 'old-new') {
      return _.merge(oldData, newData); // merge函数会自动修改第一个参数, 所以这里其实已经修改了oldData了
    // eslint-disable-next-line no-else-return
    } else if (mg === 'new-old') {
      return _.merge(newData, oldData);
    } else {
      throw new Error(`setUserConfig(): 不支持的merge参数: ${mg}`);
    }
  }
};

/**
 * deleteUserConfig: 删除用户配置
 * @param {string[]} props  要删除的对象路径, 比如['catalog', 'order']表示要删除userConfig.catalog.order
 *
 */
exports.deleteUserConfig = async (props) => {
  // 读取文件
  const userConfig = await exports.getUserConfig();
  const lastProp = props.slice(-1);
  const restProps = props.slice(0, -1);

  // 删除文件
  let p = userConfig;
  for (const a of restProps) {
    p = p[a];
  }
  delete p[lastProp];

  // 写入文件
  return new Promise((resolve, reject) => {
    fs.writeFile(userConfigPath, JSON.stringify(userConfig, null, 2), { encoding: 'utf8', flag: 'w' }, (err) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * renameUserConfig: 重命名用户配置的字段
 * @param {string []} props 要命名的路径, 如传入: `['catalog', 'order']`,
 * 表示你要对userConfig.catalog.order下的字段进行重命名
 * 注意: `这个路径对应的必须是个object`
 * @param {string} oldName 旧名字
 * @param {string} newName 新名字
 */
exports.renameUserConfig = async (props, oldName, newName) => {
  // 校验
  if (
    !Array.isArray(props)
    || typeof oldName !== 'string'
    || typeof newName !== 'string'
  ) {
    throw new Error(`renameUserConfig(): 参数错误: ${props}, ${oldName}, ${newName}`);
  }

  // 读取文件
  const oldUserConfig = await exports.getUserConfig(props);
  if (typeof oldUserConfig !== 'object' || Array.isArray(oldUserConfig)) {
    throw new Error(`renameUserConfig(): 待重命名的部分不是object: ${oldUserConfig}, ${props}`);
  }
  if (!(oldName in oldUserConfig)) {
    throw new Error(`renameUserConfig(): 对象上不存在要重命名的属性: ${oldUserConfig}, ${oldName}`);
  }

  // 重命名: 这里有一个bug: 数字开头的属性会被放在对象的最上方, 从而影响排序. 这和js生成对象的顺序有关
  const newUserConfig = {};
  const keys = Object.keys(oldUserConfig);
  keys.forEach((k) => {
    if (k === oldName) {
      newUserConfig[newName] = oldUserConfig[oldName];
    } else {
      newUserConfig[k] = oldUserConfig[k];
    }
  });

  // 写入
  await exports.setUserConfig(props, newUserConfig);
};

/**
 * reorderUserConfig 对用户配置进行重排序
 * @param {string []} props 要进行重排序的路径
 * @param {object} newOrder 新的顺序对象, 必须是个对象
 * @param {boolean} isDelExtraOldConfig 是否删除旧配置中多余的配置. 默认为`true`, 这样重排序之后, 新顺序中只包含newOrder中包含的项
 */
exports.reorderUserConfig = async (props, newOrder, isDelExtraOldConfig = true) => {
  // 校验
  if (
    !Array.isArray(props)
    || typeof newOrder !== 'object'
    || Array.isArray(newOrder)
  ) {
    throw new Error(`reorderUserConfig(): 参数错误: ${props}, ${newOrder}`);
  }
  // 读取配置
  const oldUserConfig = await exports.getUserConfig(props);
  // 混合配置
  const newUserConfig = _.merge(_.cloneDeep(newOrder), oldUserConfig);
  // 按需清理配置: 将以新顺序为准, 删除旧顺序中的多余值
  if (isDelExtraOldConfig) {
    for (const c in newUserConfig) {
      if (!(c in newOrder)) {
        delete newUserConfig[c];
      }
    }
  }
  // 写入
  await exports.setUserConfig(props, newUserConfig);
};
