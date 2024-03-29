import _ from 'lodash';
import $ from 'jquery';
import audioSrc from '@/tools/audios';
import CodeMirror from 'codemirror/lib/codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/markdown/markdown'; // language mode: markdown
import 'codemirror/mode/javascript/javascript'; // language mode: js
import 'codemirror/mode/clike/clike'; // language mode: c, c++, oc, java
import 'codemirror/mode/python/python'; // language mode: python
import 'codemirror/mode/php/php'; // language mode: php
import 'codemirror/mode/shell/shell'; // language mode: shell
import 'codemirror/mode/css/css'; // language mode: css
import 'codemirror/mode/sql/sql'; // language mode: sql
import 'codemirror/addon/fold/foldcode'; // fold code
import 'codemirror/addon/fold/markdown-fold'; // fold code method for markdown
import 'codemirror/addon/display/autorefresh'; // autorefresh
import 'codemirror/addon/mode/simple'; // mode maker
import 'codemirror/addon/mode/loadmode'; // load mode
import 'codemirror/addon/mode/overlay'; // load mode
import 'codemirror/theme/paraiso-light.css'; // 主题包
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/dialog/dialog.css';
import './ink-overlay';
// import 'codemirror/addon/edit/closebrackets'; // close brackets 好像不兼容markdown
// import 'codemirror/addon/hint/show-hint'; // hint逻辑, 使用hint时必须引入
// import 'codemirror/addon/hint/show-hint.css'; // hint样式, 使用hint时必须引入
// import 'codemirror/addon/hint/javascript-hint'; // 针对具体语言的hint包
// import 'codemirror/keymap/vim';

