<template>
  <div id="editor" ref="editor" v-show="isFileLoaded"></div>
</template>

<script>
import Editor from '@/libs/editor/editor';
import inkImage from '@/libs/editor/ink-image'; // 插件
import inkMath from '@/libs/editor/ink-math';
import inkFold from '@/libs/editor/ink-fold';
import inkKeyMap from '@/libs/editor/ink-key-map';
import inkFlexibleCursor from '@/libs/editor/ink-flexible-cursor';
import inkFlexibleCursorLineChar from '@/libs/editor/ink-flexible-cursor-line-char';
import inkHeaderManager from '@/libs/editor/ink-header-manager';
import inkLineReplace from '@/libs/editor/ink-line-replace';
import Files from '@/models/files';
import Images from '@/models/images';
import UserConfig from '@/models/user-config';
import '@/themes/craft/index.scss';
import config from '@/config';

export default {
  name: 'editor',
  data() {
    return {
      editor: null, // 编辑器对象
      autoSaveTimer: null, // 文件自动保存计时器
      isFileLoaded: false, // 文件是否加载完毕, 文件加载完毕时, 才会show编辑器
      isFileContentChanged: false, // 当前文件内容是否改变
      curFileDir: null, // 当前文件路径, 不含最后一个文件. 如: a/b/c/
      curFilePath: null, // 当前文件路径, 含最后一个文件. 如: a/b/c/some.md. 在打开文件时记录
      autoSaveInterval: 40 * 1000, // 自动存储间隔: 单位ms
      autoFoldDelay: 200, // auto fold document after openning. unit: ms. no delay: -1
      autoFoldLv: 2, // 自动折叠到哪个等级
      minAutoSaveInterval: 10 * 1000, // 最小自动存储间隔
    };
  },

  methods: {
    // 初始化编辑器
    async init() {
      // 尝试从后端读取配置
      let inkLineReplaceConfig;
      await UserConfig.get(['plugins', 'inkLineReplace'], this.$message)
        .then((data) => { inkLineReplaceConfig = data; })
        .catch(() => { inkLineReplaceConfig = {}; });

      // 给editor添加插件
      this.editor = new Editor(this.$refs.editor);
      this.editor.use(inkKeyMap);
      this.editor.use(inkFold);
      this.editor.use(inkFlexibleCursor);
      this.editor.use(inkFlexibleCursorLineChar);
      this.editor.use(inkHeaderManager);
      this.editor.use(inkLineReplace, inkLineReplaceConfig);
      this.editor.use(inkImage, {
        upload: Images.upload, // 用于上传图片的函数, 会把formData, messager传入这个函数. 需要是个异步函数
        messager: this.$message,
      });
      this.editor.use(inkMath);

      // 给editor添加快捷键
      this.editor.cm.addKeyMap({
        'Ctrl-S': async () => {
          await this.saveFile('MANUAL', true);
        },
      });

      // 给editor添加事件, 属性, 方法
      this.editor.runCommand = this.runCommand;
      this.editor.fileServer = {
        serverUrl: config.server.serverUrl,
        staticImageUrl: config.server.staticImageUrl, // 图片服务器url, 上传图片后, 从这个地址获取图片
        curFileDir: null,
        curFilePath: null,
      };
      this.editor.cm.on('change', () => {
        this.isFileContentChanged = true;
      });

      // 上传editor到vuex
      this.$store.commit('updateEditor', this.editor);
    },

    /**
     * runCommand: 执行命令 这是editor组件对外暴露的唯一接口, 会挂载到this.editor上
     * 所有外部可使用的操作, 都通过这个api进行. 受这个api的集中管理, 来降低耦合性
     * 这些操作包括: 保存当前文件, 清理时钟, 打开新文件; 清理编辑器; 触发保存等一系列操作
     * @param {string} command 指令名
     * @param {any} info 提供的额外指令信息, 有些指令会要求传入这些信息
     */
    async runCommand(command, info) {
      // 校验
      if (!command || typeof command !== 'string') {
        console.warn(`editor.runCommand(), 参数错误, command为空或不是string: ${command}`);
        return;
      }

      // 禁止使用目录
      this.$store.commit('updateIsProhibitOperateCat', true);

      // 指令: 清空编辑器. 清空编辑器不会保存当前文件未保存的内容, 也不会删除后台的物理文件
      if (command === 'CLEAN') {
        this.cleanEditor();

      // 指令: 保存
      } else if (command === 'SAVE') {
        // 保存
        if (typeof info === 'object') {
          await this.saveFile(info.triggerType, info.isShowSuccessInfo);
        } else {
          await this.saveFile();
        }

      // 指令: 打开新文件
      } else if (command === 'OPENFILE') {
        if (typeof info !== 'string') {
          console.error(`runCommand(): 参数错误. OPEN指令需要传入要打开的文件路径作为第二个参数: ${info}`);
          return;
        }
        try {
          if (this.isFileContentChanged) {
            this._turnOffAutoSave();
            await this.saveFile('CLOSE', true);
          }
          await this._loadFile(info);
        } catch (e) {
          console.error(e);
        }
        this.isFileLoaded = true;
      }

      // 可以使用目录
      this.$store.commit('updateIsProhibitOperateCat', false);
    },

    /**
     * _loadFile: 从服务器加载文件. 是供openFile()调用的内部函数, 在别处不会被调用
     * @param {str} filePath 要加载的文件路径
     */
    async _loadFile(filePath) {
      if (!filePath) {
        throw new Error(`loadFile(), illegal filePath: ${filePath}`);
      }
      this.$store.commit('updateCurFilePath', filePath);
      if (this.autoSaveTimer) {
        this._turnOffAutoSave();
      }
      this.curFilePath = filePath;
      this.curFileDir = this.curFilePath.replace(/\/[^/]+?.md/, '/');
      this.editor.fileServer.curFilePath = this.curFilePath;
      this.editor.fileServer.curFileDir = this.curFileDir;
      const fileContent = await Files.get(filePath, this.$message);
      this.editor.cm.getDoc().setValue(fileContent || '');
      this.editor.cm.scrollIntoView();
      this.isFileContentChanged = false;
      this.editor.cm.getDoc().clearHistory();
      this._turnOnAutoSave();
      this._autoFold(this.curFilePath);
      this._markCmdLine();
    },

    /**
     * saveFile: 保存文件
     * @todo
     * You must call refresh() after setValue().
     * However, you must use setTimeout to postpone the refresh() to after
     * CodeMirror/Browser has updated the layout according to the new content
     * Codemirror editor is not loading content until clicked
     * but I still find that, if you call this.editor.cm.refresh() after timeout 0
     * then when you click the editor, you will get an error:
     * Uncaught DOMException:
     * Failed to execute 'setEnd' on 'Range': The offset 39 is larger than the node's length (0).
     * if I call this.editor.cm.refresh() when timeout 1000, no error. don't know why
     * @param {string} triggerType 触发保存的类型. 不同的类型对应不同的操作. 可取值:
     * 'MANUAL': 用户手动保存(ctrl + s)
     * 'AUTO': 时钟触发自动保存(默认)
     * 'CLOSE': 关闭当前文档触发自动保存
     * 'CATALOG': 由catalog触发, 可能是因为新建, 删除, 重命名, 重排序目录引发的
     * 'BEFOREUNLOAD': 网页卸载前自动保存
     * 默认: 'AUTO'
     * @param {boolean} isShowSuccessInfo 保存成功后是否显示保存成功信息
     */
    async saveFile(triggerType, isShowSuccessInfo) {
      const filePath = this.curFilePath;
      if (!filePath) {
        this.$message.error('save file: invalid filePath');
        throw new Error(`file-server, saveFile(), invalid filePath: ${filePath}`);
      }
      if (!triggerType) {
        triggerType = 'AUTO';
      }
      // 在命令行记录这次编辑位置, 方便下次打开
      const cursor = this.editor.cm.getCursor();
      if (triggerType !== 'AUTO' && cursor && typeof cursor.line === 'number') {
        const lastLineNum = this.editor.cm.getDoc().lastLine();
        let lastLineText = this.editor.cm.lineInfo(lastLineNum).text;
        const oldLastLineText = lastLineText;
        const cmd = `%auto-expand-line-${cursor.line}%`;
        if (this.editor.isThisLineCmdLine(lastLineNum, lastLineText)) { // 最后一行是指令行: 添加指令或更新指令
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
      const data = this.editor.cm.getValue();

      // 保存
      // 这里之所以把this.isFileContentChanged放在一个异步操作中
      // 是因为保存时, 我们可能会自动修改文本的最后一行(指令行)
      // 这个修改操作会触发editor的change监听, 而change监听中, 会把this.isFileContChanged变为true
      // 这里把this.isFileContentChanged = false;放在下一轮事件循环中
      // 这样就能保证, this.isFileContentChanged = false;会在editor的change事件后触发
      // 即, 这样可以保证, 自动修改完指令行之后, this.isFileContentChanged还是false
      // 但这样也可能导致 [保存时自动修改指令行之后, 下一轮事件循环开始标记isFileContentChanged为false] 这之间的操作丢失
      await new Promise(resolve => setTimeout(() => {
        this.isFileContentChanged = false;
        resolve();
      }, 0));

      const content = {
        path: filePath,
        data,
      };

      await Files.update(content, this.$message, isShowSuccessInfo);
    },

    // 清理编辑器
    cleanEditor() {
      this.curFileDir = null;
      this.curFilePath = null;
      this._turnOffAutoSave();
      const doc = this.editor.cm.getDoc();
      doc.setValue('');
      doc.clearHistory();
      this.isFileContentChanged = false;
      this.isFileLoaded = false;
    },

    /**
     * 事件: 卸载网页前自动保存
     */
    onbeforeunload(event) {
      console.log('保存笔记');
      if (this.isFileContentChanged && this.curFilePath) {
        this.saveFile('BEFOREUNLOAD', true);
        event.returnValue = 'has a unsaved file!';
        return 'has a unsaved file!';
      }
      return null;
    },

    /**
     * _turnOffAutoSave(): 关闭自动保存. 内部函数
     */
    _turnOffAutoSave() {
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
        this.autoSaveTimer = null;
        console.log(`[close auto save]: ${this.curFilePath}`);
      }
    },

    /**
     * _turnOnAutoSave(): 开启自动保存. 内部函数
     */
    _turnOnAutoSave() {
      if (this.autoSaveTimer) {
        throw new Error(`Another auto save timer is running: ${this.autoSaveTimer}`);
      }
      if (this.autoSaveInterval > 0) {
        this.autoSaveTimer = setInterval(async () => {
          if (this.isFileContentChanged) {
            await this.saveFile('AUTO');
          }
        }, this.autoSaveInterval);
        console.log(`[start auto save]: ${this.curFilePath}, interval: ${this.autoSaveInterval / 1000} seconds`);
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
      const ln = this.editor.cm.getDoc().lastLine();
      const lt = this.editor.cm.lineInfo(ln).text;
      if (!this.editor.isThisLineCmdLine(ln, lt) || !lt.includes('%no-auto-fold%')) {
        if (this.autoFoldDelay >= 0) {
          if (this.autoFoldDelay === 0) {
            fold();
          } else {
            setTimeout(() => {
              if (this.curFilePath === waitFoldPath) {
                fold(this.editor, this.autoFoldLv);
              }
            }, this.autoFoldDelay);
          }
        }
      }

      // 主折叠逻辑
      function fold(editor, autoFoldLv) {
        editor.foldHeaderTo(autoFoldLv);
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
              _moveTo(editor, targetLineNum, targetChar);
            } else {
              _moveTo(editor, targetLineNum, 0);
            }
          }
        }
      }
      // 工具函数: 展开后移动鼠标到展开位置
      function _moveTo(editor, line, ch) {
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
      const doc = this.editor.cm.getDoc();
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
      const doc = this.editor.cm.getDoc();
      const lastLineNum = doc.lastLine();
      if (this.editor.isThisLineCmdLine(lastLineNum)) {
        doc.addLineClass(lastLineNum, 'text', 'line-cm-cmd');
      }
    },
  },

  async mounted() {
    // 监听初始化编辑器
    await this.init();
    // 设置网页卸载前自动保存
    window.addEventListener('beforeunload', this.onbeforeunload);
  },
};

</script>
