import _ from 'lodash';
import CodeMirror from 'codemirror/lib/codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/markdown/markdown'; // language mode: mark down
import 'codemirror/mode/javascript/javascript'; // language mode: js
import 'codemirror/mode/clike/clike'; // language mode: c, c++, oc, java
import 'codemirror/mode/python/python'; // language mode: python
import 'codemirror/mode/php/php'; // language mode: php
import 'codemirror/mode/shell/shell'; // language mode: shell
import 'codemirror/mode/css/css'; // language mode: css
import 'codemirror/addon/fold/foldcode'; // fold code
import 'codemirror/mode/sql/sql'; // language mode: sql
import 'codemirror/addon/fold/markdown-fold'; // fold code method for markdown
import 'codemirror/addon/display/autorefresh'; // autorefresh
import 'codemirror/addon/mode/simple'; // mode maker
import 'codemirror/addon/mode/loadmode'; // load mode
import 'codemirror/theme/paraiso-light.css'; // 主题包
// import 'codemirror/addon/edit/closebrackets'; // close brackets 好像不兼容markdown
// import 'codemirror/addon/hint/show-hint'; // hint逻辑, 使用hint时必须引入
// import 'codemirror/addon/hint/show-hint.css'; // hint样式, 使用hint时必须引入
// import 'codemirror/addon/hint/javascript-hint'; // 针对具体语言的hint包
// import 'codemirror/keymap/vim';

export default class {
  /**
   * @param {dom} el 原生dom元素, 会在这个元素中初始化editor
   * @param {Object} config config object
   * `config.message`: `Object` messager, 用于当editor出现问题时, 以ui的形式向用户发送信息.
   * 对象中需要包含如下四个函数: success(), info(), warning(), error(), 向函数中传入信息会以ui的形式提示用户
   * `config.cm`: `Object` CodeMirror()函数接收的配置项, 只有部分参数有效
   */
  constructor(el, config) {
    config = _.merge({
      cm: {},
    }, config);
    this.el = el;
    this.lines = [];
    this.messager = config.messager || {
      success() {}, info() {}, warning() {}, error() {},
    };
    this.cm = this._init(el, config.cm);
    this.cm.on('change', this._onChange);
    this.cm.on('renderLine', this._onRenderLine.bind(this)); // 需要固定下这个函数的this指针
  }

  /**
   * _init: 初始化editor
   * @param {HTMLElement} el editor元素
   * @param {object} config 用户配置对象
   */
  _init(el, config) { // eslint-disable-line class-methods-use-this
    const mergedConfig = {
      mode: {
        name: 'text/markdown',
        highlightFormatting: true, // https://.net/mode/markdown/
        xml: false, // close highlight xml
      },
      theme: 'paraiso-light', // editor theme, mark sure that you have imported this theme
      tabSize: 4,
      smartIndent: false, // 并不怎么smart
      indentUnit: 4,
      inputStyle: 'contenteditable',
      addModeClass: true,
      lineWrapping: true, // auto line wrapping
      autoRefresh: true, // display/autorefresh.js
      lineNumbers: false, // 和主题不兼容
      // autoCloseBrackets: true,
      // scrollbarStyle: null, // show scroll bar
      // autoCloseBrackets: true, // auto close brackets
      // keyMap: 'vim', // 这个vim不兼容中文输入法, 因为笔记中要大量输入中文, 所以默认不开启
      // 这个选项只有在第1次加载codemirror的时候会生效
      // 切换codemirror中doc的内容时不会生效. 所以关闭
      // 自己在file-server插件中实现了一个
      // autofocus: true,
      // 此外, markdown ### , 1. 这样的标记后必须带上空格, 许多api依赖于这种格式
    };

    if (typeof config.lineNumbers === 'boolean') {
      mergedConfig.lineNumbers = config.lineNumbers;
    }
    if (config.tabSize) {
      mergedConfig.tabSize = config.tabSize;
    }
    if (config.indentUnit) {
      mergedConfig.indentUnit = config.indentUnit;
    }
    return CodeMirror(el, mergedConfig);
  }

