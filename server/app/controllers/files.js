const fs = require('fs');
const path = require('path');
const Files = require('../models/files');
const Directories = require('../models/directories');
const config = require('../../config');
const tools = require('../../tools/tools');

const isEnableConsole = false;
/**
 * get 获取文件
 */
exports.get = async (req, res) => {
  if (!req.query.path) {
    res.status(400).send('错误的path参数');
    return;
  }
  console.log(`${new Date().toLocaleString()}: [read file] `, req.query.path);
  await Files.read(config.user.dirs.notes + req.query.path)
    .then((data) => {
      res.send(data);
    })
    .catch((e) => {
      console.error(e);
      res.status(500).send(`读取文件失败${req.query.path}`);
    });
};

/**
 * update 更新文件内容
 */
exports.update = async (req, res) => {
  // 校验
  if (!req.body.path || typeof req.body.data !== 'string') {
    console.error('update file failed, no path or data: ', req.body);
    res.status(400).send('错误的path或data参数');
    return;
  }

  // 写入
  const filePath = config.user.dirs.notes + req.body.path;
  await Files.write(filePath, req.body.data)
    .then((data) => {
      console.log(`${new Date().toLocaleString()}: [update file] `, req.body.path);
      res.send(data);
    })
    .catch((e) => {
      console.error(e);
      res.status(500).send(`写入文件失败${path}`);
    });

  // 备份文件
  const filePathDir = path.dirname(filePath);
  const files = await Directories.get(filePathDir);
  const backupTimes = [];
  files.forEach((file) => {
    const matchRes = file.match(/^([0-9]+?)\.md$/);
    if (matchRes) {
      backupTimes.push(Number(matchRes[1]));
    }
  });
  const curBackupFilesNumber = backupTimes.length;
  const lastBackupTime = Math.max(...backupTimes);
  const earliestBackupTime = Math.min(...backupTimes);
  const curTime = Math.floor(new Date().valueOf() / 1000); // time unit : second
  if (curBackupFilesNumber > config.maxBackupFilesNumber && earliestBackupTime !== -Infinity) {
    await Files.delete(`${filePathDir}/${earliestBackupTime}.md`)
      .catch((err) => {
        console.error(`Delete backup file failed: ${earliestBackupTime}, ${err}`);
      });
  }
  if (lastBackupTime !== Infinity && curTime - lastBackupTime > config.backupInterval) {
    await Files.write(`${filePathDir}/${curTime}.md`, req.body.data)
      .catch((err) => {
        console.error(`backup file failed: ${path}, ${err}`);
      });
  }
};

