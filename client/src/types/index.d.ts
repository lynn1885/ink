interface InkEditor {
  el: HTMLElement,
  curCursorLineNum: number, // 当前光标所在行
  shortcutKeyMap: Object,
  messager: {
    success: MessagerFn,
    info: MessagerFn,
    warning: MessagerFn,
    error: MessagerFn,
  },
  cm: CodeMirror.Editor,
  isThisTextAHeader: (text: string) => boolean
  getHeaderLvByStr: (text: string) => number
}


function MessagerFn(msg: string)