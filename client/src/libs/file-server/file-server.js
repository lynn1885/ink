import _ from 'lodash';
import Directories from './models/directories';
import Files from './models/files';
import Images from './models/images';

// config
const defaultConfig = {
  autoSaveInterval: 30 * 1000, // 自动存储间隔: 单位ms
  messager: null, // 信息提示对象. 有时file-server需要给用户弹出某些提示信息
  serverUrl: null,
  autoFoldDelay: -1, // 自动折叠延迟. -1表示没有延迟
};
const minAutoSaveInterval = 10 * 1000; // 最小自动存储间隔

// export
export default function (editor, config) {
  // config
  config = _.merge(defaultConfig, config);
  if (config.autoSaveInterval < minAutoSaveInterval) {
    console.warn(`file-server: you set a short auto save interval, 
      This may cause performance degradation: ${config.autoSaveInterval}
      interval will be reset to ${minAutoSaveInterval} ms`);
    config.autoSaveInterval = minAutoSaveInterval;
  }
  if (!config.serverUrl) {
    throw new Error(`file server, invalid serverUrl: ${config.serverUrl}`);
  }
  if (!config.staticResUrl) {
    throw new Error(`file server, invalid staticResUrl: ${config.staticResUrl}`);
  }

  // add properties to editor.fileServer
  editor.fileServer = {
    autoSaveInterval: config.autoSaveInterval,
    isFileContentChanged: false,
    curFilePath: null,
    curFileDir: null,
    autoSaveTimer: null,
    serverUrl: config.serverUrl,
    staticResUrl: config.staticResUrl,
    /**
     * loadFile: 加载文件
     * @param {str} filePath 要加载的文件路径
     */
    async loadFile(filePath) {
      if (!filePath) {
        throw new Error(`loadFile(), illegal filePath: ${filePath}`);
      }
      if (this.isFileContentChanged) {
        console.warn(`loadFile(), The last document was not saved: ${this.curFilePath}`);
      }
      if (this.autoSaveTimer) {
        this.turnOffAutoSave();
      }
      this.curFilePath = filePath;
      this.curFileDir = this.curFilePath.replace(/\/[^/]+?.md/, '/');

      let fileContent;
      await Files.get(config.serverUrl, filePath)
        .then((res) => {
          if (res.status === 200) {
            if (typeof res.data !== 'string') {
              res.data = JSON.stringify(res.data);
            }
            fileContent = res.data;
          } else {
            if (config.messager) {
              config.messager.error(`loadFile(): Bad HTTP status: ${res}`);
            }
            throw new Error(`loadFile(): Bad HTTP status: ${res}`);
          }
        })
        .catch((err) => {
          if (config.messager) {
            config.messager.error(`loadFile failed: ${err}\n path: ${filePath}`);
          }
          throw new Error(`loadFile failed: ${err}\n path: ${filePath}`);
        });

      editor.cm.getDoc().setValue(fileContent || '');
      editor.cm.scrollIntoView();
      this.isFileContentChanged = false;
      editor.cm.getDoc().clearHistory();
      const waitFoldPath = this.curFilePath;
      this.turnOnAutoSave();
      this._autoFold(waitFoldPath);
      this._markCmdLine();
    },

    /**
     * saveFile: 异步保存文件
     * @param {*} triggerType 触发保存的类型. 可取值:
     * 'MANUAL': 用户手动保存
     * 'AUTO': 触发自动保存(默认)
     * 'CLOSE': 关闭当前文档
     * 'BEFOREUNLOAD': 网页卸载前自动保存
     * @param {bool} isShowSuccessInfo 保存成功后是否显示保存成功信息
     */
    async saveFile(triggerType, isShowSuccessInfo) {
      const filePath = this.curFilePath;
      if (!filePath) {
        throw new Error(`file-server, saveFile(), invalid filePath: ${filePath}`);
      }
      if (!triggerType) {
        triggerType = 'AUTO';
      }
      // 记录这次编辑位置, 方便下次打开
      const cursor = editor.cm.getCursor();
      if (triggerType !== 'AUTO' && cursor && typeof cursor.line === 'number') {
        const lastLineNum = editor.cm.getDoc().lastLine();
        let lastLineText = editor.cm.lineInfo(lastLineNum).text;
        const oldLastLineText = lastLineText;
        const cmd = `%auto-expand-line-${cursor.line}%`;
        if (editor.isThisLineCmdLine(lastLineNum, lastLineText)) { // 最后一行是指令行: 添加指令或更新指令
          const matchRes = lastLineText.match(/%auto-expand-line-(\w+)%/);
          if (matchRes) { // 修改指令
            lastLineText = lastLineText.replace(/%auto-expand-line-\w+%/, cmd);
            this._updateCmdLine(
              cursor,
              lastLineText,
              { line: lastLineNum, ch: 0 },
              { line: lastLineNum, ch: oldLastLineText.length },
            );
          } else { // 添加指令
            this._updateCmdLine(
              cursor,
              ` ${cmd}`,
              { line: lastLineNum, ch: lastLineText.length },
              { line: lastLineNum, ch: lastLineText.length },
            );
          }
        } else { // 最后一行不是指令行: 添加指令行, 添加指令
          this._updateCmdLine(
            cursor,
            `\n# ${cmd}`,
            { line: lastLineNum, ch: lastLineText.length },
            { line: lastLineNum, ch: lastLineText.length },
          );
        }
      }
      // 获取文件信息
      const data = editor.cm.getValue();

      // 保存
      this.isFileContentChanged = false;
      const content = JSON.stringify({
        path: filePath,
        data,
      });
      await Files.update(config.serverUrl, content)
        .then((res) => {
          if (res.status === 200) {
            console.log(`file updated: ${filePath}`);
            if (isShowSuccessInfo && config.messager) {
              const pathParts = filePath.split('/');
              const fileName = pathParts[pathParts.length - 1];
              config.messager.success(`updated: ${fileName}`);
            }
          } else {
            if (config.messager) {
              config.messager.error(`File.update(), Bad Http Status: ${res}`);
            }
            throw new Error(`File.update(), Bad Http Status: ${res}`);
          }
        })
        .catch((err) => {
          if (config.messager) {
            config.messager.error(`File.update(), Update Failed: ${err}`);
          }
          throw new Error(`File.update(), Update Failed: ${err}`);
        });
    },

    /**
     * getCatalog: 获取笔记目录
     */
    async getCatalog() {
      let catalog;
      await Directories.get(config.serverUrl)
        .then((res) => {
          if (res.status === 200) {
            catalog = res.data;
          } else {
            if (config.messager) {
              config.messager.error(`Directories.get(), Bad HTTP status: \n', ${res.status}`);
            }
            throw new Error(`Directories.get(), Bad HTTP status: \n', ${res.status}`);
          }
        })
        .catch((err) => {
          if (config.messager) {
            config.messager.error(`Directories.get() Error: ${err}`);
          }
          throw new Error(`Directories.get() Error: ${err}`);
        });
      return catalog;
    },

    /**
     * uploadImage: 上传图片
     * @param {formData} formData 图片对象
     */
    async uploadImage(formData) {
      if (!formData) {
        throw new Error(`uploadImage, illegal formData: ${formData}`);
      }

      let data;
      await Images.upload(this.serverUrl, formData)
        .then((res) => {
          if (res.status === 200) {
            ({ data } = res);
            console.log('image uploaded');
          } else {
            if (config.messager) {
              config.messager.error(`Images.upload(), Bad Http Status: ${res}`);
            }
            throw new Error(`Images.upload(), Bad Http Status: ${res}`);
          }
        })
        .catch((err) => {
          if (config.messager) {
            config.messager.error(`Images.upload(), Update Failed: ${err}`);
          }
          throw new Error(`Images.upload(), Update Failed: ${err}`);
        });

      return data;
    },

    /**
     * turnOnAutoSave(): 开启自动保存
     */
    turnOnAutoSave() {
      if (this.autoSaveTimer) {
        throw new Error(`Another auto save timer is running: ${this.autoSaveTimer}`);
      }
      if (this.autoSaveInterval > 0) {
        this.autoSaveTimer = setInterval(async () => {
          if (this.isFileContentChanged) {
            await this.saveFile('AUTO');
          }
        }, this.autoSaveInterval);
        console.log(`start auto save: ${this.curFilePath}, interval: ${this.autoSaveInterval}`);
      }
    },

    /**
     * turnOffAutoSave(): 关闭自动保存
     */
    turnOffAutoSave() {
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
        this.autoSaveTimer = null;
        console.log(`close auto save: ${this.curFilePath}`);
      }
    },

    /**
     * autoFold: 自动折叠
     * 默认会折自动叠到标题2
     * 可以通过在最后一行添加 %no-auto-fold% 指令来阻止自动折叠, 注意最后一行必须以%开头
     * 可以通过在最后一行添加 %auto-expand-line-行号%指令, 来标记折叠后自动展开至某一行, 方便用户接续工作
     * @param {str} waitFoldPath 等待展开的路径. 因为展开可能会有一个几百ms的延迟, 这几百ms中, 用户可能已经离开了当前文件
     * 只有用户没有离开当前文件时, 我们才会执行展开操作. 这个参数用于判断用户是否已经离开了当前文件
     */
    _autoFold(waitFoldPath) {
      // check & prepare
      if (typeof waitFoldPath !== 'string') {
        console.error(`waitFoldPath is not a string: ${waitFoldPath}`);
      }

      // 遇到%no-auto-fold%则不折叠
      const ln = editor.cm.getDoc().lastLine();
      const lt = editor.cm.lineInfo(ln).text;
      if (!editor.isThisLineCmdLine(ln, lt) || !lt.includes('%no-auto-fold%')) {
        if (config.autoFoldDelay >= 0) {
          if (config.autoFoldDelay === 0) {
            fold();
          } else {
            setTimeout(() => {
              if (this.curFilePath === waitFoldPath) {
                fold();
              }
            }, config.autoFoldDelay);
          }
        }
      }

      // 主折叠逻辑
      function fold() {
        editor.foldHeaderTo(2);
        const lastLineNum = editor.cm.getDoc().lastLine();
        const lastLineText = editor.cm.lineInfo(lastLineNum).text;
        if (editor.isThisLineCmdLine(lastLineNum, lastLineText)) { // 表示这一行(可能)是命令
          const matchRes = lastLineText.match(/%auto-expand-line-(\w+)%/); // 遇到%auto-expand-line-行号%命令则自动展开
          if (matchRes) {
            const targetLineNum = Number(matchRes[1]);
            const ancestors = editor.getHeaderAncestors({ line: targetLineNum, ch: 0 });
            if (ancestors.length > 0) {
              ancestors.reverse();
              for (let i = 0; i < ancestors.length; i += 1) {
                editor.unfold(ancestors[i].headerLineNum);
              }
              const nearestHeader = ancestors[ancestors.length - 1];
              let targetChar = 0;
              if (nearestHeader.isCursorInThisLine) {
                targetChar = nearestHeader.headerLv + 1;
              }
              moveTo(targetLineNum, targetChar);
            } else {
              moveTo(targetLineNum, 0);
            }
          }
        }
      }
      // 工具函数: 展开后移动鼠标到展开位置
      function moveTo(line, ch) {
        setTimeout(() => {
          editor.cm.focus();
          editor.cm.setCursor({
            line,
            ch,
          });
          editor.cm.scrollIntoView(null, 300);
        }, 100);
      }
    },

    /**
     * _updateCmdLine: 更新命令行文本
     * @param {pos} cursor 更新前光标位置, 更新后将还原光标至原来位置
     * @param {str} cmd 命令
     * @param {pos} from 更新起始位置
     * @param {pos} to 更新结束位置
     */
    _updateCmdLine(cursor, cmd, from, to) {
      const doc = editor.cm.getDoc();
      doc.replaceRange(
        cmd,
        from,
        to,
      );
      doc.setCursor(cursor);
    },

    /**
     * _markCmdLine: 内部方法. 标记命令行, 给命令行添加class
     */
    _markCmdLine() {
      const doc = editor.cm.getDoc();
      const lastLineNum = doc.lastLine();
      if (editor.isThisLineCmdLine(lastLineNum)) {
        doc.addLineClass(lastLineNum, 'text', 'line-cm-cmd');
      }
    },
  };

  // 手动保存快捷键
  editor.cm.addKeyMap({
    'Ctrl-S': async (cm) => {
      await editor.fileServer.saveFile('MANUAL', true);
    },
  });

  // 给editor添加世界
  editor.cm.on('change', () => {
    editor.fileServer.isFileContentChanged = true;
  });

  // 网页卸载前自动保存
  window.onbeforeunload = (event) => {
    if (editor.fileServer.isFileContentChanged) {
      editor.fileServer.saveFile('BEFOREUNLOAD', true);
      event.returnValue = 'has unsaved file!';
      return 'has unsaved file!';
    }
  };
}