// search all files
exports.searchAllFiles = async (req, res) => {
  if (!req.query.fromPath
    || !req.query.isRegExp
    || !req.query.isSensitiveToCase
    || !req.query.searchText
    || !req.query.searchedTextClass
  ) {
    res.status(400).send('错误的参数');
    return;
  }

  const startTime = new Date();
  const allDir = await Directories.getRecursively(config.user.dirs.notes);
  // sort directories
  req.query.searchPath = req.query.searchPath.toLowerCase();
  let sortedPathArr = [];
  const fromPathArr = req.query.fromPath.split('/').slice(0, 3);
  if (isEnableConsole) {
    console.log('fromPathArr: ', fromPathArr);
  }
  if (!req.query.searchPath || `${fromPathArr[0]}/${fromPathArr[1]}/${fromPathArr[2]}`.toLowerCase().includes(req.query.searchPath)) {
    sortedPathArr.push(`${fromPathArr[0]}/${fromPathArr[1]}/${fromPathArr[2]}/${fromPathArr[2]}.md`);
  }
  if (isEnableConsole) {
    console.log('first path: ', sortedPathArr[0]);
  }
  Object.keys(allDir[fromPathArr[0]][fromPathArr[1]]).forEach((file) => {
    if (!req.query.searchPath || `${fromPathArr[0]}/${fromPathArr[1]}/${file}`.toLowerCase().includes(req.query.searchPath)) {
      sortedPathArr.push(`${fromPathArr[0]}/${fromPathArr[1]}/${file}/${file}.md`);
    }
  });
  Object.keys(allDir[fromPathArr[0]]).forEach((dir2) => {
    Object.keys(allDir[fromPathArr[0]][dir2]).forEach((file) => {
      if (!req.query.searchPath || `${fromPathArr[0]}/${dir2}/${file}`.toLowerCase().includes(req.query.searchPath)) {
        sortedPathArr.push(`${fromPathArr[0]}/${dir2}/${file}/${file}.md`);
      }
    });
  });
  Object.keys(allDir).forEach((dir1) => {
    Object.keys(allDir[dir1]).forEach((dir2) => {
      Object.keys(allDir[dir1][dir2]).forEach((file) => {
        if (!req.query.searchPath || `${dir1}/${dir2}/${file}`.toLowerCase().includes(req.query.searchPath)) {
          sortedPathArr.push(`${dir1}/${dir2}/${file}/${file}.md`);
        }
      });
    });
  });
  sortedPathArr = Array.from(new Set(sortedPathArr));
  if (isEnableConsole) {
    console.log('sortedPathArr: ', sortedPathArr, sortedPathArr.length);
  }
  if (sortedPathArr.length === 0) {
    res.status(223).send(`要搜索的路径不存在${req.query.searchPath}`);
    if (isEnableConsole) {
      console.log(`要搜索的路径不存在${req.query.searchPath}`);
    }
    return;
  }
  // search
  const searchRes = [];
  let searchedItemsNum = 0;
  let fileIndex = 0;
  async function _search() {
    let fileContent;
    const curFileRes = {
      dir: `${path.dirname(sortedPathArr[fileIndex])}/`,
      items: [],
    };
    try {
      fileContent = await Files.read(path.join(config.user.dirs.notes, sortedPathArr[fileIndex]));
    } catch (e) {
      console.log(`${new Date().toLocaleString()}: [search all file warning]: cannot open `, sortedPathArr[fileIndex]);
    }
    if (fileContent && typeof fileContent === 'string') {
      const lines = fileContent.split('\n');
      let { searchText } = req.query;
      if (req.query.isSensitiveToCase === 'false') {
        searchText = searchText.toLowerCase();
      }
      // eslint-disable-next-line no-labels
      search: for (let index = 0; index < lines.length; index += 1) {
        let lineText = lines[index];
        const oriLineText = lineText;
        if (req.query.isSensitiveToCase === 'false') {
          lineText = lineText.toLowerCase();
        }
        let lastIndex = -1;
        let isFirstSearch = true;
        do {
          // eslint-disable-next-line no-labels
          if (searchedItemsNum >= config.maxSearchNum) break search;
          lastIndex = lineText.indexOf(
            searchText,
            isFirstSearch ? 0 : lastIndex + searchText.length,
          );
          isFirstSearch = false;
          if (lastIndex > -1) {
            // Intercept 40 words
            const start = lastIndex - 30 < 0 ? 0 : lastIndex - 30;
            const preview = [
              lineText.slice(start, lastIndex),
              `<span class="${req.query.searchedTextClass}">`,
              oriLineText.slice(lastIndex, lastIndex + searchText.length),
              '</span>',
              lineText.slice(
                lastIndex + searchText.length,
                lastIndex + searchText.length + 30,
              ),
            ].join('');
            curFileRes.items.push({
              noteDir: `${path.dirname(sortedPathArr[fileIndex])}/`,
              line: index,
              char: [lastIndex, lastIndex + searchText.length],
              preview,
            });
            searchedItemsNum += 1;
          }
        } while (lastIndex > -1);
      }
    }

    if (curFileRes.items.length > 0) {
      searchRes.push(curFileRes);
    }

    if ((fileIndex + 1) < sortedPathArr.length && searchRes.length < config.maxSearchNum) {
      fileIndex += 1;
      await _search(fileIndex);
    }
  }
  await _search();
  const timeConsumption = new Date() - startTime;

  // search
  console.log(
    `${new Date().toLocaleString()}: [search all file] `,
    'Number of files searched:', fileIndex + 1,
    '\nSearch directory:', req.query.searchPath,
    '\nSearched items number:', searchedItemsNum,
    '\nTime consumption:', timeConsumption,
  );
  res.send({
    searchedFilesNum: fileIndex + 1,
    timeConsumption,
    searchedItemsNum,
    res: searchRes,
  });
};

