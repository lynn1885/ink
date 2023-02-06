// All interface functions must throw an error when meeting an error
// To prevent the code from continuing to execute
// Here, errors are captured in catch statement only to inform the user.

import axios from 'axios';
import config from '@/config';

const { serverUrl } = config.server;

const Files = {
  /**
   * 打开文件
   * @param {string} path 要打开的文件路径
   * @param {function} messager 通知器
   */
  async open(path, messager) {
    await axios.get(`${serverUrl}open-file-default`, {
      params: { path },
    })
      .then((res) => {
        if (res.status === 200) {
          // messager.success('打开文件成功');
        } else {
          if (messager) {
            messager.error(`openFile(): Bad HTTP status: ${res}`);
          }
          throw new Error(`openFile(): Bad HTTP status: ${res}`);
        }
      })
      .catch((err) => {
        if (messager) {
          messager.error(`openFile failed: ${err}\n path: ${path}`);
        }
        throw new Error(`openFile failed: ${err}\n path: ${path}`);
      });
  },
  /**
   * 获取文件
   * @param {string} path 要打开的文件路径
   * @param {function} messager 通知器
   * @returns {string} 文件内容
   */
  async get(path, messager) {
    let fileContent = null;

    await axios.get(`${serverUrl}files`, {
      params: { path },
    })
      .then((res) => {
        if (res.status === 200) {
          if (typeof res.data !== 'string') {
            res.data = JSON.stringify(res.data);
          }
          fileContent = res.data;
        } else {
          if (messager) {
            messager.error(`loadFile(): Bad HTTP status: ${res}`);
          }
          throw new Error(`loadFile(): Bad HTTP status: ${res}`);
        }
      })
      .catch((err) => {
        if (messager) {
          messager.error(`loadFile failed: ${err}\n path: ${path}`);
        }
        throw new Error(`loadFile failed: ${err}\n path: ${path}`);
      });
    return fileContent;
  },

  /**
   * 保存文件
   * @param {object} content {filePath: ..., data: ...}
   * @param {function} messager 通知器
   * @param {boolean} isShowSuccessInfo 保存成功时是否显示通知
   */
  async update(content, messager, isShowSuccessInfo) {
    await axios.put(`${serverUrl}files/`, JSON.stringify(content), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
      .then((res) => {
        if (res.status === 200) {
          console.log(`[file updated] ${content.path}`);
          if (isShowSuccessInfo && messager) {
            const pathParts = content.path.split('/');
            const fileName = pathParts[pathParts.length - 1];
            messager.success(`updated: ${fileName}`);
          }
        } else {
          if (messager) {
            messager.error('文件保存失败: Bad Http Status');
          }
          throw new Error(`File.update(), Bad Http Status: ${res}`);
        }
      })
      .catch((err) => {
        if (messager) {
          messager.error(`文件保存失败: Update Failed${err}`);
        }
        throw new Error(`File.update(), Update Failed: ${err}. 文件保存失败: 可能是文件体积超限, 或服务器出现了问题. 请先妥善复制保管好您的笔记`);
      });
  },

  /**
 * 获取文件
 * @param {String} fromPath 从哪个文件发起的搜索
 * @param {String} searchPath 搜索哪个路径
 * @param {String} searchText 搜索的文字
 * @param {String} searchedTextClass 给搜索到的文字添加的类名
 * @param {Boolean} isRegExp 是否使用正则
 * @param {Boolean} isSensitiveToCase 是否对大小写敏感
 * @param {Function} messager 通知器
 * @returns {Object} 搜索的内容
 */
  async searchAllFiles({
    fromPath, searchPath, searchText, searchedTextClass, isRegExp, isSensitiveToCase, specifiedSearchFolder, specifiedSearchExtName, nearDistance, messager
  }) {
    let searchRes = null;

    await axios.get(`${serverUrl}search-all-files`, {
      params: {
        fromPath,
        searchPath,
        searchText,
        searchedTextClass,
        isRegExp,
        isSensitiveToCase,
        nearDistance,
        specifiedSearchFolder,
        specifiedSearchExtName,
      },
    })
      .then((res) => {
        if (res.status === 200) {
          searchRes = res.data;
        } else {
          if (messager) {
            messager.error(`searchAllFiles(): Bad HTTP status: ${res}`);
          }
          throw new Error(`searchAllFiles(): Bad HTTP status: ${res.data}`);
        }
      })
      .catch((err) => {
        if (messager) {
          messager.error(`searchAllFiles failed: ${err}`);
        }
        throw new Error(`searchAllFiles failed: ${err}`);
      });
    return searchRes;
  },

  /**
   * get all files info
   * @param {Function} messager 通知器
   */
  async getAllFilesInfo(messager) {
    let fileInfo = null;

    await axios.get(`${serverUrl}get-all-files-info`)
      .then((res) => {
        if (res.status === 200) {
          fileInfo = res.data;
        } else {
          if (messager) {
            messager.error(`getAllFilesInfo(): Bad HTTP status: ${res}`);
          }
          throw new Error(`getAllFilesInfo(): Bad HTTP status: ${res}`);
        }
      })
      .catch((err) => {
        if (messager) {
          messager.error(`getAllFilesInfo failed: ${err}`);
        }
        throw new Error(`getAllFilesInfo failed: ${err}`);
      });
    return fileInfo;
  },

  /**
   * 导出文件
   * @param {[string]} path 要导出的文件路径
   * @param {string} type 要导出的文件类型, 默认zip
   * @param {function} messager 通知器
   */
  async exportNote(path, type, messager) {
    let zipData;
    await axios.get(`${serverUrl}export-note`, {
      params: { path, type },
      responseType: 'arraybuffer', // 一定要加上
    })
      .then((res) => {
        if (res.status === 200) {
          zipData = res.data;
        } else {
          if (messager) {
            messager.error(`导出笔记失败: exportNote(): Bad HTTP status: ${res}`);
          }
          throw new Error(`exportNote(): Bad HTTP status: ${res}`);
        }
      })
      .catch((err) => {
        if (messager) {
          messager.error(`exportNote failed: ${err}`);
        }
        throw new Error(`导出笔记失败: exportNote failed: ${err}`);
      });
    return zipData;
  },

  /**
   * 导出文件
   * @param {object} formData
   * @param {function} messager 通知器
   */
  async importNote(formData, messager) {
    let zipData;
    await axios.post(`${serverUrl}import-note`, formData, {
      headers: { 'content-type': 'multipart/form-data' },
    })
      .then((res) => {
        if (res.status === 200) {
          // zipData = res.data;
        } else {
          if (messager) {
            messager.error(`导入笔记失败: exportNote(): Bad HTTP status: ${res}`);
          }
          throw new Error(`exportNote(): Bad HTTP status: ${res}`);
        }
      })
      .catch((err) => {
        console.log(err.request.responseText);
        if (messager) {
          messager.error(`exportNote failed: ${err.request.responseText}`);
        }
        throw new Error(`导入笔记失败: exportNote failed: ${err.request.responseText}`);
      });
    return zipData;
  },
};

export default Files;
