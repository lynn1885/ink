import config from '@/config';
import $ from 'jquery';
import Files from '@/models/files';

const tools = {
  /**
  * 注意: 这校验方法需要和后端保持一致
  * isFileNameValid: 检测文件名是否合法
  * @param {string} fileName 文件名
  * @return {boolean | string} 合法返回true, 否则返回string 错误信息
  */
  isFileNameValid: (fileName) => {
    // 校验
    if (typeof fileName !== 'string') {
      console.error(`目录名不是string: ${fileName}`);
      return '笔记名不是string';
    }
    // 目录名不能为空
    if (fileName.length < 1) {
      return '笔记名不能为空';
    }
    // 目录名不能超过200个字符
    if (fileName.length > 200) {
      return '笔记名不能超过200个字符';
    }
    // 目录名不能为纯数字
    // 纯数字会和备份文件名冲突
    if (fileName.match(/^\d+$/)) {
      return '笔记名不能为纯数字';
    }
    // 目录名不能包含四字节字符
    // eslint-disable-next-line no-restricted-syntax
    for (const char of fileName) {
      if (char.codePointAt(0) > 0xFFFF) return '笔记名不能包含特殊字符';
    }

    // 目录名不能以 . 空格, tab, 换行 开头或结尾
    if (fileName[0] === '.'
      || fileName[fileName.length - 1] === '.'
      || fileName[0] === ' '
      || fileName[fileName.length - 1] === ' '
      || fileName[0] === '\t'
      || fileName[fileName.length - 1] === '\t'
      || fileName[0] === '\n'
      || fileName[fileName.length - 1] === '\n'
    ) {
      return '笔记名不能以 . 空格 tab 换行符 开头或结尾';
    }

    // 目录名不能包含 < > : " / \ | ? *
    const r = /[<>:"/\\|?*]/;
    if (fileName.match(r)) {
      return '笔记名不能包含 < > : " / \\ | ? * 等特殊字符';
    }

    // 目录名不能以__开头的同时以__结尾
    const trimedFileName = fileName.trim();
    if (trimedFileName[0] === '_' &&
      trimedFileName[1] === '_' &&
      trimedFileName[trimedFileName.length - 1] === '_' &&
      trimedFileName[trimedFileName.length - 2] === '_') {
      return '笔记名不能以__开头的同时以__结尾';
    }
    return true;
  },

  /**
   * 获取段落图片
   * @param {string} line1 第一行
   * @param {string} line2 第二行
   * @return {string[]} 图片地址数组, 如果没有解析是来图片地址, 则返回空数组
   */
  getParaImg(line1 = '', line2 = '') {
    let line = '';
    let imgs = [];
    line1 = line1.trim();
    line2 = line2.trim();
    if (line1 && line1.endsWith('图示') && line2 && line2.endsWith('|')) {
      line = line2;
    } else if (line1 && line1.endsWith('|')) {
      line = line1;
    } else {
      return imgs;
    }

    imgs = line.split('|').filter(imgStr => imgStr).map((imgStr) => {
      if (imgStr && imgStr.startsWith('![](')) {
        const imgName = imgStr.replace('![](', '').replace(')', '').replace('|', '');
        const imgSrc = config.server.staticImagesUrl + imgName;
        return imgSrc;
      }
      return '';
    }).filter(imgSrc => imgSrc);

    return imgs;
  },

  /**
   *
   * @param {string} text 要拷贝的文字
   */
  copyText(text) {
    const element = $(`<textarea>${text}</textarea>`); // This element cannot be display none or hidden
    $('body').append(element);
    element[0].select();
    document.execCommand('Copy');
    element.remove();
  },

  async readClipboardText() {
    try {
      // 使用await等待剪贴板文本读取完成
      const text = await navigator.clipboard.readText();
      // 成功读取剪贴板中的文本后，可以在这里处理文本
      return text;
    } catch (err) {
      // 处理错误情况
      console.error(`无法读取剪贴板中的文本：${err}`);
    }
  },

  indexMark: {
    1: '①',
    2: '②',
    3: '③',
    4: '④',
    5: '⑤',
    6: '⑥',
    7: '⑦',
    8: '⑧',
    9: '⑨',
    10: '⑩',
    11: '⑪',
    12: '⑫',
    13: '⑬',
    14: '⑭',
    15: '⑮',
    16: '⑯',
    17: '⑰',
    18: '⑱',
    19: '⑲',
    20: '⑳',
    21: '㉑',
    22: '㉒',
    23: '㉓',
    24: '㉔',
    25: '㉕',
    26: '㉖',
    27: '㉗',
    28: '㉘',
    29: '㉙',
    30: '㉚',
  },

  markIndex: {
    '①': 1,
    '②': 2,
    '③': 3,
    '④': 4,
    '⑤': 5,
    '⑥': 6,
    '⑦': 7,
    '⑧': 8,
    '⑨': 9,
    '⑩': 10,
    '⑪': 11,
    '⑫': 12,
    '⑬': 13,
    '⑭': 14,
    '⑮': 15,
    '⑯': 16,
    '⑰': 17,
    '⑱': 18,
    '⑲': 19,
    '⑳': 20,
    '㉑': 21,
    '㉒': 22,
    '㉓': 23,
    '㉔': 24,
    '㉕': 25,
    '㉖': 26,
    '㉗': 27,
    '㉘': 28,
    '㉙': 29,
    '㉚': 30
  },

  markEmpty: {
    '①': null,
    '②': null,
    '③': null,
    '④': null,
    '⑤': null,
    '⑥': null,
    '⑦': null,
    '⑧': null,
    '⑨': null,
    '⑩': null,
    '⑪': null,
    '⑫': null,
    '⑬': null,
    '⑭': null,
    '⑮': null,
    '⑯': null,
    '⑰': null,
    '⑱': null,
    '⑲': null,
    '⑳': null,
    '㉑': null,
    '㉒': null,
    '㉓': null,
    '㉔': null,
    '㉕': null,
    '㉖': null,
    '㉗': null,
    '㉘': null,
    '㉙': null,
    '㉚': null
  },

  // sleep
  async sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });
  },

  downloadArrayBuffer(buffer, fileName, fileType) {
    let mimeType = '';

    switch (fileType) {
      case 'zip':
        mimeType = 'application/zip';
        break;
      case 'docx':
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      default:
        break;
    }

    const blob = new Blob([buffer], { type: mimeType });

    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${fileName}.${fileType}`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  },

  /**
 * 文件数组转文件路径
 * @param {string[]} fileArr 文件数组, 必须有三个元素 ['a', 'b', 'c']
 * @returns {string} 拼接好的文件路径, 如'mine/basic/accumulation/accumulation.md'
 */
  fileArr2FilePath(fileArr) {
    if (!fileArr || !Array.isArray(fileArr) || fileArr.length !== 3) {
      return;
    }
    // eslint-disable-next-line consistent-return
    return `${fileArr[0]}/${fileArr[1]}/${fileArr[2]}/${fileArr[2]}.md`;
  },

  highlightText(cm, reg, className, maxLength, messager) {
    let searchedIndex = 0;

    const doc = cm.getDoc();
    const fullText = cm.getValue().split('\n');

    // 每一行
    let lineNum = 0;
    for (const lineText of fullText) {
      let match;
      reg.lastIndex = 0; // 重置reg状态，reg是有状态对象

      // 每行标记
      // eslint-disable-next-line no-cond-assign
      while ((searchedIndex <= maxLength) && (match = reg.exec(lineText))) {
        doc.markText(
          { line: lineNum, ch: match.index },
          { line: lineNum, ch: match.index + match[0].length },
          {
            className,
          }
        );
        searchedIndex += 1;
      }

      lineNum += 1;
    }

    if (searchedIndex >= maxLength) messager.warning(`超出最大检索个数: 最多${maxLength}个, ${className}`);
    // console.log('高亮个数：', searchedIndex);
  },

  unhighlightText(cm, className) {
    const doc = cm.getDoc();
    const allMarks = doc.getAllMarks();
    for (const mark of allMarks) {
      if (mark.className === className) mark.clear();
    }
  },

  /**
   * 读取文件
   * @param {str} filePath 文件路径
   * @param {function} $message 通知函数
   * @returns {null|string} 读取成功返回string，失败返回null
   */
  async loadFile(filePath, $message) {
    if (!filePath) {
      $message.error(`tools.loadFile(), illegal filePath: ${filePath}`);
    }
    let content = null;
    try {
      content = await Files.get(filePath, $message);
    } catch (error) {
      $message.error(`tools.loadFile(), load Failed: ${filePath}`);
      console.log(`tools.loadFile(), load failed: ${content}`, error);
    }
    return content;
  },

  /**
   * 保存文件
   * @param {object} content {filePath: ..., data: ...}
   * @param {function} messager 通知器
   */
  async saveFile(content, $message) {
    if (!content.path) {
      $message.error(`tools.saveFile(), illegal path: ${content.path}`);
    }

    if (typeof content.data !== 'string') {
      $message.error(`tools.saveFile(), non-string content: ${content.data}`);
    }

    try {
      await Files.update(content, $message);
    } catch (error) {
      $message.error(`tools.saveFile(), save failed: ${content}`);
      console.log(`tools.saveFile(), save failed: ${content}`, error);
    }
  }
};

export default tools;
