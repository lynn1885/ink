// 格式化英语单词的快捷键, 和语音输入法搭配使用
const map = {
  normalizeWord: 'Alt-B',
};

// 导出
export default function (editor) {
  editor.cm.addKeyMap({
    [map.normalizeWord]: (cm) => {
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
    },
  });
}

// 工具函数: 替换单词
function replace(text) {
  return text
    // .replace(/[a-zA-Z][a-zA-Z, ，]+/g, match => match.replace(/[, ，]+/g, '').toLowerCase())
    .replace(/[a-zA-Z][a-zA-Z，]+/g, match => match.replace(/[，]+/g, '').toLowerCase())
    .replace(/大写开始，?([a-zA-Z]+)大写结束，?/g, (match, group1) => group1.toUpperCase())
    .replace(/全部大写，?([a-zA-Z]+)/g, (match, group1) => group1.toUpperCase())
    .replace(/大写，?([a-zA-Z])/g, (match, group1) => group1.toUpperCase());
}
