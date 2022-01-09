import $ from 'jquery';

/**
 * 插件函数
 * @param {object} editor 编辑器对象
 * @param {object} config 配置对象
 * config.upload: 用于给服务器上传图片的异步函数, 需要外部传入
 * config.messager: 通知器, 用于给upload函数使用
 */
export default function (editor, config) {
  // drag & drop & paste image
  editor.cm.on('drop', async (cm, e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0]; // just allow upload one file once time
    if (file) {
      const formData = new FormData();
      formData.append('file', file); // don't modify the argu value 'file', sever will use this value to receive file
      await _upload(formData, editor, config.upload, config.messager);
    }
  });
  editor.cm.on('paste', async (cm, e) => {
    const formData = new FormData();
    const item = e.clipboardData.items[0];
    if (item && item.type.includes('image')) {
      e.preventDefault();
      formData.append('file', item.getAsFile()); // don't modify the argu value 'file', sever will use this value for receive file
      await _upload(formData, editor, config.upload, config.messager);
    }
  });

  // 手动上传图片函数
  editor.uploadImg = async function uploadImg(base64Str, fileName) {
    const matchRes = base64Str.match(/data:(.+?);/);
    if (matchRes && matchRes.length) {
      const fileType = matchRes[1];
      const imgFile = convertBase64ToImgFile(base64Str, 'paint', fileType);
      const formData = new FormData();
      formData.append('file', imgFile);
      await _upload(formData, editor, config.upload, config.messager, fileName);
    }
  };

  // render image
  editor.cm.on('renderLine', (cm, line, el) => {
    if (line.text !== line.lastTimeText_image) {
      line.lastTimeText_image = line.text;
      const imgMatchRes = line.text.match(/^!\[(.*?)\]\((.*?)\)/);
      if (imgMatchRes) {
        let baseUrl = '';
        baseUrl = `${editor.fileServer.staticImagesUrl}`;
        el.classList.add('line-cm-image');
        let isSmallImage = false;
        if (line && line.text.endsWith(';')) { // 以';结尾的图片, 缩小显示
          el.classList.add('line-cm-image-small');
          isSmallImage = true;
        }
        setTimeout(() => {
          if (line.widgets) {
            line.widgets.forEach((w) => {
              w.clear();
            });
          }
          const img = $('<img style="visibility:hidden"></img>');
          const imgWidget = $(`<div class="inserted-widget-image ${isSmallImage ? 'inserted-widget-image-small' : ''}"></div>`);
          imgWidget.append(img);
          // 解析贴纸
          const imgName = imgMatchRes[1];
          const imgCss = {
            transform: ''
          };
          const imgWidgetCss = {};
          if (imgName) {
            const attrs = imgName.split(';');
            if (attrs.includes('贴纸')) {
              imgWidgetCss.position = 'absolute';
              if (attrs[1]) {
                const scale = Number.parseFloat(attrs[1]);
                imgCss.transform = `scale(${scale})`;
              }
              if (attrs[2]) {
                imgWidgetCss.left = `${attrs[2]}px`;
              }
              if (attrs[3]) {
                imgWidgetCss.top = `${attrs[3]}px`;
              }
              if (attrs[4] === '-') {
                imgCss.transform += ' rotateY(180deg)';
                imgCss.transform = imgCss.transform.trim();
              }
            }
          }
          imgWidget.css({
            width: 'fit-content',
            cursor: 'pointer',
            ...imgWidgetCss
          });
          // don't know why the picture is bigger than the real size
          // scale it to 81% here
          img.on('load', () => {
            img.css({
              width: `${img[0].naturalWidth * 0.81}px`,
              visibility: 'visible',
              ...imgCss
            });
          });
          img.attr('src', baseUrl + imgMatchRes[2]);
          editor.cm.getDoc().addLineWidget(line, imgWidget[0]);
        }, 0);
      }
    }
  });
}

/**
 * upload: 上传图片. 内部函数, 供插件调用
 * @param {object} formData 图片数据
 * @param {object} editor editor对象
 * @param {function} upload 上传图片的函数, 从外部传入, 需要是个异步函数
 * @param {function} messager 通知器
 * @param {string} fileName 文件名, 仅用于笔记中显示
 */
async function _upload(formData, editor, upload, messager, fileName) {
  formData.set('fileDir', editor.fileServer.curFileDir);
  const imgInfo = await upload(formData, messager);
  const doc = editor.cm.getDoc();
  const cursor = doc.getCursor();
  const lineNum = cursor.line;
  const lineText = doc.getLine(lineNum);
  let beforeText = '';
  let endText = '';
  let addLineNum;
  let startChar = lineText.length;
  if (!lineText) {
    // empty line
    beforeText = '';
    addLineNum = 1;
  } else if (cursor.ch === lineText.length) {
    // The cursor is at the end of a line.
    beforeText = '\n';
    addLineNum = 2;
  } else {
    // The cursor is in the middle of a line.
    beforeText = `${lineText.slice(0, cursor.ch)}\n`;
    endText = lineText.slice(cursor.ch, lineText.length);
    startChar = 0;
    addLineNum = 2;
  }
  doc.replaceRange(`${beforeText}![${fileName || ''}](${imgInfo.dir}/${imgInfo.fileName})\n${endText}`, { line: lineNum, ch: startChar }, { line: lineNum, ch: lineText.length });
  doc.setCursor({ line: lineNum + addLineNum, ch: 0 });
}

// 把base64字符串转换为img文件
function convertBase64ToImgFile(base64Str, fileName, fileType) {
  base64Str = base64Str.substring(base64Str.indexOf(',') + 1); // 图片base64, 要先去掉开头的data:image/gif;头部
  const bytes = window.atob(base64Str); // 解码base64
  const ab = new ArrayBuffer(bytes.length);
  const ia = new Int8Array(ab);
  for (let index = 0; index < bytes.length; index += 1) {
    ia[index] = bytes.charCodeAt(index);
  }

  const blob = new Blob([ab], { type: fileType });
  blob.lastModifiedDate = new Date();
  blob.name = fileName;
  return blob;
}
