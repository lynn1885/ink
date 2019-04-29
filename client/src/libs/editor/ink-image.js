import $ from 'jquery';

const defaultConfig = {
  isUseFileServer: false,
};

async function upload(formData, editor) {
  formData.set('fileDir', editor.fileServer.curFileDir);
  const imgInfo = await editor.fileServer.uploadImage(formData);
  const doc = editor.cm.getDoc();
  const cursor = doc.getCursor();
  doc.replaceRange(`![](${imgInfo.fileName})\n`, { line: cursor.line, ch: 0 }, { line: cursor.line, ch: 999 });
}

// image plugin
export default function (editor, config) {
  config = Object.assign(defaultConfig, config);
  // drag & drop & paste image
  if (config.isUseFileServer) {
    editor.cm.on('drop', async (cm, e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0]; // just allow upload one file once time
      if (file) {
        const formData = new FormData();
        formData.append('file', file); // don't modify the argu value 'file', sever will use this value to receive file
        formData.append('fileName', file.name);
        await upload(formData, editor);
      }
    });
    editor.cm.on('paste', async (cm, e) => {
      const formData = new FormData();
      const item = e.clipboardData.items[0];
      if (item && item.type.includes('image')) {
        e.preventDefault();
        formData.append('file', item.getAsFile()); // don't modify the argu value 'file', sever will use this value for receive file
        await upload(formData, editor);
      }
    });
  }

  // render image
  editor.cm.on('renderLine', (cm, line, el) => {
    if (line.text !== line.lastTimeText_image) {
      line.lastTimeText_image = line.text;
      const imgMatchRes = line.text.match(/^!\[.*?\]\((.*?)\)/);
      if (imgMatchRes) {
        let baseUrl = '';
        if (config.isUseFileServer) {
          baseUrl = `${editor.fileServer.staticResUrl}`;
        }
        el.classList.add('line-cm-image');
        setTimeout(() => {
          if (line.widgets) {
            line.widgets.forEach((w) => {
              w.clear();
            });
          }
          const img = $(`<img src="${baseUrl}${imgMatchRes[1]}" class="inserted-widget-image">`)[0];
          editor.cm.getDoc().addLineWidget(line, img);
        }, 0);
      }
    }
  });
}