  /**
   * _onChange: event, cm对象change时触发
   * @param {cm} cm cm
   * @param {*} change change
   */
  _onChange() { // eslint-disable-line class-methods-use-this
    // console.log(change);
    // this.isFileContentChanged = true;
    // window.focusedLine = change.from.line; // no!! use vuex;
    // localStorage.setItem('mdText', cm.getValue());
  }

  /**
   * _onRenderLine: event, cm对象render时触发
   * @param {cm} cm
   * @param {line} line
   * @param {HTMLElement} el
   */
  // Fired whenever a line is (re-)rendered to the DOM.
  // Fired right after the DOM element is built, before it is added to the document.
  _onRenderLine(cm, line, el) { // eslint-disable-line class-methods-use-this
    const t1 = new Date();
    const lineInfo = cm.lineInfo(line);
    const curLineNum = lineInfo.line;
    let curLineHeader;

    // add class for header line
    if (el.querySelector('.cm-formatting-header')) {
      const headMatchRes = line.text.match(/^(#+)\s/);
      if (headMatchRes) {
        el.classList.add('line-cm-header');
        el.classList.add(`line-cm-header-${headMatchRes[1].length}`);
        curLineHeader = headMatchRes[1].length;
      } else {
        curLineHeader = 0;
      }
    }

    // record line
    if (typeof this.lines[curLineNum] !== 'object') {
      this.lines[curLineNum] = {
        header: curLineHeader,
      };
    } else {
      this.lines[curLineNum].header = curLineHeader;
    }

    const codeBlockBoundaryMatchRes = line.text.match(/^```/);
    if (codeBlockBoundaryMatchRes) {
      el.classList.add('line-cm-code-block-boundary');
    }

    // because both 'markdown code' and 'comment in fenced code block'
    // have className '.cm-comment' in codemirror
    // so we need to add a new className for 'comment in fenced code block'
    const commentSpan = el.querySelector('.cm-comment');
    if (commentSpan && (commentSpan.innerText.match(/^\/\//) ||
      commentSpan.innerText.match(/^\/\*/) ||
      commentSpan.innerText.match(/^#/))) {
      commentSpan.classList.add('cm-code-comment');
    }

    const t2 = new Date() - t1;
    if (t2 >= 3) {
      console.warn('render line timer: ', t2, el);
    }
  }

  /**
   * use: 使用插件
   * @param {function} plugin 插件函数
   * @param {object} config 插件配置对象
   */
  use(plugin, config) {
    plugin(this, config);
  }

  /**
   * foldHeaderTo: 折叠代码至headerLv
   * @param {number} targetHeaderLv
   */
  foldHeaderTo(targetHeaderLv) {
    let prevHeaderLv = 0;
    this.cm.execCommand('unfoldAll');
    const doc = this.cm.getDoc();
    const lineCount = doc.lineCount();
    for (let i = lineCount; i >= 0; i -= 1) {
      const lineText = doc.getLine(i);
      if (lineText) {
        const headerLv = this.getHeaderLvByStr(lineText);
        if (headerLv) {
          // 如果当前标题只有内容, 没有子标题. 或大于折叠目标等级, 则折叠
          if (headerLv >= prevHeaderLv || headerLv >= targetHeaderLv) {
            this.fold(i);
          }
          prevHeaderLv = headerLv;
        }
      }
    }
  }

  /**
   * fold 折叠
   * @param {number/pos} line line可以是一个数值, 表示行数, 或一个{ line, ch }对象
   * @param {boolean} scanUp 是否向上扫描
   */
  fold(line, scanUp = false) {
    this.cm.foldCode(line, {
      widget: '+',
      minFoldSize: 1,
      scanUp,
    });
  }

  /**
   * unfold 展开
   * @param {number/pos} line line可以是一个数值, 表示行数, 或一个{ line, ch }对象
   */
  unfold(line) {
    this.cm.foldCode(line, {
      widget: '+',
      minFoldSize: 1,
    }, 'unfold');
  }

  /**
   * getHeaderAncestors: 获取当前Header的祖先Header
   * @param {pos} cursor 光标. 可选, 如果没有传入则使用当前鼠标位置. 需要是一个cm中的{line: num, ch: num}对象
   * @param {num} depth 向上检索的层级. 比如传入1, 就只检索到父级, 不检索爷爷级. 可选, 如果不填, 则默认一直检索到一级标题
   * @returns {array} 检索结果数组, 数组第一项是父级, 第二项是爷爷级...
   * 数组元素结构: {headerLv: num, 标题等级, headerLineNum: 标题所在行号, headerLineText: 标题内容}
   * 如果当前cursor所在行也是一个header, 则数组的第一项会多出一个属性: isCursorInThisLine: true
   */
  getHeaderAncestors(cursor, depth) {
    const res = [];
    if (!cursor) {
      cursor = this.cm.getCursor();
    }
    if (!depth) {
      depth = 99; // just a big number
    }
    // first line res
    let curLineRes;
    const curLineText = this.cm.lineInfo(cursor.line).text;
    const firstLineHeaderLv = this.getHeaderLvByStr(curLineText);
    if (firstLineHeaderLv) {
      curLineRes = {
        headerLv: firstLineHeaderLv,
        headerLineNum: cursor.line,
        headerLineText: curLineText,
        isCursorInThisLine: true,
      };
      res.push(curLineRes);
    }

    // other line res
    let lastHeaderLv = firstLineHeaderLv || 99; // just a big number
    let curDetectDepth = 0;
    let curDetectLineNum = cursor.line - 1;
    while (curDetectLineNum >= 0 && curDetectDepth < depth && lastHeaderLv >= 1) {
      const curDetectLineText = this.cm.lineInfo(curDetectLineNum).text;
      const curDetectLineHeaderLv = this.getHeaderLvByStr(curDetectLineText);
      if (curDetectLineHeaderLv && curDetectLineHeaderLv < lastHeaderLv) {
        res.push({
          headerLv: curDetectLineHeaderLv,
          headerLineNum: curDetectLineNum,
          headerLineText: curDetectLineText,
        });
        lastHeaderLv = curDetectLineHeaderLv;
        curDetectDepth += 1;
      }
      curDetectLineNum -= 1;
    }

    // return
    return res;
  }

  /**
   * getHeaderSiblings: 获取当前Header的兄弟Header
   * @param {pos} cursor 光标. 可选, 如果没有传入则使用当前鼠标位置. 需要是一个cm中的{line: num, ch: num}对象
   * @param {boolean} isGetPrev 是否获取当前标题之前的同级标题, 默认为true
   * @param {boolean} isGetNext 是否获取当前标题之后的同级标题, 默认为true. 如果前后都检索, 则优先检索前面的. 检索范围不会越过父级范围.
   * @param {num} tagertGetNum 要检索的header个数. 可选, 如果不填, 则检索所有复合要求的header
   * @returns {obj} 检索结果对象. 包含如下属性: firstNextHeaderIndex: [num] 第一个nextHeader在结果数组中的下标, data: 结果数组
   * 结果数组[0]始终是当前光标位于的header的信息. [1]-[firstNextHeaderIndex-1]是prevHeader的信息, 之后是nextHeader的信息
   * 数组元素结构: {headerLv: num, 标题等级, headerLineNum: 标题所在行号, headerLineText: 标题内容}
   * 如果当前cursor所在行也是一个header, 则数组的第一项会多出一个属性: isCursorInThisLine: true
   */
  getHeaderSiblings(cursor, isGetPrev = true, isGetNext = true, tagertGetNum) {
    // verify & prepare
    let res = {};
    if (!cursor) {
      cursor = this.cm.getCursor();
    }
    if (!tagertGetNum) {
      tagertGetNum = 999; // maximum detect header number
    }
    const prevHeaders = [];
    const firstHeader = {};
    const nextHeaders = [];
    let curGetNum = 0;
    let curDetectLineNum;
    let curDetectLineText;
    let curDetectLineHeaderLv;

    // cursor-in header (first header)
    const firstHeaderRes = this.getHeaderByCursor(cursor);
    if (firstHeaderRes.headerLv) {
      firstHeader.headerLv = firstHeaderRes.headerLv;
      firstHeader.headerLineNum = firstHeaderRes.headerLineNum;
      firstHeader.headerLineText = firstHeaderRes.headerLineText;
      if (firstHeader.headerLineNum === cursor.line) {
        firstHeader.isCursorInThisLine = true;
      }
    } else {
      return res;
    }

    // prev headers
    let isReachTop = false;
    if (isGetPrev) {
      curDetectLineNum = firstHeader.headerLineNum - 1;
      while (curDetectLineNum >= 0 && !isReachTop && curGetNum < tagertGetNum) {
        curDetectLineText = this.cm.lineInfo(curDetectLineNum).text;
        curDetectLineHeaderLv = this.getHeaderLvByStr(curDetectLineText);
        if (curDetectLineHeaderLv && curDetectLineHeaderLv <= firstHeader.headerLv) {
          if (curDetectLineHeaderLv === firstHeader.headerLv) {
            prevHeaders.push({
              headerLv: curDetectLineHeaderLv,
              headerLineNum: curDetectLineNum,
              headerLineText: curDetectLineText,
            });
            curGetNum += 1;
          } else {
            isReachTop = true;
          }
        }
        curDetectLineNum -= 1;
      }
    }

    // next headers
    let isReachBottom = false;
    if (isGetNext) {
      curDetectLineNum = cursor.line + 1;
      const lastLineNum = this.cm.getDoc().lastLine();
      while (curDetectLineNum <= lastLineNum && !isReachBottom && curGetNum < tagertGetNum) {
        curDetectLineText = this.cm.lineInfo(curDetectLineNum).text;
        curDetectLineHeaderLv = this.getHeaderLvByStr(curDetectLineText);
        if (curDetectLineHeaderLv && curDetectLineHeaderLv <= firstHeader.headerLv) {
          if (curDetectLineHeaderLv === firstHeader.headerLv) {
            nextHeaders.push({
              headerLv: curDetectLineHeaderLv,
              headerLineNum: curDetectLineNum,
              headerLineText: curDetectLineText,
            });
            curGetNum += 1;
          } else {
            isReachBottom = true;
          }
        }
        curDetectLineNum += 1;
      }
    }

    // return
    prevHeaders.reverse();
    const data = [firstHeader];
    res = {
      firstNextHeaderIndex: prevHeaders.length + 1,
      data: data.concat(prevHeaders, nextHeaders),
    };
    return res;
  }

  /**
   * isThisLineAHeader: 传入的行是header吗, 该函数尚未测试
   * @param {pos} line 要检测的line. 如果不传入line, 默认使用当前cursor所在的line
   * @returns {boolean/number} 不是的话返回false, 是的话返回headerlv
   */
  isThisLineAHeader(line) {
    let res = false;
    if (!line) {
      ({ line } = this.cm.getCursor());
    }
    const headerLv = this.getHeaderLvByStr(this.cm.lineInfo(line).text);
    if (headerLv) res = headerLv;
    return res;
  }

  /**
   * getHeaderLvByStr 根据传入的字符串, 判断header等级
   * @param {string} str
   * @returns {number} headerLv
   */
  // eslint-disable-next-line class-methods-use-this
  getHeaderLvByStr(str) {
    let headerLv;
    const matchRes = str.match(/^(#+)\s/);
    if (matchRes && matchRes[1].length > 0) {
      headerLv = matchRes[1].length;
    }
    return headerLv;
  }

  /**
   * getHeaderByCursor: 获取当前cursor位于的head
   * @param {pos} cursor 要检测的cursor. 如果不传入cursor, 默认使用当前cursor. 检测范围从传入的行开始(含)
   * @returns {object } 如果找到了headerLv, 返回值中的headerLv有值. headerLineNum和headerLineText是和headerLv相关的值
   * 如果没有找到headerLv, 返回值中的headerLv没有值. 但headerLineNum和headerLineText依旧存在, 存储的是第一行的信息
   */
  getHeaderByCursor(cursor) {
    if (!cursor) {
      const doc = this.cm.getDoc();
      cursor = doc.getCursor();
    }

    let curDetectLineNum = cursor.line;
    let curDetectLineText = this.cm.lineInfo(curDetectLineNum).text;
    let headerLv;
    while (curDetectLineNum > 0 && curDetectLineText[0] !== '#') {
      curDetectLineNum -= 1;
      curDetectLineText = this.cm.lineInfo(curDetectLineNum).text;
    }
    if (curDetectLineText[0] === '#') {
      headerLv = this.getHeaderLvByStr(curDetectLineText);
    }
    return {
      headerLv,
      headerLineNum: curDetectLineNum,
      headerLineText: curDetectLineText,
    };
  }

  /**
   * getHeadersHierarchy: 获取所有headers, 组织成一个对象
   * @param {String} text 文本, 如果不传入则默认获取当前文档打开的文本
   * @param {boolean} isWithLineNum 是否带上行号, 默认`false`
   */
  getHeadersHierarchy(text, isWithLineNum) {
    if (!text) {
      text = this.cm.getDoc().getValue();
    }
    const lineArr = text.split('\n');
    const hierarchy = {};
    const lastMeetHeaders = []; // [lastHeader1, lastHeader2....lastHeader6]
    for (let i = 0; i < lineArr.length; i += 1) {
      const matchRes = lineArr[i].match(/^(#+)\s(.+)/);
      if (matchRes && matchRes[1].length > 0) {
        const headerLv = matchRes[1].length;
        if (headerLv === 1) {
          lastMeetHeaders[headerLv] = {};
          if (isWithLineNum) hierarchy[`${i} ${matchRes[2]}`] = lastMeetHeaders[headerLv];
          else hierarchy[`${matchRes[2]}`] = lastMeetHeaders[headerLv];
        } else if (headerLv > 1 && headerLv <= 6 && lastMeetHeaders[headerLv - 1]) {
          lastMeetHeaders[headerLv] = {};
          if (isWithLineNum) lastMeetHeaders[headerLv - 1][`${i} ${matchRes[2]}`] = lastMeetHeaders[headerLv];
          else lastMeetHeaders[headerLv - 1][`${matchRes[2]}`] = lastMeetHeaders[headerLv];
        }
      }
    }
    return hierarchy;
  }

  /**
   * getCmdInLastLine: 从最后一行读取指令
   * @param {Regext} reg 匹配命令的正则表达式
   * @returns {array} 返回匹配结果
   */
  getCmdInLastLine(reg) {
    let matchRes = null;
    const lastLineNum = this.cm.getDoc().lastLine();
    const lastLineText = this.cm.lineInfo(lastLineNum).text;
    // eslint-disable-next-line no-cond-assign
    if (this.isThisLineCmdLine(lastLineNum, lastLineText)) {
      matchRes = lastLineText.match(reg);
    }

    return matchRes;
  }

  /**
   * isThisLineCmdLine: 检测当前行是否是命令行
   * 命令行需要一# %开头,如: # %no-auto-fold%, 即命令行本身是个一级标题
   * @param {num} lineNum 行号
   * @param {num} lineText 行文本
   * 如果传入行号, 不传入行文本, 将通过行号自动获取行文本
   * 如果传入行号和行文本, 将默认传入的行号和行文本就是最后一行的行号和行文本
   */
  isThisLineCmdLine(lineNum, lineText) {
    let res = false;
    let ln;
    let lt;
    let lastLineNum;
    if (typeof lineNum === 'number') {
      ln = lineNum;
    } else {
      throw new Error(`lineNum: wrong typte, expect a number: ${lineNum}`);
    }
    if (typeof lineText === 'string') {
      lastLineNum = ln;
      lt = lineText;
    }

    if (!lastLineNum) {
      lastLineNum = this.cm.getDoc().lastLine();
    }

    if (ln === lastLineNum) {
      if (!lt) {
        lt = this.cm.lineInfo(ln).text;
      }
      if (lt.indexOf('# %') === 0) {
        res = true;
      }
    }
    return res;
  }
}
