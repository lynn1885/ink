// 用于对当前行中cursor之前的文本进行替换, 可以和讯飞语音输入法搭配使用

// 快捷键
const map = {
  replaceLine: 'Alt-N',
};

// 导出
export default function (editor, config) {
  // 加载插件时: 获取用户配置
  let textReplaceMap = {};
  let textReplaceMapKeys = [];
  if (config) {
    textReplaceMap = config;
    textReplaceMapKeys = Object.keys(textReplaceMap);
  }

  // 按下快捷键时
  editor.cm.addKeyMap({
    [map.replaceLine]: (cm) => {
      // 读取配置文件中的配置
      const tMap = {};
      const curDir = editor.fileServer.curFileDir;
      for (let i = 0; i < textReplaceMapKeys.length; i += 1) {
        if (curDir.toLowerCase().includes(textReplaceMapKeys[i].toLowerCase())) {
          Object.assign(tMap, textReplaceMap[textReplaceMapKeys[i]]);
        }
      }

      // 读取stickyNote中的配置
      const stickyNote = localStorage.getItem('stickyNoteContent'); // 注意这里利用了sticky note模块的内部原理(存储的位置)
      if (stickyNote) {
        const lineArr = stickyNote.split('\n');
        const replaceLineObj = {};
        let isReplaceLine = false;
        // eslint-disable-next-line no-restricted-syntax
        for (const line of lineArr) {
          if (isReplaceLine && line !== '<===') {
            const arr = line.split(/,|:/);
            if (arr.length === 2) {
              [, replaceLineObj[arr[0]]] = arr;
            } else if (arr.length === 3) {
              [, , replaceLineObj[arr[0]]] = arr;
              [, , replaceLineObj[arr[1]]] = arr;
            }
          }
          if (line === '===>') {
            isReplaceLine = true;
          } else if (line === '<===') {
            break;
          }
        }
        Object.assign(tMap, replaceLineObj);
      }

      // 执行替换
      if (tMap) {
        const cursor = cm.getCursor();
        const doc = cm.getDoc();
        let lineText = cm.lineInfo(cursor.line).text;
        const oldLineTextLen = lineText.length;
        const tMapKeys = Object.keys(tMap);
        for (let i = 0; i < tMapKeys.length; i += 1) {
          lineText = lineText.replace(new RegExp(tMapKeys[i], 'g'), tMap[tMapKeys[i]]);
        }
        doc.replaceRange(
          lineText,
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: Math.max(oldLineTextLen, lineText.length) },
        );
      }
    },
  });
}
