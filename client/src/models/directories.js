import axios from 'axios';
import config from '@/config';

const { serverUrl } = config.server;

const Directories = {
  /**
   * get: 获取目录
   * @param {function} messager 用于获取失败时, 给用户发送信息
   * @returns {object} 目录对象
   */
  async get(messager) {
    let catalog = null;
    await axios.get(`${serverUrl}directories`)
      .then((res) => {
        if (res.status === 200) {
          catalog = res.data;
        } else {
          if (messager) {
            messager.error(`Directories.get(), Bad HTTP status: \n', ${res.status}`);
          }
          throw new Error(`Directories.get(), Bad HTTP status: \n', ${res.status}`);
        }
      })
      .catch((err) => {
        if (messager) {
          messager.error(`Directories.get() Error: ${err}`);
        }
        throw new Error(`Directories.get() Error: ${err}`);
      });
    return catalog;
  },

  /**
   * create: 创建目录
   * @param {object} data 传输数据
   * data.catLv {number} 目录等级, 如: 2 表示在二级目录创建新目录
   * data.catName {string} 目录名, 如: file 1
   * data.ancestorCatNames {Array} 祖先目录, 比如要在三级目录创建文件, 就需要传入当前三级目录所属的一二级目录名, 如: ['a', 'b']
   * data.catOrderAfterCreate {array} 创建文件之后, 当前层级的目录数组, 用于后端对目录进行排序: 如['a', 'mine', 'file1']
   * @param {function} messager 通知器
   * @returns {boolean} 创建是否成功
   */
  async create(data, messager) {
    // 校验
    if (!data ||
      typeof data.catLv !== 'number' ||
      typeof data.catName !== 'string' ||
      !Array.isArray(data.catOrderAfterCreate) ||
      !Array.isArray(data.ancestorCatNames) ||
      data.ancestorCatNames.length !== data.catLv - 1
    ) {
      throw new Error(`Directories.create(), wrong parameters: ${JSON.stringify(data)}`);
    }
    if (new Set(data.catOrderAfterCreate).size !== data.catOrderAfterCreate.length) {
      throw new Error(`Directories.create(), Duplicate file names exist: ${JSON.stringify(data.catOrderAfterCreate)}`);
    }

    // 创建
    await axios.post(`${serverUrl}directories`, JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
      .then((res) => {
        if (res.status === 200) {
          console.log(`[created catalog] Lv: ${data.catLv}, name: ${data.catName}`);
        } else {
          if (messager) {
            messager.error('Directories.create(), 创建目录失败');
          }
          throw new Error(`Directories.create(), 创建目录失败 \n Bad Http Status: ${res}`);
        }
      })
      .catch((err) => {
        if (messager) {
          messager.error('Directories.create(), 创建目录失败');
        }
        throw new Error(`Directories.create(), 创建目录失败 \n create Failed: ${err}`);
      });
  },

  /**
   * delete: 删除目录
   * @param {array} paths 要删除的路径数组
   * @param {function} messager 通知器
   */
  async delete(paths, messager) {
    // 校验
    if (!paths ||
      !Array.isArray(paths) ||
      paths.length === 0 ||
      paths.length > 3
    ) {
      throw new Error(`Directories.delete(), wrong parameters: ${JSON.stringify(paths)}`);
    }
    await axios.delete(`${serverUrl}directories`, {
      params: {
        paths,
      },
    })
      .then((res) => {
        if (res.status === 200) {
          console.log(`[deleted catalog] ${paths}`);
        } else {
          if (messager) {
            messager.error('删除失败!');
          }
          throw new Error(`Directories.delete(), 删除失败, Bad HTTP status: \n', ${res.status}`);
        }
      })
      .catch((err) => {
        if (messager) {
          messager.error('删除失败!');
        }
        throw new Error(`Directories.delete(), 删除失败, Error: ${err}`);
      });
  },

  /**
   * rename: 重命名路径
   * @param {object} params 参数
   * params.task: `string` 任务名, 对于该任务需要是'RENAME'
   * params.ancestorCatNames `string[]` 当前重命名目录的祖先目录们
   * params.oldName `string` 当前旧目录名
   * params.newName `string` 新目录名
   * params.catOrderAfterRename `string[]` 重命名后的当前层目录名, 用于后端目录排序
   * @param {function} messager 通知器
   */
  async rename(params, messager) {
    // 校验
    if (!params ||
      !Array.isArray(params.ancestorCatNames) ||
      !Array.isArray(params.catOrderAfterRename) ||
      params.catOrderAfterRename.length === 0 ||
      typeof params.oldName !== 'string' ||
      typeof params.newName !== 'string'
    ) {
      throw new Error(`Directories.rename(), wrong parameters: ${JSON.stringify(params)}`);
    }
    if (new Set(params.catOrderAfterRename).size !== params.catOrderAfterRename.length) {
      throw new Error(`Directories.rename(), Duplicate file names exist: ${JSON.stringify(params.catOrderAfterRename)}`);
    }

    // 发送
    await axios.put(`${serverUrl}directories`, JSON.stringify(params), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
      .then((res) => {
        if (res.status === 200) {
          console.log(`[renamed catalog]  path: ${params.ancestorCatNames}, oldName: ${params.oldName}, newName: ${params.newName}`);
        } else {
          if (messager) {
            messager.error('目录重命名失败');
          }
          throw new Error(`Directories.rename(), 目录重命名失败, Bad Http Status: ${res}`);
        }
      })
      .catch((err) => {
        if (messager) {
          messager.error('目录重命名失败');
        }
        throw new Error(`Directories.rename(), 目录重命名失败, create Failed: ${err}`);
      });
  },

  /**
   * reorder: 重排序
   * @param {object} data 要传输个给后端的数据
   * data.task: `string`, 需要是`REORDER`
   * data.catName: `string` 移动的文件名
   * data.affectedCatalogs: `array` 受这次重排序影响的目录
   * 按接口要求, 需要把要移出文件的目录放前面, 要移入文件的目录放后面
   * @param {function} messager 通知器
   */
  async reorder(data, messager) {
    // 校验
    if (!data
      || data.task !== 'REORDER'
      || typeof data.catName !== 'string'
      || !Array.isArray(data.affectedCatalogs)
      || data.affectedCatalogs === 0
    ) {
      throw new Error(`Directories.reorder(), wrong parameters: ${JSON.stringify(data)}`);
    }

    data.affectedCatalogs.forEach((cat) => {
      if (new Set(cat.newCatOrder).size !== cat.newCatOrder.length) {
        throw new Error(`Directories.reorder(), Duplicate file names exist in newCatOrder: ${JSON.stringify(cat)}`);
      }
    });

    // 发送
    await axios.put(`${serverUrl}directories`, JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
      .then((res) => {
        if (res.status === 200) {
          console.log('[reorder catalog]');
        } else {
          if (messager) {
            messager.error('目录排序失败');
          }
          throw new Error(`Directories.reorder(), 目录排序失败, Bad Http Status: ${res}`);
        }
      })
      .catch((err) => {
        if (messager) {
          messager.error('目录排序失败');
        }
        throw new Error(`Directories.reorder(), 目录排序失败, reorder Failed: ${err}`);
      });
  },
};

export default Directories;
