// 基础快捷键
/**
 *
 * @param {InkEditor} editor
 * @param {Object} keyMap
 */
export default function (editor, keyMap) {
  const defaultKeyMap = {
    // header
    removeHeader: 'Ctrl-0',
    header1: 'Ctrl-1',
    header2: 'Ctrl-2',
    header3: 'Ctrl-3',
    header4: 'Ctrl-4',
    header5: 'Ctrl-5',
    header6: 'Ctrl-6',
    // format
    bold: 'Ctrl-B',
    code: 'Ctrl-;',
    em: 'Ctrl-E',
    em2: 'Alt-E',
    colon: 'Alt-C',
    toUpperCase: 'Ctrl-Alt-U',
    toLowerCase: 'Ctrl-Alt-L',
    addStar: 'Alt-S',
    // quotation: "Ctrl-'", // 这个快捷键不能用
    // italic: 'Ctrl-I',
    // link: 'Ctrl-L',
    // insert
    insertFencedCode: 'Ctrl-Alt-F',
    insertImage: 'Ctrl-Alt-I',
    insertMath: 'Ctrl-Alt-M',
    insertNewLineUp: 'Shift-Ctrl-Enter', // Ctrl-Shift-Enter doesn't work
    insertNewLineDown: 'Ctrl-Enter',
    // line
    copyCurLineDown: 'Shift-Alt-Down',
    copyCurLineUp: 'Shift-Alt-Up',
    exchangeCurLineUp: 'Alt-Up',
    exchangeCurLineDown: 'Alt-Down',
    // other
    alt: 'Alt', // just to prevent the cursor becoming cross when type alt
  };

  const mergedKeyMap = Object.assign(defaultKeyMap, keyMap);

  // 快捷键
  editor.cm.addKeyMap({
    // header
    [mergedKeyMap.removeHeader]: (cm) => {
      const doc = cm.getDoc();
      const selection = doc.getSelection();
      if (selection) {
        // 有选中
        doc.replaceSelection(
          selection.split('\n').map(lineText => changeLineTextHash(lineText, 'REMOVE')).join('\n'),
          'around'
        );
      } else {
        // 无选中
        const cursor = doc.getCursor();
        const lineText = doc.getLine(cursor.line);
        doc.replaceRange(
          changeLineTextHash(lineText, 'REMOVE'),
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: lineText.length },
        );
      }
      editor.messager.success('移除标题');
    },
    [mergedKeyMap.header1]: cm => changeHeader(1, editor, cm),
    [mergedKeyMap.header2]: cm => changeHeader(2, editor, cm),
    [mergedKeyMap.header3]: cm => changeHeader(3, editor, cm),
    [mergedKeyMap.header4]: cm => changeHeader(4, editor, cm),
    [mergedKeyMap.header5]: cm => changeHeader(5, editor, cm),
    [mergedKeyMap.header6]: cm => changeHeader(6, editor, cm),

    // format
    [mergedKeyMap.bold]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const sel = doc.getSelection();
      if (sel) {
        const matchRes = sel.match(/^\*\*(.*?)\*\*$/);
        if (matchRes) {
          doc.replaceSelection(matchRes[1]);
        } else {
          doc.replaceSelection(`**${sel}**`);
        }
      } else {
        doc.replaceRange('**b**', cursor);
        doc.setSelection(
          { line: cursor.line, ch: cursor.ch + 2 },
          { line: cursor.line, ch: cursor.ch + 3 },
        );
      }
    },

    [mergedKeyMap.em]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const sel = doc.getSelection();
      if (sel) {
        const matchRes = sel.match(/^\*(.*?)\*$/);
        if (matchRes) { // 移除
          doc.replaceSelection(matchRes[1]);
        } else { // 添加
          doc.replaceSelection(`*${sel}*`);
          editor.playAudio('addEmphasis');
        }
      } else {
        doc.replaceRange('*e*', cursor);
        doc.setSelection(
          { line: cursor.line, ch: cursor.ch + 1 },
          { line: cursor.line, ch: cursor.ch + 2 },
        );
      }
    },

    [mergedKeyMap.em2]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const sel = doc.getSelection();
      if (sel) {
        const matchRes = sel.match(/^\*(.*?)\*$/);
        if (matchRes) {
          doc.replaceSelection(matchRes[1]);
        } else {
          doc.replaceSelection(`*${sel}*`);
          editor.playAudio('addEmphasis');
        }
      } else {
        doc.replaceRange('*e*', cursor);
        doc.setSelection(
          { line: cursor.line, ch: cursor.ch + 1 },
          { line: cursor.line, ch: cursor.ch + 2 },
        );
      }
    },

    [mergedKeyMap.italic]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const sel = doc.getSelection();
      if (sel) {
        const matchRes = sel.match(/^_(.*?)_$/);
        if (matchRes) {
          doc.replaceSelection(matchRes[1]);
        } else {
          doc.replaceSelection(`_${sel}_`);
        }
      } else {
        doc.replaceRange('_i_', cursor);
        doc.setSelection(
          { line: cursor.line, ch: cursor.ch + 1 },
          { line: cursor.line, ch: cursor.ch + 2 },
        );
      }
    },

    [mergedKeyMap.code]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const sel = doc.getSelection();
      if (sel) {
        const matchRes = sel.match(/^`(.*?)`$/);
        if (matchRes) {
          doc.replaceSelection(matchRes[1]);
        } else {
          doc.replaceSelection(`\`${sel}\``);
        }
      } else {
        doc.replaceRange('`c`', cursor);
        doc.setSelection(
          { line: cursor.line, ch: cursor.ch + 1 },
          { line: cursor.line, ch: cursor.ch + 2 },
        );
      }
    },

    [mergedKeyMap.link]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const sel = doc.getSelection();
      if (sel) {
        const matchRes = sel.match(/^\[(.*?)\]$/);
        if (matchRes) {
          doc.replaceSelection(matchRes[1]);
        } else {
          doc.replaceSelection(`[${sel}]`);
        }
      } else {
        doc.replaceRange('[l]', cursor);
        doc.setSelection(
          { line: cursor.line, ch: cursor.ch + 1 },
          { line: cursor.line, ch: cursor.ch + 2 },
        );
      }
    },

    [mergedKeyMap.colon]: (cm) => {
      editor.playAudio('addColon');
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const sel = doc.getSelection();
      if (sel) {
        doc.replaceSelection(': ');
      } else {
        doc.replaceRange(': ', cursor);
      }
    },

    [mergedKeyMap.toUpperCase]: (cm) => {
      const doc = cm.getDoc();
      const sel = doc.getSelection();
      if (sel) {
        doc.replaceSelection(sel.toUpperCase());
      } else {
        const cursor = doc.getCursor();
        const lineText = cm.lineInfo(cursor.line).text;
        doc.replaceRange(
          lineText.toUpperCase(),
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: lineText.length },
        );
      }
    },

    [mergedKeyMap.toLowerCase]: (cm) => {
      const doc = cm.getDoc();
      const sel = doc.getSelection();
      if (sel) {
        doc.replaceSelection(sel.toLowerCase());
      } else {
        const cursor = doc.getCursor();
        const lineText = cm.lineInfo(cursor.line).text;
        doc.replaceRange(
          lineText.toLowerCase(),
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: lineText.length },
        );
      }
    },

    [mergedKeyMap.addStar]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const lineText = cm.lineInfo(cursor.line).text;
      let newLineText = '';
      if (lineText.endsWith(' ⭐')) {
        newLineText = lineText.replace(/\s⭐$/, '');
      } else {
        newLineText = `${lineText} ⭐`;
      }
      doc.replaceRange(
        newLineText,
        { line: cursor.line, ch: 0 },
        { line: cursor.line, ch: lineText.length },
      );
    },

    // insert
    [mergedKeyMap.insertMath]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const sel = doc.getSelection();
      if (sel) {
        const matchRes = sel.match(/\$([^$]+?)\$$/);
        if (matchRes) {
          doc.replaceSelection(matchRes[1]);
        } else {
          doc.replaceSelection(`$${sel}$`);
        }
      } else {
        doc.replaceRange('$m$', cursor);
        doc.setSelection(
          { line: cursor.line, ch: cursor.ch + 1 },
          { line: cursor.line, ch: cursor.ch + 2 },
        );
      }
    },

    [mergedKeyMap.insertFencedCode]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      doc.replaceRange('```\n```', cursor);
      doc.setCursor({ line: cursor.line, ch: 3 });
    },

    [mergedKeyMap.insertImage]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      doc.replaceRange('![]()', cursor);
      doc.setCursor({ line: cursor.line, ch: 4 });
    },

    [mergedKeyMap.insertNewLineDown]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const lineTextLen = cm.lineInfo(cursor.line).text.length;
      doc.replaceRange(
        '\n',
        { line: cursor.line, ch: lineTextLen },
        { line: cursor.line, ch: lineTextLen },
      );
      doc.setCursor({ line: cursor.line + 1, ch: 0 });
    },

    [mergedKeyMap.insertNewLineUp]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      if (cursor.line > 0) {
        const lineTextLen = cm.lineInfo(cursor.line - 1).text.length;
        doc.replaceRange(
          '\n',
          { line: cursor.line - 1, ch: lineTextLen },
          { line: cursor.line - 1, ch: lineTextLen },
        );
        doc.setCursor({ line: cursor.line, ch: 0 });
      }
    },

    // line
    [mergedKeyMap.copyCurLineUp]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const lineText = cm.lineInfo(cursor.line).text;
      doc.replaceRange(
        `${lineText}\n`,
        { line: cursor.line, ch: 0 },
        { line: cursor.line, ch: 0 },
      );
      doc.setCursor({ line: cursor.line, ch: cursor.ch });
    },

    [mergedKeyMap.copyCurLineDown]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const lineText = cm.lineInfo(cursor.line).text;
      doc.replaceRange(
        `\n${lineText}`,
        { line: cursor.line, ch: lineText.length },
        { line: cursor.line, ch: lineText.length },
      );
      doc.setCursor({ line: cursor.line + 1, ch: cursor.ch });
    },

    [mergedKeyMap.exchangeCurLineUp]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      if (cursor.line > 0) {
        const lineTextCur = cm.lineInfo(cursor.line).text;
        const lineTextUp = cm.lineInfo(cursor.line - 1).text;
        doc.replaceRange(
          lineTextCur,
          { line: cursor.line - 1, ch: 0 },
          { line: cursor.line - 1, ch: lineTextUp.length },
        );
        doc.replaceRange(
          lineTextUp,
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: lineTextCur.length },
        );
        doc.setCursor({ line: cursor.line - 1, ch: cursor.ch });
      }
    },

    [mergedKeyMap.exchangeCurLineDown]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const lastLineNum = doc.lastLine();
      if (cursor.line < lastLineNum) {
        const lineTextCur = cm.lineInfo(cursor.line).text;
        const lineTextDown = cm.lineInfo(cursor.line + 1).text;
        doc.replaceRange(
          lineTextDown,
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: lineTextCur.length },
        );
        doc.replaceRange(
          lineTextCur,
          { line: cursor.line + 1, ch: 0 },
          { line: cursor.line + 1, ch: lineTextDown.length },
        );
        doc.setCursor({ line: cursor.line + 1, ch: cursor.ch });
      }
    },

    // other
    [mergedKeyMap.alt]: () => {
    },
  });

  // 事件
  editor.cm.on('beforeChange', (cm, change) => {
    // 粘贴后智能格式化
    if (change.origin === 'paste') {
      const doc = editor.cm.getDoc();
      const cursor = doc.getCursor();
      const curLineText = doc.getLine(cursor.line);

      const targetLineMatchRes = curLineText.match(/^(#+)\s$/);
      if (targetLineMatchRes && targetLineMatchRes[1]) {
        const targetLv = targetLineMatchRes[1].length;
        if (change.text && change.text[0]) {
          const sourceTextMatchRes = change.text[0].match(/^(#+)\s/);
          if (sourceTextMatchRes && sourceTextMatchRes[1]) {
            const sourceLv = sourceTextMatchRes[1].length;
            const diffLv = sourceLv - targetLv;
            const newText = change.text.map((line, index) => {
              if (index === 0) return line.replace(/^(#+)\s/, '');
              const lineMatchRes = line.match(/^(#+)\s/);
              if (lineMatchRes && lineMatchRes[1]) {
                const curLineLv = lineMatchRes[1].length;
                const newLineHeader = `${'#'.repeat((curLineLv - diffLv))} `;
                return line.replace(/^(#+)\s/, newLineHeader);
              }
              return line;
            });
            change.update(null, null, newText);
            editor.messager.success('已智能格式化到指定等级');
          }
        }
      }
    }
  });
}

/**
 * 改变header
 * @param {number} headerLv
 * @param {InkEditor} editor
 * @param {CodeMirror.Editor} cm
 */
function changeHeader(headerLv, editor, cm) {
  const doc = cm.getDoc();
  const cursor = doc.getCursor();
  const selection = doc.getSelection();
  if (selection) {
    // 有选中
    const selectionArr = selection.split('\n');
    let hasHeader = false; // 选中的文本中包含标题
    for (const lineText of selectionArr) {
      if (editor.isThisTextAHeader(lineText)) {
        hasHeader = true;
        break;
      }
    }
    // 选中的有标题: 只改变标题等级
    let newText = '';
    if (hasHeader) {
      newText = selectionArr.map((lineText) => {
        if (editor.isThisTextAHeader(lineText)) { // 改变标题行
          return changeLineTextHash(lineText, 'CHANGETO', headerLv);
        }
        return lineText;
      }).join('\n');
    } else {
      // 选中的没有标题: 修改所有选中的文本行
      newText = selectionArr.map(lineText => changeLineTextHash(lineText, 'CHANGETO', headerLv)).join('\n');
    }
    doc.replaceSelection(newText, 'around');
  } else {
    // 没有选中
    const lineText = doc.getLine(cursor.line);
    const curHeaderLv = editor.getHeaderLvByStr(lineText);
    let newText = '';
    switch (curHeaderLv) {
      case headerLv: // 当前标题headerLv, 就是目标headerLv. 则移除header
        newText = changeLineTextHash(lineText, 'REMOVE');
        break;
      default: // 不是标题, 或者标题不是目标headerLv. 则都转换为目标headerLv
        newText = changeLineTextHash(lineText, 'CHANGETO', headerLv);
        break;
    }
    doc.replaceRange(
      newText,
      { line: cursor.line, ch: 0 },
      { line: cursor.line, ch: lineText.length },
    );
    doc.setCursor({
      line: cursor.line,
      ch: doc.getLine(cursor.line).length,
    });
  }
}

/**
 * 给文本添加或删除hash
 * @param {string} lineText 原来的文本
 */
/**
 *
 * @param {string} lineText 原来的文本
 * @param {'CHANGETO' | 'REMOVE'} action
 *  CHANGETO: 修改到指定等级
 *  REMOVE: 移除开头的所有####
 * @param {number} hashNum 要添加的#的个数
 * @returns {string} 修改后的文本
 */
function changeLineTextHash(lineText, action, hashNum) {
  switch (action) {
    case 'CHANGETO': {
      lineText = lineText.replace(/^#+\s/, '');
      return `${'#'.repeat(hashNum)} ${lineText}`;
    }
    case 'REMOVE': {
      return lineText.replace(/^#+\s/, '');
    }
    default:
      return undefined;
  }
}
