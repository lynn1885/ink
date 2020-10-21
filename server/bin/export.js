const fs = require('fs');
const path = require('path');
const readline = require('readline');
const fse = require('fs-extra');


const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 配置源目录
const oriRootPath = '../user/';
const oriNotesPath = path.join(oriRootPath, 'notes');
const oriImagesPath = path.join(oriRootPath, 'images');

let distRootPath;
let distNotesPath;
let distImagesPath;

// 创建导出目录
readlineInterface.question('请输入您要导出到哪里: ', (answer) => {
  if (!fs.existsSync(answer)) {
    console.error('[错误] 您要导出到的目录不存在: ', answer);
  } else {
    distRootPath = path.join(answer, 'export-notes');
    distNotesPath = path.join(distRootPath, 'notes');
    distImagesPath = path.join(distRootPath, 'images');
    if (!fs.existsSync(distRootPath)) fs.mkdirSync(distRootPath);
    if (!fs.existsSync(distNotesPath)) fs.mkdirSync(distNotesPath);
    if (!fs.existsSync(distImagesPath)) fs.mkdirSync(distImagesPath);
    exportNotes();
  }
});

// 导出笔记
function exportNotes() {
  readlineInterface.question('请输入你想导出的笔记: ', async (notePath) => {
    const exportNotePath = path.join(oriNotesPath, notePath);

    // 导出文本
    if (fs.existsSync(exportNotePath)) {
      console.log('即将导出: ', exportNotePath);
    } else {
      console.error('[错误] 要导出的目录不存在: ', exportNotePath);
    }

    try {
      await fse.copy(exportNotePath, path.join(distNotesPath, notePath));
      console.log('笔记导出成功...');
    } catch (err) {
      console.error('[错误] 文本导出失败', err);
    }

    // 导出图片
    const imgRegExp = /^!\[\]\((.+)\)/;
    function copyNoteImages(dir) {
      const files = fs.readdirSync(dir);
      if (!files.length) return;
      if (fs.statSync(path.join(dir, files[0])).isDirectory()) {
        files.forEach(file => copyNoteImages(path.join(dir, file)));
      } else {
        const frags = dir.split('\\');
        const filePath = `${path.join(dir, frags[frags.length - 1])}.md`;
        console.log('导出图片: ', filePath);
        const noteContent = fs.readFileSync(filePath, 'utf-8');
        const noteLines = noteContent.split('\n');
        noteLines.forEach((line) => {
          line = line.trim();
          const res = line.match(imgRegExp);
          if (res && res.length) {
            fse.copySync(path.join(oriImagesPath, res[1]), path.join(distImagesPath, res[1]));
          }
        });
      }
    }
    copyNoteImages(exportNotePath);

    readlineInterface.close();
  });
}
