// 用于折叠代码
const map = {
  foldHeaderToHeader1: 'Ctrl-Alt-1',
  foldHeaderToHeader2: 'Ctrl-Alt-2',
  foldHeaderToHeader3: 'Ctrl-Alt-3',
  foldHeaderToHeader4: 'Ctrl-Alt-4',
  foldHeaderToHeader5: 'Ctrl-Alt-5',
  foldHeaderToHeader6: 'Ctrl-Alt-6',
  unfoldAll: 'Ctrl-Alt-0',
  foldCode: 'Alt-M',
  foldIntellective: 'Alt-,', // 智能折叠
};

// 导出
export default function (editor) {
  editor.cm.addKeyMap({
    // fold code
    [map.foldCode]: (cm) => {
      const cursor = cm.getCursor();
      const header = editor.getHeaderByCursor(cursor);
      if (header.headerLv > 0) {
        cm.setCursor({ line: header.headerLineNum, ch: header.headerLv + 1 });
      }
      editor.fold(cm.getCursor());
    },

    // fold code to header lv
    [map.unfoldAll]: (cm) => {
      cm.execCommand('unfoldAll');
    },

    [map.foldHeaderToHeader1]: () => {
      editor.foldHeaderTo(1);
    },

    [map.foldHeaderToHeader2]: () => {
      editor.foldHeaderTo(2);
    },

    [map.foldHeaderToHeader3]: () => {
      editor.foldHeaderTo(3);
    },

    [map.foldHeaderToHeader4]: () => {
      editor.foldHeaderTo(4);
    },

    [map.foldHeaderToHeader5]: () => {
      editor.foldHeaderTo(5);
    },

    [map.foldHeaderToHeader6]: () => {
      editor.foldHeaderTo(6);
    },

    [map.foldIntellective]: (cm) => {
      const cursor = cm.getCursor();
      const ancestors = editor.getHeaderAncestors(cursor);
      if (ancestors.length > 0) {
        editor.foldHeaderTo(2);
        ancestors.reverse();
        for (let i = 0; i < ancestors.length - 1; i += 1) {
          editor.fold(ancestors[i].headerLineNum);
        }
        const nearestHeader = ancestors[ancestors.length - 1];
        cm.setCursor({ line: nearestHeader.headerLineNum, ch: nearestHeader.headerLv + 1 });
        cm.scrollIntoView(null, 300);
      }
    },
  });
}
