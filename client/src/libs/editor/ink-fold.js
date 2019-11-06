// fold code

// key map
const map = {
  foldHeaderToHeader1: 'Ctrl-Alt-1',
  foldHeaderToHeader2: 'Ctrl-Alt-2',
  foldHeaderToHeader3: 'Ctrl-Alt-3',
  foldHeaderToHeader4: 'Ctrl-Alt-4',
  foldHeaderToHeader5: 'Ctrl-Alt-5',
  foldHeaderToHeader6: 'Ctrl-Alt-6',
  unfoldAll: 'Ctrl-Alt-0',
  foldCode: 'Alt-M',
  foldIntelligently: 'Alt-,', // 智能折叠
};

// export
export default function (editor) {
  // function library
  // fold code
  const foldCode = (cm) => {
    const cursor = cm.getCursor();
    const header = editor.getHeaderByCursor(cursor);
    if (header.headerLv > 0) {
      cm.setCursor({ line: header.headerLineNum, ch: header.headerLv + 1 });
    }
    editor.toggleFold(cm.getCursor());
  };
  // fold to header
  const unfoldAll = (cm) => {
    cm.execCommand('unfoldAll');
  };
  const foldHeaderToHeader1 = () => {
    editor.foldHeaderTo(1);
  };
  const foldHeaderToHeader2 = () => {
    editor.foldHeaderTo(2);
  };
  const foldHeaderToHeader3 = () => {
    editor.foldHeaderTo(3);
  };
  const foldHeaderToHeader4 = () => {
    editor.foldHeaderTo(4);
  };
  const foldHeaderToHeader5 = () => {
    editor.foldHeaderTo(5);
  };
  const foldHeaderToHeader6 = () => {
    editor.foldHeaderTo(6);
  };
  const foldIntelligently = (cm, isKeepCursorLineExpanded = false) => {
    const cursor = cm.getCursor();
    const ancestors = editor.getHeaderAncestors(cursor);
    if (ancestors.length > 0) {
      editor.foldHeaderTo(2);
      ancestors.reverse();
      if (isKeepCursorLineExpanded) {
        for (let i = 0; i < ancestors.length; i += 1) {
          editor.unfold(ancestors[i].headerLineNum);
        }
        cm.scrollIntoView(null, 300);
      } else {
        for (let i = 0; i < ancestors.length - 1; i += 1) {
          editor.unfold(ancestors[i].headerLineNum);
        }
        const nearestHeader = ancestors[ancestors.length - 1];
        cm.setCursor({ line: nearestHeader.headerLineNum, ch: nearestHeader.headerLv + 1 });
        cm.scrollIntoView(null, 300);
      }
    }
  };

  // add key map
  editor.cm.addKeyMap({
    [map.foldCode]: foldCode,
    [map.unfoldAll]: unfoldAll,
    [map.foldHeaderToHeader1]: foldHeaderToHeader1,
    [map.foldHeaderToHeader2]: foldHeaderToHeader2,
    [map.foldHeaderToHeader3]: foldHeaderToHeader3,
    [map.foldHeaderToHeader4]: foldHeaderToHeader4,
    [map.foldHeaderToHeader5]: foldHeaderToHeader5,
    [map.foldHeaderToHeader6]: foldHeaderToHeader6,
    [map.foldIntelligently]: foldIntelligently,
  });

  // add functions to editor
  // these functions may be called externally
  editor.foldPlugin = {
    foldCode,
    unfoldAll,
    foldHeaderToHeader1,
    foldHeaderToHeader2,
    foldHeaderToHeader3,
    foldHeaderToHeader4,
    foldHeaderToHeader5,
    foldHeaderToHeader6,
    foldIntelligently,
  };
}