function gotoThisLink(e) {
  if (!e.ctrlKey) return;

  if (e.currentTarget && e.currentTarget.innerText) {
    window.open(e.currentTarget.innerText, '_blank');
  }
}


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
    this._initAudioAbility();
    this.curCursorLineNum = undefined; // 当前光标所处的行
    this.shortcutKeyMap = {};
    this.keyMapFns = {};
    this.messager = config.messager || {
      success() { }, info() { }, warning() { }, error() { },
    };
    this.cm = this._init(el, config.cm);
    this.cm.on('change', this._onChange);
    this.cm.on('renderLine', this._onRenderLine.bind(this)); // 需要固定下这个函数的this指针
    this.cm.on('cursorActivity', this._onCursorActivity.bind(this)); // 需要固定下这个函数的this指针
  }

  /**
   * _init: initialize the editor
   * @param {HTMLElement} el editor dom
   * @param {object} config user config
   */
  _init(el, config) { // eslint-disable-line class-methods-use-this
    const mergedConfig = {
      mode: 'ink',
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

  // eslint-disable-next-line class-methods-use-this
  _onCursorActivity(cm) {
    const className = 'cursor-in-this-line'; // 当前行的类名, 和css耦合
    const doc = cm.getDoc();
    const { line: curCursorLineNum } = doc.getCursor();
    if (this.curCursorLineNum === undefined) {
      doc.addLineClass(curCursorLineNum, 'wrap', className);
    } else if (this.curCursorLineNum !== curCursorLineNum) {
      doc.removeLineClass(this.curCursorLineNum, 'wrap', className);
      doc.addLineClass(curCursorLineNum, 'wrap', className);
    }
    this.curCursorLineNum = curCursorLineNum;
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
    // add class to lines
    if (el.querySelector('.cm-formatting-header')) { // header line
      const headMatchRes = line.text.match(/^(#+)\s/);
      if (headMatchRes) {
        el.classList.add('line-cm-header');
        el.classList.add(`line-cm-header-${headMatchRes[1].length}`);
      }
    } else if (el.querySelector('.cm-quote')) { // quote line
      el.classList.add('line-cm-quote');
    } else if (el.querySelector('[class^="cm-m-"]:not(.cm-m-markdown)') || el.querySelector('.cm-formatting-code-block')) { // code block line
      el.classList.add('line-cm-code-block');
      if (line.text.slice(0, 3) === '```') {
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
    }

    // cutting-line
    if (el.innerText.startsWith('# - ')) {
      el.classList.add('line-cutting');
    }

    // Todo
    if (el.innerText.toLowerCase().startsWith('todo')) {
      el.classList.add('line-todo');
    }

    // important
    if (el.innerText.trim().includes('⭐')) {
      el.classList.add('line-important');
    }

    // ink-mark
    el.setAttribute('ink-mark-1', el.innerText.slice(0, 10));
    el.setAttribute('ink-mark-2', el.innerText.slice(-10));

    // 添加链接
    const links = $('.cm-link:not(.cm-formatting)', el);
    if (links && links.length) {
      links.on('click', gotoThisLink);
    }

    // count render time
    const t2 = new Date() - t1;
    if (t2 >= 3) {
      console.warn('render line timer: ', t2, el);
    }
  }

  // 初始化音频播放能力
  _initAudioAbility() {
    this.audioPlayer = $('#ink-audio-player') || null;
    this.audioSrc = audioSrc;
  }

  /**
   * on: add event listener
   * @param {String} eventName eventName
   * @param {Function} handler handler
   */
  on(eventName, handler) {
    switch (eventName) {
      case 'renderLine':
        this.cm.on('renderLine', handler);
        break;
      case 'change':
        this.cm.on('change', handler);
        break;
      case 'changes':
        this.cm.on('changes', handler);
        break;
      case 'cursorActivity':
        this.cm.on('cursorActivity', handler);
        break;
      default:
        console.error('unsupported event: ', eventName);
        break;
    }
  }

  /**
   * off: remove event listener
   * @param {String} eventName eventName
   * @param {Function} handler handler
   */
  off(eventName, handler) {
    switch (eventName) {
      case 'renderLine':
        this.cm.off('renderLine', handler);
        break;
      case 'change':
        this.cm.off('change', handler);
        break;
      case 'changes':
        this.cm.off('changes', handler);
        break;
      case 'cursorActivity':
        this.cm.off('cursorActivity', handler);
        break;
      default:
        console.error('unsupported event: ', eventName);
        break;
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
   * bind shortcut key map
   * @param {Object} target Which object to bind the key map to
   * @param {Array} keyArr key array
   * @param {Function} handler
   */
  bindShortcutKeyMap(target, keyArr, handler) {
    if (keyArr.length > 4) {
      throw new Error(`The maximum length of keyArr is 4: ${keyArr}`);
    }
    // eslint-disable-next-line newline-per-chained-call
    const keyId = keyArr.join('').split('').sort().join('').toUpperCase();
    if (this.shortcutKeyMap[keyId]) {
      console.warn('This shortcut key has been occupied: ', keyArr, handler, 'This shortcut key corresponds to: ', this.shortcutKeyMap[keyId]);
    } else {
      this.shortcutKeyMap[keyId] = {
        keyArr,
        handler,
      };
      target.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.altKey) {
          let isTrigger = true;
          let i = 0;
          if (e.ctrlKey) {
            i += 1;
          }
          if (e.altKey) {
            i += 1;
          }
          if (e.shiftKey) {
            i += 1;
          }
          if (keyArr.length !== i + 1) { return; }

          for (const key of keyArr) {
            if (key.toUpperCase() === 'CTRL' && e.ctrlKey) {
              // do nothing
            } else if (key.toUpperCase() === 'SHIFT' && e.shiftKey) {
              // do nothing
            } else if (key.toUpperCase() === 'ALT' && e.altKey) {
              // do nothing
            } else if (key.toUpperCase() === e.key.toUpperCase()) {
              // do nothing
            } else {
              isTrigger = false;
              break;
            }
          }

          if (isTrigger) {
            e.preventDefault();
            handler();
          }
        }
      }, true);
    }
  }

  /**
   * 播放音频
   * @param {string} audioName 音频名
   */
  playAudio(audioName) {
    if (this.audioPlayer && audioName && this.audioSrc[audioName]) {
      this.audioPlayer.attr('src', this.audioSrc[audioName]);
      this.audioPlayer[0].play();
    }
  }

  // 全部展开
  unfoldAll() {
    this.cm.execCommand('unfoldAll');
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
   * toggleFold
   * @param {number/pos} line line可以是一个数值, 表示行数, 或一个{ line, ch }对象
   * @param {boolean} scanUp 是否向上扫描
   */
  toggleFold(line, scanUp = false) {
    this.cm.foldCode(line, {
      widget: '+',
      minFoldSize: 1,
      scanUp,
    });
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
    }, 'fold');
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
   * @param {pos} pos 位置. 可选, 如果没有传入则使用当前鼠标位置. 需要是一个cm中的{line: num, ch: num}对象
   * @param {num} depth 向上检索的层级. 比如传入1, 就只检索到父级, 不检索爷爷级. 可选, 如果不填, 则默认一直检索到一级标题
   * @param {boolean} isContainCurLineHeader 如果当前行也是个标题, 那是否在结果中包含当前行. 默认true
   * @returns {array} 检索结果数组, 数组第一项是父级, 第二项是爷爷级...
   * 数组元素结构: {headerLv: num, 标题等级, headerLineNum: 标题所在行号, headerLineText: 标题内容}
   * 如果当前cursor所在行也是一个header, 并且设定了在结果中包含当前行, 则数组的第一项会多出一个属性: isCursorInThisLine: true
   */
  getHeaderAncestors(pos, depth, isContainCurLineHeader = true) {
    const res = [];
    if (!pos) {
      pos = this.cm.getCursor();
    }
    if (!depth) {
      depth = 99; // just a big number
    }
    // first line
    let curLineRes;
    const curLineText = (this.cm.lineInfo(pos.line) || { text: '' }).text;
    const firstLineHeaderLv = this.getHeaderLvByStr(curLineText);
    if (firstLineHeaderLv) {
      curLineRes = {
        headerLv: firstLineHeaderLv,
        headerLineNum: pos.line,
        headerLineText: curLineText,
        bareHeaderLineText: curLineText.replace(/^#+\s/, ''),
        isCursorInThisLine: true,
      };
      if (isContainCurLineHeader) res.push(curLineRes);
    }

    // other line
    let lastHeaderLv = firstLineHeaderLv || 99; // just a big number
    let curDetectDepth = 0;
    let curDetectLineNum = pos.line - 1;
    while (curDetectLineNum >= 0 && curDetectDepth < depth && lastHeaderLv >= 1) {
      const curDetectLineText = this.cm.lineInfo(curDetectLineNum).text;
      const curDetectLineHeaderLv = this.getHeaderLvByStr(curDetectLineText);
      if (curDetectLineHeaderLv && curDetectLineHeaderLv < lastHeaderLv) {
        res.push({
          headerLv: curDetectLineHeaderLv,
          headerLineNum: curDetectLineNum,
          headerLineText: curDetectLineText,
          bareHeaderLineText: curDetectLineText.replace(/^#+\s/, ''),
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
   * @param {num} tagertGetNum 要检索的header个数. 可选, 如果不填, 则检索所有符合要求的header
   * @returns {obj} 检索结果对象. 包含如下属性: firstNextHeaderIndex: [num] 第一个nextHeader在结果数组中的下标, data: 结果数组
   * 结果数组[0]始终是当前光标位于的header的信息. [1]~[firstNextHeaderIndex-1]是prevHeader的信息, 之后是nextHeader的信息
   * 还有一个dataSorted属性, 值为数字, 里面是按顺序排列好的headers, 从上至下排列
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
      dataSorted: prevHeaders.concat(firstHeader).concat(nextHeaders)
    };
    return res;
  }

  /**
   * 获取当前header的最后一行和第一行
   * @param {pos} cursor 光标. 可选, 如果没有传入则使用当前鼠标位置. 需要是一个cm中的{line: num, ch: num}对象
   * @return {obj} {firstLineNum: num, lastLineNum: num}分别是首行,尾行num. 默认值均为0
   */
  // getHeaderFirstAndLastLineNum(cursor) {
  //   const curHeaderSiblings = this.getHeaderSiblings(cursor, false, true);
  //   let curHeaderLineNum = 0;
  //   let nextHeaderLineNum = 0;

  //   // 首行
  //   if (curHeaderSiblings.data[0]) {
  //     curHeaderLineNum = curHeaderSiblings.data[0].headerLineNum;
  //   }

  //   // 尾行
  //   if (curHeaderSiblings.data[curHeaderSiblings.firstNextHeaderIndex]) {
  //     nextHeaderLineNum = curHeaderSiblings.data[curHeaderSiblings.firstNextHeaderIndex].headerLineNum;
  //   } else {
  //     nextHeaderLineNum = this.cm.getDoc().lineCount();
  //   }

  //   return {
  //     firstLineNum: curHeaderLineNum,
  //     lastLineNum: nextHeaderLineNum - 1
  //   };
  // }

  /**
   * isThisLineAHeader: 传入的行是header吗, 该函数尚未测试
   * @param {pos} line 要检测的line. 如果不传入line, 默认使用当前cursor所在的line
   * @returns {boolean/number} 不是的话返回false, 是的话返回headerlv
   */
  isThisLineAHeader(lineNum) {
    let res = false;
    if (typeof lineNum !== 'number') {
      ({ line: lineNum } = this.cm.getDoc().getCursor());
    }
    const headerLv = this.getHeaderLvByStr(this.cm.lineInfo(lineNum).text);
    if (headerLv) res = headerLv;
    return res;
  }

  /**
   * isThisTextAHeader: 检测传入的文本是不是一个标题
   * @param {string} text
   * @returns {boolean/number} 不是的话返回false, 是的话返回headerlv
   */
  isThisTextAHeader(text) {
    let res = false;
    const headerLv = this.getHeaderLvByStr(text);
    if (headerLv) res = headerLv;
    return res;
  }

  /**
   * isThisTextAHeader: 检测传入的文本是不是一个list
   * @param {string} text
   * @returns {boolean} 是的话返回true, 否则返回false
   */
  // eslint-disable-next-line class-methods-use-this
  isThisTextAList(text) {
    return text.match(/^\d+. /);
  }

  /**
   * getHeaderLvByStr 根据传入的字符串, 判断header等级
   * @param {string} str
   * @returns {number} headerLv
   * @returns {number} header等级, 不是header则返回0
   */
  // eslint-disable-next-line class-methods-use-this
  getHeaderLvByStr(str) {
    let headerLv = 0;
    const matchRes = str.match(/^(#+)\s/);
    if (matchRes && matchRes[1].length > 0) {
      headerLv = matchRes[1].length;
    }
    return headerLv;
  }

  /**
   * getHeaderByCursor: 获取当前cursor位于的head
   * @param {pos} cursor 可选，要检测的cursor. 如果不传入cursor, 默认使用当前cursor. 检测范围从传入的行开始(含)
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
   * @param {object} propNames 可选, 用于自定义生成的hierarchy对象的属性名
   */
  getHeadersHierarchy(text, propNames = {
    lineNum: 'lineNum',
    lv: 'lv',
    text: 'text',
    textWithoutHeader: 'textWithoutHeader',
    nextLine1: 'nextLine1',
    nextLine2: 'nextLine2',
    nextLine3: 'nextLine3', // 标题之后三行
    children: 'children',
    content: 'content'
  }, isNeedContent = false) {
    if (!text) {
      text = this.cm.getDoc().getValue();
    }
    const lineArr = text.split('\n');
    const hierarchy = [];
    const lastMeetHeaders = []; // [lastHeader1, lastHeader2....lastHeader6]
    for (let i = 0; i < lineArr.length; i += 1) {
      const matchRes = lineArr[i].match(/^(#+)\s(.*)/);
      if (matchRes && matchRes[1].length > 0) {
        const headerLv = matchRes[1].length;
        if (headerLv === 1) {
          lastMeetHeaders[headerLv] = [];

          const res = {
            [propNames.lineNum]: i,
            [propNames.lv]: headerLv,
            [propNames.text]: matchRes[0],
            [propNames.textWithoutHeader]: matchRes[0].split(/^#+ /)[1],
            [propNames.nextLine1]: lineArr[i + 1],
            [propNames.nextLine2]: lineArr[i + 2],
            [propNames.nextLine3]: lineArr[i + 3],
            [propNames.children]: lastMeetHeaders[headerLv],
          };
          hierarchy.push(res);

          // 标题下的文本内容
          if (isNeedContent) {
            let j = i;
            let content = '';
            while (++j && j < lineArr.length && !this.isThisLineAHeader(lineArr[j])) {
              content += `${lineArr[j]}\n`;
            }
            res[propNames.content] = content;
          }
        } else if (headerLv > 1 && headerLv <= 6 && lastMeetHeaders[headerLv - 1]) {
          lastMeetHeaders[headerLv] = [];
          const res = {
            [propNames.lineNum]: i,
            [propNames.lv]: headerLv,
            [propNames.text]: matchRes[0],
            [propNames.textWithoutHeader]: matchRes[0].split(/^#+ /)[1],
            [propNames.nextLine1]: lineArr[i + 1],
            [propNames.nextLine2]: lineArr[i + 2],
            [propNames.nextLine3]: lineArr[i + 3],
            [propNames.children]: lastMeetHeaders[headerLv],
          };
          lastMeetHeaders[headerLv - 1].push(res);

          // 标题下的文本内容
          if (isNeedContent) {
            let j = i;
            let content = '';
            while (++j && j < lineArr.length && !this.isThisTextAHeader(lineArr[j])) {
              content += `${lineArr[j]}\n`;
              // console.log(lineArr[j]);
            }
            res[propNames.content] = content;
          }
        }
      }
    }
    return hierarchy;
  }

  /**
   * getHeadersArray: 获取所有header, 按数组形式排列
   * @param {String} text 文本, 如果不传入则默认获取当前文档打开的文本
   */
  getHeadersArray(text) {
    if (!text) {
      text = this.cm.getDoc().getValue();
    }
    const lines = text.split('\n');
    const headers = [];
    headers.lines = {};

    const parentHeadersText = [];

    for (let i = 0; i < lines.length; i += 1) {
      const headerLv = this.getHeaderLvByStr(lines[i]);
      if (headerLv && headerLv > 0) {
        parentHeadersText[headerLv - 1] = lines[i];

        const headerObj = {
          lineNum: i,
          lv: headerLv,
          text: lines[i],
          parentHeadersText: parentHeadersText.slice(0, headerLv),
          index: headers.length,
        };

        headers.push(headerObj);
        headers.lines[i] = headerObj;
      }
    }
    return headers;
  }

  /**
   *
   * @param {Array} headerArr getHeadersArray返回的header数组
   * @param {Object} curHeaderObj getHeadersArray返回的header数组中的元素对象, 也是要查询的这个header的信息对象
   * @returns {number} 当前header的结束行是哪一行(含这一行)
   */
  getHeaderEndAtLineNumByHeaderArray(headerArr, curHeaderObj) {
    headerArr = headerArr.filter(headerObj => headerObj.lv <= curHeaderObj.lv);
    const index = headerArr.findIndex(headerObj => headerObj === curHeaderObj);
    if (headerArr[index + 1]) return headerArr[index + 1].lineNum - 1;
    return this.cm.getDoc().lineCount() - 1;
  }

  /**
   * 获取当前标题的结尾行
   * @param {number} headerLineNum 标题所在行行号
   * @returns {undefined | number} 标题结束行行号, 没有找到则返回undefined
   */
  getHeaderEndAtLineNum(headerLineNum) {
    const headerArr = this.getHeadersArray();
    const curHeaderObj = headerArr.lines[headerLineNum];
    if (!curHeaderObj) return undefined;
    return this.getHeaderEndAtLineNumByHeaderArray(headerArr, curHeaderObj);
  }

  /**
   * 获取某个标题下面的内容
   * @param {number} headerLineNum 标题所在行
   * @param {number} onlyHeaderDeep 只获取标题(不获取内容), 并指定获取标题的深度
   *  0: 不是只获取标题, 而是获取所有内容
   *  1: 只获取一层标题, 比如当前标题行是四级, 就只获取四级标题
   *  2: 只获取两层标题, 比如当前标题行是四级, 就只获取四级标题 + 五级标题
   *  ...
   *  6: 获取六层标题
   * @param {string} returnType 返回值类型 'str', 返回文本, 'arr', 返回数组
   * @param {boolean} isSelectionAllContent 是否同时选中当前标题(含)下的所有内容

   * @returns 获取到的内容
   */
  getHeaderContent(headerLineNum, onlyHeaderDeep = 0, isSelectionAllContent = false, returnType = 'str') {
    // 如果当前行不是header, 直接返回
    if (!this.isThisLineAHeader(headerLineNum)) return '';

    // 获取当前标题结束行, 获取不到则直接返回
    const endLineNum = this.getHeaderEndAtLineNum(headerLineNum);
    if (!endLineNum) return '';

    // 获取文本
    const doc = this.cm.getDoc();
    const endLineText = doc.getLine(endLineNum);
    let res = [];
    for (let i = headerLineNum; i <= endLineNum; i += 1) {
      const lineText = doc.getLine(i);
      res.push({
        lineText,
        lineNum: i,
        lineTextWithoutHeader: lineText.split(/^#+ /)[1],
        isFirstHeader: i === headerLineNum
      });
    }

    // 按需求提取标题
    if (onlyHeaderDeep && res.length) {
      const firstHeaderLevelNum = this.getHeaderLvByStr(res[0].lineText);
      const maxHeaderLv = firstHeaderLevelNum + (onlyHeaderDeep - 1);
      if (maxHeaderLv) {
        res = res.filter((lineObj) => {
          const curLineHeaderLv = this.getHeaderLvByStr(lineObj.lineText);
          if (curLineHeaderLv && curLineHeaderLv <= maxHeaderLv) {
            lineObj.headerLv = curLineHeaderLv;
            return true;
          }
          return false;
        });
      }
    }

    // 按需求选中当前标题下的所有内容
    if (isSelectionAllContent) {
      doc.setSelection(
        { line: headerLineNum, ch: 0 },
        { line: endLineNum, ch: endLineText.length }
      );
    }

    if (returnType === 'str') {
      return res.map(lineObj => lineObj.lineText).join('\n');
    } else if (returnType === 'arr') {
      return res;
    }
    return undefined;
  }

  /**
   * 获取标签
   * @param {string} returnType 返回数据的类型 LINENUM2TAG, TAG2LINENUM. 前者是{行号: [标签, 标签]}, 后者是{标签: 行号}
   * @returns {object} 标签对象
   */
  // eslint-disable-next-line consistent-return
  getTags(returnType = 'LINENUM2TAG') {
    const doc = this.cm.getDoc();
    const text = doc.getValue();
    const lines = text.split('\n');

    const lineNum2Tag = {};
    const tag2LineNum = {};
    lines.forEach((lineText, lineNum) => {
      let matchRes = lineText.match(/`[^`]+`/g);
      const lineTextWithoutTag = lineText.replace(/`[^`]+`/g, '');
      if (matchRes && matchRes.length) {
        matchRes = matchRes.map((tag) => {
          const newTag = tag.replace(/`/g, '');
          tag2LineNum[`${newTag}__${lineNum}`] = {
            tagName: newTag,
            lineNum,
            lineText,
            headerLv: this.getHeaderLvByStr(lineText),
            lineTextWithoutTag
          };
          return newTag;
        });

        lineNum2Tag[lineNum] = {
          tags: matchRes,
          lineNum,
          lineText,
          lineTextWithoutTag
        };
      }
    });

    if (returnType === 'LINENUM2TAG') return lineNum2Tag;
    else if (returnType === 'TAG2LINENUM') return tag2LineNum;
  }

  /**
   * 添加标签
   * @param {number} lineNum 要添加标签的行
   * @param {string} tagContent 标签内容
   */
  addTag(lineNum, tagContent) {
    if (!lineNum) lineNum = this.cm.getCursor().line;
    if (!lineNum) return;
    const doc = this.cm.getDoc();
    const lineText = doc.getLine(lineNum);
    doc.setSelection(
      { line: lineNum, ch: lineText.length },
      { line: lineNum, ch: lineText.length },
    );

    doc.replaceSelection(` \`${tagContent}\` `, 'around');
  }

  /**
   * 删除标签
   * @param {number} lineNum 要删除标签的行
   * @param {string} tagContent 标签内容
   */
  removeTag(lineNum, tagContent) {
    if (!lineNum) lineNum = this.cm.getCursor();

    const doc = this.cm.getDoc();
    const lineText = doc.getLine(lineNum);

    doc.setSelection(
      { line: lineNum, ch: 0 },
      { line: lineNum, ch: lineText.length },
    );
    const newLine = lineText.replace(new RegExp(`\`${tagContent}\``), '');
    doc.replaceSelection(newLine, 'around');

    doc.setCursor({
      line: lineNum,
      ch: newLine.length
    });
  }

  /**
   * scroll note to this line
   * @param {Number} lineNum scroll to this line
   * @param {String} highlightLineClass Highlight the line that scroll to with this class name
   * @param {String} unfoldWay the way to unfold note content. 'unfoldAll' (default)| 'intelligently' | 'keepFold'
   * @param {Boolean} isMoveCursorToThisLine Do you want to move the cursor to this line? default is "false"
   */
  scrollNoteToThisLine(lineNum, highlightLineClass, unfoldWay = 'unfoldAll', isMoveCursorToThisLine = false) {
    const doc = this.cm.getDoc();
    if (unfoldWay === 'unfoldAll') {
      this.cm.execCommand('unfoldAll');
    } else if (unfoldWay === 'intelligently') {
      doc.setCursor({ line: lineNum, ch: 0 });
      this.foldPlugin.foldIntelligently(this.cm, true);
    } else if (unfoldWay === 'keepFold') {
      // do nothing
    } else {
      console.warn('Wrong parameter, unfoldWay: ', unfoldWay);
    }
    if (isMoveCursorToThisLine) {
      setTimeout(() => {
        this.cm.focus();
        doc.setCursor({ line: lineNum, ch: 0 });
      }, 0);
    }
    this.cm.scrollIntoView({ line: lineNum, ch: 0 }, 900);
    doc.addLineClass(lineNum, 'background', highlightLineClass);
    // Try to scroll to this line many times.
    // Because expanding widgets may cause the note page to scroll
    setTimeout(() => {
      doc.removeLineClass(lineNum, 'background', highlightLineClass);
      this.cm.scrollIntoView({ line: lineNum, ch: 0 }, 300);
      doc.addLineClass(lineNum, 'background', highlightLineClass);
      setTimeout(() => {
        doc.removeLineClass(lineNum, 'background', highlightLineClass);
        this.cm.scrollIntoView({ line: lineNum, ch: 0 }, 300);
        doc.addLineClass(lineNum, 'background', highlightLineClass);
        setTimeout(() => {
          doc.removeLineClass(lineNum, 'background', highlightLineClass);
        }, 200);
      }, 200);
    }, 200);
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

  /**
   * getWordAndLineCount, 获取相对科学的字符统计, 行数统计
   * @param {string} text 要统计的文本, 没有的话, 默认使用当前笔记的内容
   * @return {object} res, 统计结果. res.wordCount: 字符数, res.lineCount: 行数
   */
  getWordAndLineCount(text = this.cm.getDoc().getValue()) {
    const res = {
      wordCount: 0,
      lineCount: 0,
    };
    res.lineCount = this.cm.getDoc().lineCount();
    let englishWordCount = 0;
    text = text.replace(/\b[a-zA-Z-]+\b/g, () => {
      englishWordCount += 1;
      return '';
    });
    text = text.replace(/\s+/g, '');
    res.wordCount = text.length + englishWordCount;
    return res;
  }

  /**
   * 清空某一行的小组件
   * @param {object} line 行对象
   */
  // eslint-disable-next-line class-methods-use-this
  removeLineWidgets(line) {
    if (line && line.widgets) {
      line.widgets.forEach((w) => {
        w.clear();
      });
    }
  }

  /**
   * 这是个图片行吗, 是的话获取图片信息
   * @param {string} lineText 图片文本
   * @returns {Object} 图片信息, 没有的话返回null
   */
  // eslint-disable-next-line class-methods-use-this
  getLineImgInfo(lineText) {
    const matchRes = lineText.match(/^!\[(.*?)\]\((.*?)\)/);

    if (matchRes && matchRes.length) {
      const imgPathSeg = matchRes[2].split('/');
      return {
        lineText,
        imgName: matchRes[1],
        imgSrc: matchRes[2],
        imgFolder: imgPathSeg.length >= 2 ? imgPathSeg[0] : ''
      };
    }
    return null;
  }

  /**
   * 获取所有图片行
   * @returns {string} 笔记文本, 默认获取当前打开的笔记
   */
  getAllImgLines(text) {
    const imgLines = [];
    (text || this.cm.getDoc().getValue()).split('\n').forEach((lineText) => {
      const matchRes = lineText.match(/^!\[(.*?)\]\((.*?)\)/);

      if (matchRes && matchRes.length) {
        const imgPathSeg = matchRes[2].split('/');
        imgLines.push({
          lineText,
          imgName: matchRes[1],
          imgSrc: matchRes[2],
          imgFolder: imgPathSeg.length >= 2 ? imgPathSeg[0] : ''
        });
      }
    });

    return imgLines.length ? imgLines : [];
  }

  getCursorLine() {
    const cursor = this.cm.getDoc().getCursor();
    if (cursor) {
      return cursor.line;
    }
    return undefined;
  }
}
