// 用于对当前行中cursor之前的文本进行替换, 可以和讯飞语音输入法搭配使用
import * as pinyin from 'pinyin';

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

  // 函数
  const keyMapFns = {
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
            const arr = line.split(/:/);
            if (arr && arr.length) {
              arr[1] = arr.slice(1).join(':');
              [, replaceLineObj[arr[0]]] = arr;
            }
            // if (arr.length === 2) {
            // [, replaceLineObj[arr[0]]] = arr;
            // } else if (arr.length === 3) {
            //   [, , replaceLineObj[arr[0]]] = arr;
            //   [, , replaceLineObj[arr[1]]] = arr;
            // }
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
        const oldCursorCh = cursor.ch;
        const doc = cm.getDoc();
        let lineText = cm.lineInfo(cursor.line).text;
        const oldLineTextLen = lineText.length;
        const tMapKeys = Object.keys(tMap);

        // 获取拼音
        const linePinyinArr = []; // 拼音数组
        const lineOriTextArr = []; // 对应文字数组

        Array.from(lineText).forEach((letter) => {
          lineOriTextArr.push(letter);
          const p = pinyin(letter, {
            style: pinyin.STYLE_NORMAL
          })[0][0].toLowerCase();
          linePinyinArr.push(p);
        });

        for (let i = 0; i < tMapKeys.length; i += 1) {
          // 替换拼音
          if (tMapKeys[i].startsWith('[拼音]')) {
            try {
              const replacePinYin = tMapKeys[i].toLowerCase().replace('[拼音]', '').split('|');
              const replaceText = tMap[tMapKeys[i]];

              const afterReplaceLine = [];
              for (let index = 0; index < lineOriTextArr.length; index += 1) {
                // console.log(index);
                // 对比拼音, 看是否能够替换
                let canReplace = true;
                for (let j = 0; j < replacePinYin.length; j += 1) {
                  // console.log(replacePinYin[j], linePinyinArr[index + j]);
                  if (replacePinYin[j] !== linePinyinArr[index + j]) {
                    canReplace = false;
                    break;
                  }
                }

                // 能替换
                if (canReplace) {
                  afterReplaceLine.push(replaceText);
                  index += (replacePinYin.length - 1); // 替换文字后跳过
                  // console.log('替换');
                } else {
                  afterReplaceLine.push(lineOriTextArr[index]); // 不替换文字, 原样放回
                }
              }

              lineText = afterReplaceLine.join('');
            } catch (error) {
              console.warn('拼音替换错误: ', error);
            }
            continue;
          }

          // 普通替换
          if (tMapKeys[i].startsWith('[忽略大小写]')) {
            lineText = lineText.replace(new RegExp(tMapKeys[i].replace(/^\[忽略大小写\]/, ''), 'ig'), tMap[tMapKeys[i]]);
          } else {
            lineText = lineText.replace(new RegExp(tMapKeys[i], 'g'), tMap[tMapKeys[i]]);
          }
        }

        // 换行替换, 把\n替换成换行, 并添加## 标题 或1. 2. 3.标号
        const headerMatch = lineText.match(/^#+\s|^[0-9]\.\s/) || [''];
        const headerStr = headerMatch[0];
        lineText = lineText.replace(/智能\\n/g, `\n${headerStr}`);
        lineText = lineText.replace(/\\n/g, '\n');
        const lineTextArr = lineText.split('\n');

        editor.playAudio('replace');
        doc.replaceRange(
          lineText,
          { line: cursor.line, ch: 0 },
          { line: cursor.line, ch: Math.max(oldLineTextLen, lineText.length) },
        );

        // 设置光标位置
        cm.setCursor({ line: cursor.line + (lineTextArr.length - 1), ch: oldCursorCh === oldLineTextLen ? Math.max(oldLineTextLen, lineText.length) : oldCursorCh });
      }
    },
  };

  // 按下快捷键时
  editor.cm.addKeyMap({
    ...keyMapFns
  });

  // 添加函数调用
  Object.keys(map).forEach((key) => {
    editor.keyMapFns[key] = () => keyMapFns[map[key]](editor.cm);
  });
}
