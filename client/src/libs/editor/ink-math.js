// 数学渲染插件
import $ from 'jquery';
import katex from 'katex';
import 'katex/dist/katex.css';
import 'katex/dist/fonts/KaTeX_AMS-Regular.ttf';

export default function (editor, config) { // eslint-disable-line no-unused-vars
  editor.cm.on('renderLine', (cm, line) => {
    if (line.text !== line.lastTimeTextMath) {
      line.lastTimeTextMath = line.text;
      // const r = /\$([^\s][^$]*?[^\s])\$/g;
      const r = /\$([^\s][A-Za-z0-9=+\-_*%`~!#^<>,./\\||()[\]{}?\s→←↑↓±≠∞ΑαΒβΓγΔδΕεΖζΗηΘθΙι℩ΚκΛλΜμΝνΞξΟοΠπΡρΣσςΤτΥυΦφΧχΨψΩω]*?[^\s])\$/g;
      const matchRes = r.exec(line.text);
      if (matchRes) {
        let isClearedOldWidgets = false;
        const doc = editor.cm.getDoc();
        const cursor = doc.getCursor();
        const curLineNum = cm.lineInfo(line).line;

        // loop find all math fragments
        const mathFragments = [
          {
            from: matchRes.index,
            to: matchRes.index + (matchRes[0].length - 1),
            text: matchRes[1],
          },
        ];
        let nextMatchRes = r.exec(line.text);
        while (nextMatchRes) {
          mathFragments.push({
            from: nextMatchRes.index,
            to: nextMatchRes.index + (nextMatchRes[0].length - 1),
            text: nextMatchRes[1],
          });
          nextMatchRes = r.exec(line.text);
        }
        // render math fragments
        const cursorOffset = cursor.ch - 1;
        mathFragments.forEach((item) => {
          if (cursorOffset > item.from && cursorOffset < item.to) {
            setTimeout(() => { // add widgets after DOM rendered to avoid triggering re-renderLine
              if (line.widgets) {
                line.widgets.forEach((w) => {
                  w.clear();
                });
              }
              const $mathEl = $(katex.renderToString(item.text, { throwOnError: false }));
              $mathEl.addClass('ink-math-preview');
              editor.cm.getDoc().addLineWidget(line, $mathEl[0]);
            }, 0);
          } else {
            const $mathEl = $(katex.renderToString(item.text, { throwOnError: false }));
            setTimeout(() => {
              if (!isClearedOldWidgets) {
                if (line.markedSpans) {
                  line.markedSpans.forEach((markedSpan) => {
                    markedSpan.marker.clear();
                  });
                }
                isClearedOldWidgets = true;
              }

              if (line.widgets) {
                line.widgets.forEach((w) => {
                  w.clear();
                });
              }
              // const oldCursor = doc.getCursor();
              const mathWidget = doc.markText(
                { line: curLineNum, ch: item.from },
                { line: curLineNum, ch: item.to + 1 },
                {
                  className: 'ink-math-code',
                  // clearOnEnter: true,
                  // inclusiveRight: true,
                  // inclusiveLeft: true,
                  replacedWith: $mathEl[0],
                },
              );
              // const newCursor = doc.getCursor();
              // if (newCursor.line !== oldCursor.line) {
              //   console.log(oldCursor, newCursor);
              //   console.warn('adjusting cursor');
              //   editor.cm.setCursor(oldCursor.line, 999);
              // }
              mathWidget.on('beforeCursorEnter', () => {
                mathWidget.clear();
              });
            }, 0);
          }
        });
      }
    }
  });
}

// const matchRes = line.text.match(/^\$\$(.*?)\$\$$/);
//     if (matchRes) {
//       el.classList.add('line-cm-math');
//       setTimeout(() => { // add widgets after DOM rendered to avoid triggering re-renderLine
//         if (line.widgets) {
//           line.widgets.forEach((w) => {
//             w.clear();
//           });
//         }
//         const mathHtml = katex.renderToString(matchRes[1]);
//         const math = $(`<div class="inserted-widget-math">${mathHtml}</div>`)[0];
//         editor.cm.getDoc().addLineWidget(line, math);
//       }, 0);
//     }
// line.lastTimeText = line.text;
//       el.classList.add('line-cm-math');
//       let oldMathWidget;
//       if (line.markedSpans) {
//         line.markedSpans.forEach((item) => {
//           item.marker.clear();
//         });
//       }

//       const doc = editor.cm.getDoc();
//       const cursor = doc.getCursor();
//       const curLineNum = cm.lineInfo(line).line;
//       if (cursor.line === curLineNum) {
//         if (cursor.ch < matchRes.index || cursor.ch > matchRes.index + matchRes[0].length) {
//           console.warn('刷新');
//           const $mathEl = $(katex.renderToString(matchRes[1]));
//           setTimeout(() => {
//             doc.markText(
//               { line: curLineNum, ch: matchRes.index },
//               { line: curLineNum, ch: matchRes.index + matchRes[0].length },
//               {
//                 // inclusiveLeft: true,
//                 inclusiveRight: true,
//                 clearOnEnter: true,
//                 className: 'math-code',
//                 replacedWith: $mathEl[0],
//               },
//             );
//           }, 0);
//         }
//       }

//     }
