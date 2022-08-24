import CodeMirror from 'codemirror/lib/codemirror';

// markdown config
const markdownConfig = {
  name: 'text/markdown',
  highlightFormatting: true, // https://codemirror.net/mode/markdown/
  xml: false, // close highlight xml
  taskLists: true,
  strikethrough: true,
  // emoji: true,
};

// ink overlay
CodeMirror.defineMode('ink', (config) => {
  const inkOverlay = {
    token(stream) {
      if (stream.match('绿色')) {
        return 'ink-color-green';
      } else if (stream.match('红色')) {
        return 'ink-color-red';
      } else if (stream.match('黄色')) {
        return 'ink-color-yellow';
      } else if (stream.match('蓝色')) {
        return 'ink-color-blue';
      } else if (stream.match('紫色')) {
        return 'ink-color-purple';
      }


      // let a;
      // eslint-disable-next-line no-cond-assign
      while (
        // ((a = stream.next()) && a != null)
        stream.next() != null
        && !stream.match('绿色', false)
        && !stream.match('红色', false)
        && !stream.match('黄色', false)
        && !stream.match('蓝色', false)
        && !stream.match('紫色', false)
      ) {
        // console.log(2, a);
        //
      }
      return null;
      //   token(stream) {
      //     console.log(1);
      //     let ch;
      //     if (stream.match('{{')) {
      //       // eslint-disable-next-line no-cond-assign
      //       while ((ch = stream.next()) != null) {
      //         console.log(3, ch);
      //         if (ch === '}' && stream.next() === '}') {
      //           // stream.eat('}');
      //           return 'ink';
      //         }
      //       }
      //     }

      //     let a;
      //     // eslint-disable-next-line no-cond-assign
      //     while (((a = stream.next()) && a != null) && !stream.match('{{', false)) {
      //       console.log(2, a);
      //       //
      //     }
      //     return null;
      //   }
      // };
    }
  };
  return CodeMirror.overlayMode(CodeMirror.getMode(config, markdownConfig), inkOverlay);
});
