// 用于在当前行快速选中字符
import $ from 'jquery';

// 内部状态
let oldLineTextLen = null; // 输入指令前的当前行文本长度
let lineCharMarks = []; // 当前行的标记
let editor;
let cm;

// 添加标签和事件
function addMarkAndListen() {
  const doc = cm.getDoc();
  const cursor = doc.getCursor();
  oldLineTextLen = cm.lineInfo(cursor.line).text.length;
  if (!oldLineTextLen) return;
  doc.setCursor({ line: cursor.line, ch: oldLineTextLen });
  const tags1 = ['r', 'o', 'y', 'g', 'c', 'b', 'p', 'a', 't', 'w'];
  const tags2 = ['q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f', 'g', 'z', 'x', 'c', 'v', 'y', 'u', 'i', 'o', 'p', 'h', 'j', 'k', 'l', 'b', 'n', 'm'];
  const len = Math.min(tags1.length * tags2.length, oldLineTextLen);
  for (let i = 1; i <= len; i += 1) {
    const firstClassNum = Number.parseInt((i - 1) / tags2.length, 10);
    const firstClass = `line-char-1-${tags1[firstClassNum]}`;
    const secondClass = `line-char-2-${tags2[i - 1 - (firstClassNum * tags2.length)]}`;
    const thirdClass = `line-char-n-${i - 1}`;
    lineCharMarks.push(doc.markText(
      { line: cursor.line, ch: i - 1 },
      { line: cursor.line, ch: i },
      { className: `line-char ${firstClass} ${secondClass} ${thirdClass}` },
    ));
  }
  editor.el.addEventListener('keydown', getCommand, true);
}


// 移除标签和事件
function clearMarkAndListen() {
  editor.el.removeEventListener('keydown', getCommand, true);
  oldLineTextLen = null;
  const lineChars = $('.line-char');
  // cm的TextMark.clear()函数有性能问题, 所以这里先用jquery移除视效, 然后在setTimeout中再真正移除mark
  for (let i = 0; i < lineChars.length; i += 1) {
    lineChars[i].className = '';
  }
  setTimeout(() => {
    for (let i = 0; i < lineCharMarks.length; i += 1) {
      lineCharMarks[i].clear();
    }
    lineCharMarks = [];
  }, 0);
}

// 解析输入的命令
function resolveCommand() {
  let startCh;
  let endCh;

  const doc = cm.getDoc();
  const cursor = doc.getCursor();
  const curLineText = cm.lineInfo(cursor.line).text;
  const tags = curLineText.slice(oldLineTextLen);
  if (tags) {
    doc.replaceRange('', { line: cursor.line, ch: oldLineTextLen }, { line: cursor.line, ch: curLineText.length });
  }
  if (tags.length === 2) { // 仅移动光标
    for (let i = 0; i < lineCharMarks.length; i += 1) {
      const c = lineCharMarks[i];
      if (c.className.includes(`line-char-1-${tags[0]}`) && c.className.includes(`line-char-2-${tags[1]}`)) {
        startCh = Number(c.className.match(/line-char-n-(\w+)/)[1]);
      }
      if (startCh !== undefined) {
        doc.setSelection(
          { line: cursor.line, ch: startCh },
          { line: cursor.line, ch: startCh },
        );
        break;
      }
    }
  } else if (tags.length === 4) { // 移动光标加选中
    for (let i = 0; i < lineCharMarks.length; i += 1) {
      const c = lineCharMarks[i];
      if (c.className.includes(`line-char-1-${tags[0]}`) && c.className.includes(`line-char-2-${tags[1]}`)) {
        startCh = Number(c.className.match(/line-char-n-(\w+)/)[1]);
      }
      if (c.className.includes(`line-char-1-${tags[2]}`) && c.className.includes(`line-char-2-${tags[3]}`)) {
        endCh = Number(c.className.match(/line-char-n-(\w+)/)[1]);
      }
      if (startCh !== undefined && endCh !== undefined) {
        doc.setSelection(
          { line: cursor.line, ch: startCh },
          { line: cursor.line, ch: endCh + 1 },
        );
        break;
      }
    }
  }
}

// keydown回调函数: 获取输入的命令
function getCommand(e) {
  if (e.code.toLowerCase() === 'enter') { // 中英文回车
    e.preventDefault();
    e.currentTarget.removeEventListener('keydown', getCommand, true);
    setTimeout(() => {
      resolveCommand();
      clearMarkAndListen();
    }, 100); // 等待linetext更新, 设置<100ms可能会出问题
  }
}

// 导出
export default function (_editor, config) {
  editor = _editor; // 放到全局
  ({ cm } = editor);
  const keyMap = {
    'Alt-F': function f() {
      if (lineCharMarks.length > 0) { // 已有标记, 则移除
        clearMarkAndListen();
      } else { // 没有标记, 则添加add mark
        addMarkAndListen();
      }
    },
  };
  editor.cm.addKeyMap(keyMap);
}
