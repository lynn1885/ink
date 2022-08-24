// 快速移动鼠标, 其中包含了一些类似于vim的方式快速移动方式
const map = {
  // home and end
  cursorToHome: 'Alt-U',
  cursorToEnd: 'Alt-I',

  // UDLR
  cursorToUp: 'Alt-K',
  cursorToDown: 'Alt-J',
  cursorToLeft: 'Alt-H',
  cursorToRight: 'Alt-L',

  // headers
  cursorToHeaderParent: 'Alt-A',
  cursorToHeaderPrev: 'Alt-D',
  cursorToHeaderNext: 'Alt-S',

  // others
  cursorToLastLine: 'Alt-E',
  cursorScrollIntoView: 'Alt-V',
  cursorGotoCurHeaderLastLine: 'Alt-C',
};

// export
export default function (editor) {
  editor.cm.addKeyMap({
    [map.cursorToHome]: (cm) => {
      cm.execCommand('goLineLeft');
      const cursor = cm.getCursor();
      const headerLv = editor.getHeaderLvByStr(cm.lineInfo(cursor.line).text);
      if (headerLv) { // 对于header, 把光标移动到行首会忽略###号
        cm.setCursor({ line: cursor.line, ch: headerLv + 1 });
      }
      // api implementation
      // const doc = cm.getDoc();
      // const cursor = doc.getCursor();
      // doc.setCursor({ line: cursor.line, ch: 0 });
    },
    [map.cursorToEnd]: (cm) => {
      cm.execCommand('goLineRight');
      // api implementation
      // const doc = cm.getDoc();
      // const cursor = doc.getCursor();
      // const lineText = cm.lineInfo(cursor.line).text;
      // doc.setCursor({ line: cursor.line, ch: lineText.length });
    },

    [map.cursorToUp]: (cm) => {
      cm.execCommand('goLineUp');
      // const doc = cm.getDoc();
      // const cursor = doc.getCursor();
      // doc.setCursor({ line: cursor.line - 1, ch: cursor.ch });
    },
    [map.cursorToDown]: (cm) => {
      cm.execCommand('goLineDown');
      // const doc = cm.getDoc();
      // const cursor = doc.getCursor();
      // doc.setCursor({ line: cursor.line + 1, ch: cursor.ch });
    },
    [map.cursorToLeft]: (cm) => {
      cm.execCommand('goCharLeft');
      // const doc = cm.getDoc();
      // const cursor = doc.getCursor();
      // if (cursor.ch > 0) {
      //   doc.setCursor({ line: cursor.line, ch: cursor.ch - 1 });
      // }
      // if (cursor.ch === 0) {
      //   doc.setCursor({ line: cursor.line - 1, ch: cm.lineInfo(cursor.line - 1).text.length });
      // }
    },
    [map.cursorToRight]: (cm) => {
      cm.execCommand('goCharRight');
      // const doc = cm.getDoc();
      // const cursor = doc.getCursor();
      // const lineText = cm.lineInfo(cursor.line).text;
      // if (cursor.ch < lineText.length) {
      //   doc.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
      // }
      // if (cursor.ch === lineText.length) {
      //   doc.setCursor({ line: cursor.line + 1, ch: 0 });
      // }
    },

    [map.cursorToLastLine]: (cm) => {
      cm.execCommand('goDocEnd');
      cm.scrollIntoView(null, 350);
      const lastLineNum = cm.getDoc().lastLine();
      const ancestors = editor.getHeaderAncestors({ line: lastLineNum, ch: 0 });
      if (ancestors.length > 0) {
        ancestors.reverse();
        for (let i = 0; i < ancestors.length; i += 1) {
          editor.unfold(ancestors[i].headerLineNum);
        }
      }
    },

    [map.cursorToHeaderParent]: (cm) => {
      const cursor = cm.getCursor();
      const ancestors = editor.getHeaderAncestors(cursor, 1);
      if (ancestors.length > 0) {
        let upHeader;
        if (ancestors.length === 1) {
          [upHeader] = ancestors;
        } else if (ancestors.length === 2 && ancestors[0].isCursorInThisLine) {
          [, upHeader] = ancestors;
        }
        cm.setCursor({ line: upHeader.headerLineNum, ch: upHeader.headerLv + 1 });
      }
    },
    [map.cursorToHeaderPrev]: (cm) => {
      const cursor = cm.getCursor();
      const nexts = editor.getHeaderSiblings(cursor, true, false, 1);
      if (nexts.data.length === 2) {
        if (nexts.data[0].isCursorInThisLine) {
          cm.setCursor({ line: nexts.data[1].headerLineNum, ch: nexts.data[1].headerLv + 1 });
        } else {
          cm.setCursor({ line: nexts.data[0].headerLineNum, ch: nexts.data[0].headerLv + 1 });
        }
      }
    },
    [map.cursorToHeaderNext]: (cm) => {
      const cursor = cm.getCursor();
      const nexts = editor.getHeaderSiblings(cursor, false, true, 1);
      if (nexts.data.length === 2) {
        cm.setCursor({ line: nexts.data[1].headerLineNum, ch: nexts.data[1].headerLv + 1 });
      }
    },

    [map.cursorScrollIntoView]: (cm) => {
      cm.scrollIntoView(cm.cursorCoords(cm.getCursor(), 'local'), -300);
      cm.scrollTo(0, (cm.getScrollInfo().top + cm.cursorCoords().top) - 100);
    },

    [map.cursorGotoCurHeaderLastLine]: (cm) => {
      const headerArr = editor.getHeadersArray();
      const lastLineNum = editor.getHeaderEndAtLineNumByHeaderArray(headerArr, headerArr.lines[editor.getHeaderByCursor().headerLineNum]);
      const lastLineText = cm.getDoc().getLine(lastLineNum);

      cm.getDoc().setCursor({ line: lastLineNum, ch: 0 });
      // // 插入新行
      if (lastLineText.length) {
        editor.keyMapFns.insertNewLineDown();
      }
    }
  });
}
