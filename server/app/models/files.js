const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const docx = require('docx');
const sizeOf = require('buffer-image-size');
const config = require('../../config');
const task = require('../../tools/tasks');
const tools = require('../../tools/tools');
const exportNoteManifest = require('../../res/export-note-manifest.json');

/**
* create
* @param filePath {String} file filePath
*/
exports.create = async filePath => new Promise((resolve, reject) => {
  fs.writeFile(filePath, '', { encoding: 'utf8', flag: 'w' }, (err) => {
    if (err) {
      console.error(err);
      reject(err);
    } else {
      resolve();
    }
  });
});

/**
* read
* @param filePath {String} file filePath
* @return data {string} file data
*/
exports.read = async filePath => new Promise((resolve, reject) => {
  fs.readFile(filePath, { encoding: 'utf8' }, (err, data) => {
    if (err) {
      console.error(err);
      reject(err);
    } else {
      resolve(data);
    }
  });
});

/**
* write
* @param filePath {String} file filePath
* @return data {string} file data
*/
exports.write = async (filePath, data) => new Promise((resolve, reject) => {
  fs.writeFile(filePath, data, { encoding: 'utf8', flag: 'w' }, (err) => {
    if (err) {
      console.error(err);
      reject(err);
    } else {
      resolve();
    }
  });
});

/**
* delete file
* @param filePath {String} file filePath
*/
exports.delete = async filePath => new Promise((resolve, reject) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      reject(err);
    } else {
      resolve();
    }
  });
});

/**
 *
 * @param {string} filePath 文件路径
 * @param {string} oriFileFullNameArr 三级文件路径
 * @param {string} fileName 最后一级文件名
 * @returns
 */
exports.exportNoteZip = async (filePath, oriFileFullNameArr, fileName) => {
  exportNoteManifest.oriFileFullNameArr = oriFileFullNameArr;

  try {
    // 笔记相关文件
    let noteContent = await exports.read(filePath);
    const noteImgs = [];
    const iconFileName = `${fileName}.png`;
    const noteIcon = path.join(config.user.dirs.noteIcons, iconFileName); // 只导出png格式的图标

    // 读取图片
    let imgIndex = 1;
    const noteContentArr = noteContent.split('\n');
    noteContentArr.forEach((line, index) => {
      if (line.startsWith('!')) {
        const matchRes = line.match(/!\[.*?\]\((.+?)\)/);
        if (matchRes && matchRes.length && matchRes[1]) {
          const imgNewName = imgIndex + path.extname(matchRes[1]);
          imgIndex += 1;

          const replaceImgText = matchRes[0].replace(matchRes[1], imgNewName);

          noteContentArr[index] = line.replace(matchRes[0], replaceImgText); // 修改md文本中的图像地址

          const imgFullPath = path.join(config.user.dirs.noteImages, matchRes[1]);
          try {
            noteImgs.push({
              imgNewName,
              imgBuffer: fs.readFileSync(imgFullPath),
            });
          } catch (error) {
            // 读取图片失败
            console.warn('[export file]: 这张图片无法导出或不存在: ', imgFullPath);
            // throw new Error(`读取图片(images)失败: ${imgFullPath}`);
          }
        }
      }
    });

    noteContent = noteContentArr.join('\n');

    // 创建zip
    const zipData = new JSZip();
    // 文本
    zipData.file(exportNoteManifest.noteFileName, noteContent);
    zipData.file('manifest.json', JSON.stringify(exportNoteManifest, null, 4));
    // 图像
    const images = zipData.folder(exportNoteManifest.imagesFolder);
    noteImgs.forEach((img) => {
      images.file(img.imgNewName, img.imgBuffer);
    });
    // 图标
    try {
      const icons = zipData.folder(exportNoteManifest.iconsFolder);
      icons.file(iconFileName, fs.readFileSync(noteIcon));
    } catch (error) {
      // 添加图标失败
      // throw new Error(`读取图标(icons)失败: ${noteIcon}`);
    }

    return zipData;
  } catch (error) {
    console.log('[export note]导出文件失败: ', error);
    throw new Error(error);
  }
};

/**
 *
 * @param {string} filePath 文件路径
 * @param {string} oriFileFullNameArr 三级文件路径
 * @param {string} fileName 最后一级文件名
 * @returns
 */
