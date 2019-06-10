import axios from 'axios';
import config from '@/config';

const { serverUrl } = config.server;

const Files = {
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
          messager.error('文件保存失败: Update Failed');
        }
        throw new Error(`File.update(), Update Failed: ${err}`);
      });
  },
};

export default Files;
