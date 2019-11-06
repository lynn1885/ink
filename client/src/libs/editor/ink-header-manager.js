// 一些快速插入header的快捷方式
const map = {
  insertHeaderNext: 'Ctrl-J',
  insertHeaderChild: 'Ctrl-L',
  insertHeaderNextParent: 'Ctrl-H',
  insertNextLiUnderHeader: 'Ctrl-O',
  reorderCurHeaderLi: 'Ctrl-Alt-O',
  upgradeHeaders: 'Shift-Ctrl-[',
  degrageHeaders: 'Shift-Ctrl-]',
};

// 导出
export default function (editor) {
  editor.cm.addKeyMap({
    // insert header by hierarchy: next
    [map.insertHeaderNext]: (cm) => {
      const doc = cm.getDoc();
      const { headerLv, headerLineText } = editor.getHeaderByCursor();
      if (headerLv > 0) { // 只有当前已经位于某个header中时, 才会执行下面的操作
        // 找到下一个同级header所在行, 或当前所在行的父级header的最后一行, 这是要插入的位置
        const { nextSiblingHeaderlineNum, parentHeaderLastLineNum }
            = getNextSiblingHeaderLineNumByCurosr(editor, cm, headerLv);
        let insertLineNum;
        if (nextSiblingHeaderlineNum) {
          insertLineNum = nextSiblingHeaderlineNum - 1;
        } else if (parentHeaderLastLineNum) {
          insertLineNum = parentHeaderLastLineNum;
        }
        console.log(headerLineText);
        // 插入
        let headerStr = '';
        for (let i = 0; i < headerLv; i += 1) {
          headerStr += '#';
        }
        headerStr += ' ';
        // reuse
        if (headerLineText) {
          const matchRes = headerLineText.match(/^#+ (.+: |.+：)/);
          if (matchRes && matchRes[1]) {
            headerStr += matchRes[1];
          }
        }
        // set cursor
        const insertLineCh = cm.lineInfo(insertLineNum).text.length;
        doc.replaceRange(`\n${headerStr} `, { line: insertLineNum, ch: insertLineCh }, { line: insertLineNum, ch: insertLineCh });
        doc.setSelection(
          { line: insertLineNum + 1, ch: headerLv + 1 },
          { line: insertLineNum + 1, ch: headerStr.length },
        );
      }
    },

    // insert next list
    [map.insertNextLiUnderHeader]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const curLineText = cm.lineInfo(cursor.line).text;
      const { headerLv, headerLineNum, headerLineText } = editor.getHeaderByCursor();
      if (headerLv > 0) { // 只有当前已经位于某个header中时, 才会执行下面的操作
        // 如果当前的光标位于header中, 则直接插入
        if (cursor.line === headerLineNum) {
          doc.replaceRange(
            '\n1. ',
            { line: headerLineNum, ch: headerLineText.length },
            { line: headerLineNum, ch: headerLineText.length },
          );
          doc.setCursor({ line: headerLineNum + 1, ch: 3 });
        } else { // 如果当前的光标没有位于header中
          const { nextSiblingHeaderlineNum, parentHeaderLastLineNum }
            = getNextSiblingHeaderLineNumByCurosr(editor, cm, headerLv);
          let curDetectLineNum = cursor.line;
          let curDetectLineText = curLineText;
          while (curDetectLineNum > headerLineNum && !curDetectLineText.match(/^\d+\.\s/)) { // 从当前行向上遍历, 寻找上一个li, 以此确定下一个li的编号
            curDetectLineNum -= 1;
            curDetectLineText = cm.lineInfo(curDetectLineNum).text;
          }
          if (curDetectLineText.match(/^\d+\.\s/)) { // 如果找到了上一个li
            const liLv = Number(curDetectLineText.match(/^(\d+)\.\s/)[0]);
            let endLineNum;
            if (nextSiblingHeaderlineNum) {
              endLineNum = nextSiblingHeaderlineNum - 1;
            } else if (parentHeaderLastLineNum) {
              endLineNum = parentHeaderLastLineNum;
            }
            curDetectLineNum = cursor.line;
            curDetectLineText = '';
            while (curDetectLineNum < endLineNum && !curDetectLineText.match(/^\d+\.\s/)) { // 找下一个li
              curDetectLineNum += 1;
              curDetectLineText = cm.lineInfo(curDetectLineNum).text;
            }
            let insertLineNum;
            const li = `\n${liLv + 1}. `;
            const matchRes = curDetectLineText.match(/^(\d+)\.\s/);
            if (matchRes) { // 如果找到下一个li
              insertLineNum = curDetectLineNum - 1;
            } else { // 如果没有找到下一个li
              insertLineNum = endLineNum;
            }
            const insertLineText = cm.lineInfo(insertLineNum).text;

            // 插入
            doc.replaceRange(
              li,
              { line: insertLineNum, ch: insertLineText.length },
              { line: insertLineNum, ch: insertLineText.length },
            );
            doc.setCursor({ line: insertLineNum + 1, ch: li.length - 1 });
          } else { // 如果没有找到上一个li, 把当前行变为li
            doc.replaceRange(
              '1. ',
              { line: cursor.line, ch: 0 },
              { line: cursor.line, ch: 0 },
            );
            doc.setCursor({ line: cursor.line, ch: 3 });
          }
        }
      }
    },

    // reorder list
    [map.reorderCurHeaderLi]: (cm) => {
      const doc = cm.getDoc();
      const sel = doc.getSelection();
      if (sel) {
        let marker;
        doc.replaceSelection(sel.replace(/^(\d+). /gm, (match, group1) => {
          let res;
          if (marker) {
            marker += 1;
            res = `${marker}. `;
          } else {
            marker = Number.parseInt(group1, 10);
            res = `${marker}. `;
          }
          return res;
        }));
      } else {
        // eslint-disable-next-line prefer-const
        let { headerLv, headerLineNum } = editor.getHeaderByCursor();
        if (!headerLv) headerLineNum = -1; // 此时前面没有标题, 应该从第0行开始替换. 又因为下面循环中会+1, 所以标记为-1, (-1 + 1 = 0)
        const lineCount = doc.lineCount();
        let marker = 1;
        for (let i = headerLineNum + 1; i < lineCount; i += 1) {
          const text = doc.getLine(i);
          if (text.match(/^(#+) /)) {
            break;
          }
          if (text.match(/^\d+. /)) {
            doc.replaceRange(
              text.replace(/^\d+. /, `${marker}. `),
              { line: i, ch: 0 },
              { line: i, ch: text.length },
            );
            marker += 1;
          }
        }
      }
    },

    // insert header child
    [map.insertHeaderChild]: (cm) => {
      const doc = cm.getDoc();
      const { headerLv, headerLineNum } = editor.getHeaderByCursor();
      if (headerLv > 0) {
        let headerStr = '';
        for (let i = 0; i < headerLv + 1; i += 1) {
          headerStr += '#';
        }
        const insertLineCh = cm.lineInfo(headerLineNum).text.length;
        doc.replaceRange(`\n${headerStr} `, { line: headerLineNum, ch: insertLineCh }, { line: headerLineNum, ch: insertLineCh });
        doc.setCursor({ line: headerLineNum + 1, ch: headerLv + 2 });
      }
    },

    // insert header parent
    [map.insertHeaderNextParent]: (cm) => {
      const doc = cm.getDoc();
      const { headerLv } = editor.getHeaderByCursor();
      if (headerLv > 1) {
        let headerStr = '';
        for (let i = 0; i < headerLv - 1; i += 1) {
          headerStr += '#';
        }

        const { parentHeaderLastLineNum: insertLineNum }
          = getNextSiblingHeaderLineNumByCurosr(editor, cm, headerLv, true);
        const insertLineCh = cm.lineInfo(insertLineNum).text.length;
        doc.replaceRange(`\n${headerStr} `, { line: insertLineNum, ch: insertLineCh }, { line: insertLineNum, ch: insertLineCh });
        doc.setCursor({ line: insertLineNum + 1, ch: headerLv });
      }
    },

    // degrageHeaders
    [map.degrageHeaders]: (cm) => {
      const doc = cm.getDoc();
      const sel = doc.getSelection();
      if (sel) {
        doc.replaceSelection(replace(sel));
      } else {
        const cursor = doc.getCursor();
        const lineText = cm.lineInfo(cursor.line).text;
        doc.replaceRange(
          replace(lineText),
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: lineText.length },
        );
      }

      function replace(text) {
        if (!text.match(/^(#+) /gm)) {
          let { headerLv } = editor.getHeaderByCursor();
          if (!headerLv) headerLv = 0;
          text = text.replace(/^\d+. /gm, `${'#'.repeat(headerLv + 1)} `);
        } else {
          text = text.replace(/^(#+) /gm, (match, group1) => `${'#'.repeat(group1.length + 1)} `);
        }
        if (text.match(/^#{7,} /gm)) {
          editor.messager.warning('有些标题超过6级了, 最多只支持到6级标题');
        }
        return text;
      }
    },

    [map.upgradeHeaders]: (cm) => {
      const doc = cm.getDoc();
      const sel = doc.getSelection();
      if (sel) {
        doc.replaceSelection(replace(sel));
      } else {
        const cursor = doc.getCursor();
        const lineText = cm.lineInfo(cursor.line).text;
        doc.replaceRange(
          replace(lineText),
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: lineText.length },
        );
      }

      function replace(text) {
        if (text.match(/^# /gm)) {
          editor.messager.warning('有些标题已经是1级标题了, 将不再提升这些标题');
        }
        if (!text.match(/^(#+) /gm)) {
          let { headerLv } = editor.getHeaderByCursor();
          if (!headerLv) headerLv = 0;
          text = text.replace(/^\d+. /gm, `${'#'.repeat(headerLv)} `);
        } else {
          text = text.replace(/^(#+) /gm, (match, group1) => `${'#'.repeat(group1.length - 1 >= 1 ? group1.length - 1 : 1)} `);
        }
        return text;
      }
    },
  });
}

// 获取当cursor所位于header的下一个同级head的lineNum, 两个header需要在同一个父级内
// 如果当前header已经是最后一个, 没有下一个同级header了. 则返回当前父级header最后一行的lineNum
// isOnlyParentHeaderLastLineNum: 是否始终只获取当前父级header最后一行的lineNum, 忽略下一个同级header的lineNum
function getNextSiblingHeaderLineNumByCurosr(
  editor, cm, curHeaderLv,
  isOnlyParentHeaderLastLineNum = false,
) {
  const doc = cm.getDoc();
  const cursor = doc.getCursor();

  let headerStr = '';
  for (let i = 0; i < curHeaderLv; i += 1) {
    headerStr += '#';
  }
  headerStr += ' ';

  const lastLineNum = doc.lastLine();
  let curDetectLineNum = cursor.line;
  let curDetectLineText = '';
  let nextSiblingHeaderlineNum;
  let parentHeaderLastLineNum;
  while (curDetectLineNum < lastLineNum) {
    curDetectLineNum += 1;
    curDetectLineText = cm.lineInfo(curDetectLineNum).text;
    if (!isOnlyParentHeaderLastLineNum) {
      if (curDetectLineText.slice(0, headerStr.length) === headerStr) {
        nextSiblingHeaderlineNum = curDetectLineNum;
        break;
      }
    }
    const curDetectLineHeaderLv = editor.getHeaderLvByStr(curDetectLineText);
    if (curDetectLineHeaderLv <= curHeaderLv) {
      parentHeaderLastLineNum = curDetectLineNum - 1;
      break;
    }
  }

  // 如果没有找到下一个header所在的行, 也没有找到父级header的最后一行, 则把文档最后一行标记为父级header的最后一行
  if (nextSiblingHeaderlineNum === undefined && parentHeaderLastLineNum === undefined) {
    parentHeaderLastLineNum = lastLineNum;
  }

  if (parentHeaderLastLineNum) {
    // 如果发现父级header的最后一行是命令行, 向上移动一行
    if (editor.isThisLineCmdLine(parentHeaderLastLineNum)) {
      parentHeaderLastLineNum -= 1;
    }
    // 如果父级header的最后一行是空行, 继续向上移动, 直至非空的行
    while (cm.lineInfo(parentHeaderLastLineNum).text === '' && parentHeaderLastLineNum >= 1) {
      parentHeaderLastLineNum -= 1;
    }
  }

  return {
    nextSiblingHeaderlineNum,
    parentHeaderLastLineNum,
  };
}