exports.exportNoteDocx = async (filePath, oriFileFullNameArr, fileName) => {
  exportNoteManifest.oriFileFullNameArr = oriFileFullNameArr;

  // const doc = new docx.Document({
  //   sections: [{
  //     properties: {},
  //     children: txt.split('\n').map(t => new docx.Paragraph({
  //       text: t,
  //     }))
  //   }],
  // });

  // docx.Packer.toBuffer(doc).then((buffer) => {
  //   fs.writeFileSync(`./${psgName.replace('.txt', '')}.docx`, buffer);
  // });

  const docxContent = {
    sections: [
      {
        children: [],
      },
    ],
  };

  const paragraphs = docxContent.sections[0].children;

  try {
    // 笔记相关文件
    const noteContent = await exports.read(filePath);

    // 读取图片
    const noteContentArr = noteContent.split('\n');
    noteContentArr.forEach((line) => {
      const headerMatchRes = line.match(/^(#+)\s(.+)/);
      const imgMatchRes = line.match(/!\[.*?\]\((.+?)\)/);

      // 标题
      if (headerMatchRes && headerMatchRes.length && headerMatchRes[1]) {
        const headerLv = headerMatchRes[1].length;
        paragraphs.push(
          new docx.Paragraph({
            heading: docx.HeadingLevel[`HEADING_${headerLv}`],
            // alignment: headerLv < 2 ? docx.AlignmentType.CENTER : docx.AlignmentType.LEFT,
            indent: {
              left: headerLv * 10,
            },
            children: [
              new docx.TextRun({
                text: headerMatchRes[2],
                bold: true,
                font: '.PingFangSC',
                // color: 'FF0000',

              }),
            ],
          }),
        );
        // 图片
      } else if (imgMatchRes && imgMatchRes.length && imgMatchRes[1]) {
        const imgFullPath = path.join(config.user.dirs.noteImages, imgMatchRes[1]);

        const imgBuffer = fs.readFileSync(imgFullPath);
        const size = sizeOf(imgBuffer);
        if (size.width > 600) {
          size.width = 600;
          size.height = Math.floor(size.height / (size.width / 600));
        }
        paragraphs.push(
          new docx.Paragraph({
            indent: {
              left: 100,
            },
            children: [
              new docx.ImageRun({
                data: imgBuffer,
                transformation: {
                  width: size.width,
                  height: size.height,
                },
              }),
            ],
          }),
        );

        // 普通文本
      } else {
        paragraphs.push(
          new docx.Paragraph({
            indent: {
              left: 100,
            },
            children: [
              new docx.TextRun({
                text: ` ${line}`,
                size: 14,
                font: 'Microsoft YaHei',
              }),
            ],
          }),
        );
      }
    });

    // 生成并导出
    const doc = new docx.Document(docxContent);
    const docxBuffer = await docx.Packer.toBuffer(doc);
    return docxBuffer;
    // fs.writeFileSync('./test.docx', docxBuffer);
  } catch (error) {
    console.log('[export note]导出文件失败 docx: ', error);
    throw new Error(error.message);
  }
};


/**
 *
* @param {File} file zip文件
 * @param {string} notePath 文件路径
 * @param {string} catOrderAfterImport 目录顺序
 * @returns
 */
exports.importNote = async (file, notePath, catOrderAfterImport) => {
  // 校验传入的路径
  const notePathArr = notePath.split('/');
  if (!notePathArr || notePathArr.length !== 3) {
    throw new Error(`路径错误: ${notePath}`);
  }

  // 校验文件是否已经存在
  const noteFullPath = path.join(config.user.dirs.notes, notePath, `${notePathArr[2]}.md`);
  if (fs.existsSync(noteFullPath)) {
    throw new Error(`笔记已存在, 不能重复导入: ${noteFullPath}`);
  }

  // 校验笔记名称
  if (!tools.isFileNameValid(notePathArr[2])) {
    throw new Error(`笔记名称不合法: ${notePathArr[2]}`);
  }

  // 校验图片目录是否已经存在
  const imgsFolder = `${config.importNodeImgPrefix}${Date.now().toString()}`;
  const imgsPath = path.join(config.user.dirs.noteImages, imgsFolder);

  if (fs.existsSync(imgsPath)) {
    throw new Error(`图片目录已存在, 不能重复创建: ${imgsPath}`);
  }

  // 开始导入
  // 创建笔记
  fs.mkdirSync(path.dirname(noteFullPath));
  fs.writeFileSync(noteFullPath, '', { encoding: 'utf8', flag: 'w' });
  await task.unifyCatalog();

  // 创建图片目录
  fs.mkdirSync(imgsPath);

  // 导入zip文件
  const zipFile = await JSZip.loadAsync(file.buffer);
  const files = Object.keys(zipFile.files);

  // 读取manifest
  let manifest = await zipFile.files['manifest.json'].async('string');
  manifest = JSON.parse(manifest);

  // 解压文件
  for (const fileName of files) {
    // 笔记
    if (fileName === manifest.noteFileName) {
      // eslint-disable-next-line no-await-in-loop
      let noteContent = await zipFile.files[fileName].async('string');
      const noteContentArr = noteContent.split('\n');
      // eslint-disable-next-line no-loop-func
      noteContentArr.forEach((line, index) => {
        if (line.startsWith('!')) {
          const matchRes = line.match(/(!\[.*?\]\().+?\)/);
          if (matchRes && matchRes.length && matchRes[1]) {
            noteContentArr[index] = line.replace(matchRes[1], `${matchRes[1] + imgsFolder}/`);
          }
        }
      });
      noteContent = noteContentArr.join('\n');
      fs.writeFileSync(noteFullPath, noteContent, { encoding: 'utf8', flag: 'w' });

      // console.log('写入文本', noteFullPath, noteContent);
      // 图片
    } else if (fileName.startsWith(manifest.imagesFolder) && fileName.length > manifest.imagesFolder.length) {
      const newFileName = fileName.replace(manifest.imagesFolder, '');
      if (newFileName) {
        fs.writeFileSync(
          path.join(imgsPath, newFileName),
          // eslint-disable-next-line no-await-in-loop
          await zipFile.files[fileName].async('nodebuffer'),
        );
      }
      // icon
    } else if (fileName.startsWith(manifest.iconsFolder) && fileName.length > manifest.iconsFolder.length) {
      // const newIconName = fileName.replace(manifest.iconsFolder, '');
      const newIconName = `${notePathArr[2]}.png`;
      if (newIconName) {
        // console.log('写入icon', path.join(config.user.dirs.noteIcons, newIconName));
        fs.writeFileSync(
          path.join(config.user.dirs.noteIcons, newIconName),
          // eslint-disable-next-line no-await-in-loop
          await zipFile.files[fileName].async('nodebuffer'),
        );
      }
    } else {
      // console.log('没有写入的文件: ', fileName);
    }
  }
};
