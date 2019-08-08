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
      formData.append('fileName', file.name);
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

  // render image
  editor.cm.on('renderLine', (cm, line, el) => {
    if (line.text !== line.lastTimeText_image) {
      line.lastTimeText_image = line.text;
      const imgMatchRes = line.text.match(/^!\[.*?\]\((.*?)\)/);
      if (imgMatchRes) {
        let baseUrl = '';
        baseUrl = `${editor.fileServer.staticImageUrl}`;
        el.classList.add('line-cm-image');
        setTimeout(() => {
          if (line.widgets) {
            line.widgets.forEach((w) => {
              w.clear();
            });
          }
          const img = $(`<div class="inserted-widget-image"><img src="${baseUrl}${imgMatchRes[1]}"></div>`)[0];
          editor.cm.getDoc().addLineWidget(line, img);
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
 */
async function _upload(formData, editor, upload, messager) {
  formData.set('fileDir', editor.fileServer.curFileDir);
  const imgInfo = await upload(formData, messager);
  const doc = editor.cm.getDoc();
  const cursor = doc.getCursor();
  doc.replaceRange(`![](${imgInfo.fileName})\n`, { line: cursor.line, ch: 0 }, { line: cursor.line, ch: 999 });
}

