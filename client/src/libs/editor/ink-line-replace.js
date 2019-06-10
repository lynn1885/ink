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

      // 读取行内配置指令
      const matchRes = editor.getCmdInLastLine(/%text-replace:(.+)%/);
      if (matchRes) {
        if (matchRes[1] && matchRes[1].length >= 3) {
          let cmdStr = matchRes[1];
          const m = {};
          if (cmdStr[cmdStr.length - 1] === ';') {
            cmdStr = cmdStr.slice(0, cmdStr.length - 1);
          }
          const cmdArr = cmdStr.split(';');

          for (let i = 0; i < cmdArr.length; i += 1) {
            const kv = cmdArr[i].split('=');
            if (kv.length === 2) {
              // eslint-disable-next-line prefer-destructuring
              m[kv[0]] = kv[1];
            }
          }
          Object.assign(tMap, m);
        }
      }

      // 执行替换
      if (tMap) {
        const cursor = cm.getCursor();
        const doc = cm.getDoc();
        let lineTextBeforeCursor = cm.lineInfo(cursor.line).text.slice(0, cursor.ch);
        const tMapKeys = Object.keys(tMap);
        for (let i = 0; i < tMapKeys.length; i += 1) {
          lineTextBeforeCursor = lineTextBeforeCursor.replace(new RegExp(tMapKeys[i], 'g'), tMap[tMapKeys[i]]);
        }
        doc.setSelection({ line: cursor.line, ch: 0 }, { line: cursor.line, ch: cursor.ch });
        doc.replaceSelection(lineTextBeforeCursor);
      }
    },
  });
}
