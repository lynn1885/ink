// 基础快捷键
export default function (editor, keyMap) {
  const defaultKeyMap = {
    // header
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
    toUpperCase: 'Shift-Ctrl-]',
    toLowerCase: 'Shift-Ctrl-[',
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

  editor.cm.addKeyMap({
    // header
    [mergedKeyMap.header1]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const lineText = doc.getLine(cursor.line);
      const matchRes = lineText.match(/^#+?\s/);
      if (matchRes && matchRes[0].length === 2) {
        doc.replaceRange(
          '',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: 2 },
        );
        doc.setCursor({
          line: cursor.line,
          ch: doc.getLine(cursor.line).length,
        });
      } else if (matchRes && matchRes.length !== 2) {
        doc.replaceRange(
          '# ',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: matchRes[0].length },
        );
      } else {
        doc.replaceRange(
          '# ',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: matchRes ? matchRes[0].length : 0 },
        );
        doc.setCursor({
          line: cursor.line,
          ch: doc.getLine(cursor.line).length,
        });
      }
    },

    [mergedKeyMap.header2]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const lineText = doc.getLine(cursor.line);
      const matchRes = lineText.match(/^#+?\s/);
      if (matchRes && matchRes[0].length === 3) {
        doc.replaceRange(
          '',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: 3 },
        );
        doc.setCursor({
          line: cursor.line,
          ch: doc.getLine(cursor.line).length,
        });
      } else if (matchRes && matchRes[0].length !== 3) {
        doc.replaceRange(
          '## ',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: matchRes[0].length },
        );
      } else {
        doc.replaceRange(
          '## ',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: matchRes ? matchRes[0].length : 0 },
        );
        doc.setCursor({
          line: cursor.line,
          ch: doc.getLine(cursor.line).length,
        });
      }
    },

    [mergedKeyMap.header3]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const lineText = doc.getLine(cursor.line);
      const matchRes = lineText.match(/^#+?\s/);
      if (matchRes && matchRes[0].length === 4) {
        doc.replaceRange(
          '',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: 4 },
        );
        doc.setCursor({
          line: cursor.line,
          ch: doc.getLine(cursor.line).length,
        });
      } else if (matchRes && matchRes[0].length !== 4) {
        doc.replaceRange(
          '### ',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: matchRes[0].length },
        );
      } else {
        doc.replaceRange(
          '### ',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: matchRes ? matchRes[0].length : 0 },
        );
        doc.setCursor({
          line: cursor.line,
          ch: doc.getLine(cursor.line).length,
        });
      }
    },

    [mergedKeyMap.header4]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const lineText = doc.getLine(cursor.line);
      const matchRes = lineText.match(/^#+?\s/);
      if (matchRes && matchRes[0].length === 5) {
        doc.replaceRange(
          '',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: 5 },
        );
        doc.setCursor({
          line: cursor.line,
          ch: doc.getLine(cursor.line).length,
        });
      } else if (matchRes && matchRes[0].length !== 5) {
        doc.replaceRange(
          '#### ',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: matchRes[0].length },
        );
      } else {
        doc.replaceRange(
          '#### ',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: matchRes ? matchRes[0].length : 0 },
        );
        doc.setCursor({
          line: cursor.line,
          ch: doc.getLine(cursor.line).length,
        });
      }
    },

    [mergedKeyMap.header5]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const lineText = doc.getLine(cursor.line);
      const matchRes = lineText.match(/^#+?\s/);
      if (matchRes && matchRes[0].length === 6) {
        doc.replaceRange(
          '',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: 6 },
        );
        doc.setCursor({
          line: cursor.line,
          ch: doc.getLine(cursor.line).length,
        });
      } else if (matchRes && matchRes[0].length !== 6) {
        doc.replaceRange(
          '##### ',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: matchRes[0].length },
        );
      } else {
        doc.replaceRange(
          '##### ',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: matchRes ? matchRes[0].length : 0 },
        );
        doc.setCursor({
          line: cursor.line,
          ch: doc.getLine(cursor.line).length,
        });
      }
    },

    [mergedKeyMap.header6]: (cm) => {
      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const lineText = doc.getLine(cursor.line);
      const matchRes = lineText.match(/^#+?\s/);
      if (matchRes && matchRes[0].length === 7) {
        doc.replaceRange(
          '',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: 7 },
        );
        doc.setCursor({
          line: cursor.line,
          ch: doc.getLine(cursor.line).length,
        });
      } else if (matchRes && matchRes[0].length !== 7) {
        doc.replaceRange(
          '###### ',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: matchRes[0].length },
        );
      } else {
        doc.replaceRange(
          '###### ',
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: matchRes ? matchRes[0].length : 0 },
        );
        doc.setCursor({
          line: cursor.line,
          ch: doc.getLine(cursor.line).length,
        });
      }
    },

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
        if (matchRes) {
          doc.replaceSelection(matchRes[1]);
        } else {
          doc.replaceSelection(`*${sel}*`);
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
}