/**
 * getAllFilesInfoList
 */
exports.getAllFilesInfoList = async (req, res) => {
  console.log(`${new Date().toLocaleString()}: [get all files info]`);
  const allDir = await Directories.getRecursively(config.user.dirs.notes);
  const pathArr = [];
  Object.keys(allDir).forEach((dir1) => {
    Object.keys(allDir[dir1]).forEach((dir2) => {
      Object.keys(allDir[dir1][dir2]).forEach(async (file) => {
        pathArr.push(`${dir1}/${dir2}/${file}/${file}.md`);
      });
    });
  });

  // read
  let readIndex = 0;
  async function _read() {
    if (readIndex < pathArr.length) {
      const notePath = pathArr[readIndex];
      let fileContent = '';
      try {
        fileContent = await Files.read(path.join(config.user.dirs.notes, notePath));
      } catch (e) {
        console.log(`${new Date().toLocaleString()}: [WARNING: get all files info]: cannot open `, notePath);
      }
      const curNotePathSegment = notePath.split('.md')[0].split('/');
      allDir[curNotePathSegment[0]][curNotePathSegment[1]][curNotePathSegment[2]].wordCount = tools.calWordCount(fileContent);
      readIndex += 1;
      await _read();
    }
  }
  await _read();

  res.send(allDir);
};

/**
 * exportNote 导出文件
 */
exports.exportNote = async (req, res) => {
  if (!req.query.path || !req.query.path.length || req.query.path.length !== 3) {
    res.status(400).send('错误的path参数');
    return;
  }

  if (typeof req.query.type !== 'string') {
    res.status(400).send('错误的type参数');
    return;
  }

  if (!req.query.type) req.query.type = 'zip'; // 默认导出zip格式


  req.query.path[3] = `${req.query.path[2]}.md`;
  const notePath = path.join(config.user.dirs.notes, req.query.path.join('/'));

  if (req.query.type === 'zip') {
    try {
      const zipData = await Files.exportNoteZip(notePath, req.query.path.slice(0, 3), req.query.path[2]);
      // 流式传输给前端
      zipData.generateNodeStream({
        type: 'nodebuffer',
      })
        .pipe(res)
        // .pipe(fs.createWriteStream(`${__dirname}/out.zip`)) // 也可以流式保存在本地
        .on('finish', () => {
          // JSZip generates a readable stream with a "end" event,
          // but is piped here in a writable stream which emits a "finish" event.
          console.log('[export file] export success: ', notePath);
        });
    } catch (error) {
      console.error(error);
      res.status(500).send(`导出文件失败: ${req.query.path}`);
    }
  } else if (req.query.type === 'docx') {
    try {
      const docxBuffer = await Files.exportNoteDocx(notePath, req.query.path.slice(0, 3), req.query.path[2]);
      // 流式传输给前端
      res.send(docxBuffer);
    } catch (error) {
      console.error(error);
      res.status(400).send(`导出文件失败: ${req.query.path}`);
    }
  }
};

/**
 * update 更新文件内容
 */
exports.importNote = async (req, res) => {
  // 校验
  if (!req.body.notePath) {
    res.status(400).send('importNote(), invalid req.body.notePath');
    return;
  }
  if (!req.body.catOrderAfterImport) {
    res.status(400).send('importNote(), invalid req.body.catOrderAfterImport');
    return;
  }
  if (!req.file) {
    res.status(400).send('importNote(), invalid req.file');
    return;
  }

  try {
    await Files.importNote(req.file, req.body.notePath, req.body.catOrderAfterImport);
    res.send(200);
  } catch (error) {
    res.status(400).send(error.message);
    console.error('[import note] import failed: ', error);
  }
};
