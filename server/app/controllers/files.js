const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
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
  // 处理前端参数
  if (!req.query.fromPath
    || !req.query.isRegExp
    || !req.query.isSensitiveToCase
    || !req.query.searchText
    || !req.query.searchedTextClass
  ) {
    res.status(400).send('错误的参数');
    return;
  }

  if (req.query.searchPath) req.query.searchPath = req.query.searchPath.trim().toLowerCase(); // 路径匹配始终不考虑大小写和左右空格
  let nearDistance;
  if (req.query.nearDistance && Number(req.query.nearDistance)) {
    nearDistance = Number(req.query.nearDistance);
  }

  console.log('检索设置：', req.query);

  // 时间统计
  const startTime = new Date();

  // console.log(123, req.query);

  // 获取目录文件
  const specifiedSearchFolder = req.query.specifiedSearchFolder && path.normalize(req.query.specifiedSearchFolder); // 搜索指定目录
  // const specifiedSearchFolder = ''; // 搜索指定目录
  const specifiedSearchExtName = req.query.specifiedSearchExtName || '.txt'; // 搜索指定类型文件，不指定则仅搜索.txt文件
  let fileList = []; // 要检索的文件列表

  const scorePlans = {
    mdFile: {
      matchAllScore: 16, // 全部匹配额外加分
      distanceScore: 10, // 距离分
    },
    plainFile: {
      matchAllScore: 20, // 全部匹配额外加分
      distanceScore: 20, // 距离分
    },
  };

  let curScorePlan;
  if (specifiedSearchFolder) curScorePlan = scorePlans.plainFile;
  else curScorePlan = scorePlans.mdFile;

  // 模式1：读取指定目录文件
  if (specifiedSearchFolder) {
    fileList = tools.getFileList(specifiedSearchFolder, specifiedSearchExtName);
  } else {
    // 模式2：读取ink笔记
    const allDirAndFiles = await Directories.getRecursively(config.user.dirs.notes, true, 'array');
    // 只要md文件，且只要非备份文件
    allDirAndFiles.forEach((item) => {
      if (
        item.endsWith('.md')
        && !(/^\d+$/.test(path.basename(item, '.md')))
        && (!req.query.searchPath || item.toLowerCase().includes(req.query.searchPath))
      ) {
        fileList.push(item);
      }
    });
    // sort directories
    // req.query.searchPath = req.query.searchPath.toLowerCase();
    // let fileList = [];
    // const fromPathArr = req.query.fromPath.split('/').slice(0, 3);
    // if (isEnableConsole) {
    //   console.log('fromPathArr: ', fromPathArr);
    // }
    // if (!req.query.searchPath || `${fromPathArr[0]}/${fromPathArr[1]}/${fromPathArr[2]}`.toLowerCase().includes(req.query.searchPath)) {
    //   fileList.push(`${fromPathArr[0]}/${fromPathArr[1]}/${fromPathArr[2]}/${fromPathArr[2]}.md`);
    // }
    // if (isEnableConsole) {
    //   console.log('first path: ', fileList[0]);
    // }
    // Object.keys(allDir[fromPathArr[0]][fromPathArr[1]]).forEach((file) => {
    //   if (!req.query.searchPath || `${fromPathArr[0]}/${fromPathArr[1]}/${file}`.toLowerCase().includes(req.query.searchPath)) {
    //     fileList.push(`${fromPathArr[0]}/${fromPathArr[1]}/${file}/${file}.md`);
    //   }
    // });
    // Object.keys(allDir[fromPathArr[0]]).forEach((dir2) => {
    //   Object.keys(allDir[fromPathArr[0]][dir2]).forEach((file) => {
    //     if (!req.query.searchPath || `${fromPathArr[0]}/${dir2}/${file}`.toLowerCase().includes(req.query.searchPath)) {
    //       fileList.push(`${fromPathArr[0]}/${dir2}/${file}/${file}.md`);
    //     }
    //   });
    // });
    // Object.keys(allDir).forEach((dir1) => {
    //   Object.keys(allDir[dir1]).forEach((dir2) => {
    //     Object.keys(allDir[dir1][dir2]).forEach((file) => {
    //       if (!req.query.searchPath || `${dir1}/${dir2}/${file}`.toLowerCase().includes(req.query.searchPath)) {
    //         fileList.push(`${dir1}/${dir2}/${file}/${file}.md`);
    //       }
    //     });
    //   });
    // });
    // fileList = Array.from(new Set(fileList));
    // if (isEnableConsole) {
    //   console.log('fileList: ', fileList, fileList.length);
    // }
  }

  // console.log('fileList', fileList);
  if (fileList.length === 0) {
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

  // 检测字符串
  let { searchText } = req.query;
  if (req.query.isSensitiveToCase === 'false') {
    searchText = searchText.toLowerCase();
  }
  // 检索词用空格分隔时
  const searchParts = searchText.split(/\s+/g);
  // 生成正则表达式
  let reg;
  let reg2;
  try {
    // eslint-disable-next-line no-useless-escape
    reg = new RegExp(searchText.replace(/[\-\/\\\^\$\*\+\?\.\(\)\|\[\]\{\}]/g, '\\$&').split(/\s+/g).join('|'), 'g');
    reg2 = new RegExp(searchText.replace(/[\-\/\\\^\$\*\+\?\.\(\)\|\[\]\{\}]/g, '\\$&').split(/\s+/g).join('|'), 'g');
    console.log('检索表达式：', reg);
  } catch (error) {
    console.error('生成正则表达式失败：', searchParts);
  }

  // 递归函数，用于检索每一篇笔记
  async function _search() {
    let fileWordPointer = 0; // 指针，当前检索到了全文哪个位置
    let fileContent;
    let isGoOnSearch = true;
    const noteDir = specifiedSearchFolder ? fileList[fileIndex] : `${path.dirname(path.relative(config.user.dirs.notes, fileList[fileIndex]))}/`.replace(/\\/g, '/'); // 返回前端所需的格式，用正斜杠，且最后需要一个斜杠
    const curFileRes = { // 当前文件的检索结果
      dir: noteDir,
      items: [],
      score: 0, // 当前文章的总得分
      maxLineScore: 0, // 得分最高的行是多少分
    };

    // 读取文件内容
    try {
      fileContent = await Files.read(fileList[fileIndex]);
    } catch (e) {
      console.log(`${new Date().toLocaleString()}: [search all file warning]: cannot open `, fileList[fileIndex]);
      isGoOnSearch = false;
    }

    // 校验与前置处理
    if (fileContent && typeof fileContent === 'string') {
      if (req.query.isSensitiveToCase === 'false') {
        fileContent = fileContent.toLowerCase();
      }
      const lines = fileContent.split('\n');

      // 检索词用空格分隔时，则必须同时包含这些词语，才继续检索
      // console.log('搜索拆分：', searchParts);
      for (const part of searchParts) {
        if (!fileContent.includes(part)) {
          isGoOnSearch = false;
          break;
        }
      }

      // 继续搜索
      if (isGoOnSearch) {
        // 当前文章，每一行都给个加权评分
        const lineScores = {};
        // 六级标题，用于存储标题带来的上下文
        let headers = [];
        // 搜索每一行

        // 当前行搜索结果
        // eslint-disable-next-line no-labels
        for (let index = 0; index < lines.length; index += 1) {
          const lineText = lines[index];
          const oriLineText = lineText;


          // 更新标题上下文
          if (lineText.startsWith('# ')) headers = [lineText];
          if (lineText.startsWith('## ')) headers = [headers[0], lineText];
          if (lineText.startsWith('### ')) headers = [headers[0], headers[1], lineText];
          if (lineText.startsWith('#### ')) headers = [headers[0], headers[1], headers[2], lineText];
          if (lineText.startsWith('##### ')) headers = [headers[0], headers[1], headers[2], headers[3], lineText];
          if (lineText.startsWith('###### ')) headers = [headers[0], headers[1], headers[2], headers[3], headers[4], lineText];

          // const prevContext = fileList[fileIndex] + headers.join(' '); // 前文，也就是文件名加上上级标题
          // console.log('语境内容：', prevContext);


          // 只是用于做加权统计的工具对象：根据当前行命中的单词加分
          const curLineSearchedItems = {};
          // eslint-disable-next-line no-loop-func
          searchParts.forEach((part) => {
            if (headers.join(' ').includes(part)) curLineSearchedItems[part] = 8; // 如果语境出现该词汇，加分
            if (fileList[fileIndex].includes(part)) curLineSearchedItems[part] = 16; // 如果语境出现该词汇，加分
            else curLineSearchedItems[part] = 0;
          });

          // 检索一行：一行可能命中多次，所以要多次搜索，此处使用正则表示式实现
          let match;
          const matchIndexes = []; // 记录命中的字符串出现的位置


          // eslint-disable-next-line no-cond-assign
          while ((searchedItemsNum <= config.maxSearchNum) && (match = reg.exec(lineText))) {
            // 返回给前端的搜索显示效果，是一串html
            const previewText = lineText.slice(match.index - 50 < 0 ? 0 : match.index, match.index + 50);
            let preview = [
              lineText.slice(match.index - 50 < 0 ? 0 : match.index - 50, match.index), // 最多往前倒50个字符，目的是让匹配字符前面的文字也可以显示出来，其实就是显示上下文
              `<span class="${req.query.searchedTextClass}">`,
              oriLineText.slice(match.index, match.index + match[0].length),
              '</span>',
              lineText.slice(
                match.index + match[0].length,
                match.index + match[0].length + 50,
              ),
            ].join('').trim();

            matchIndexes.push(match.index);
            // console.log('preview', preview);

            // 如果要求必须临近，则添加额外计算
            let isIncludeThisItem = true; // 是否包含这一项
            let contentSegment = '';
            const curPointer = fileWordPointer + match.index;

            // console.log(fileContent[curPointer], lineText[match.index]);

            if (nearDistance) {
              const start = curPointer - nearDistance <= 0 ? 0 : curPointer - nearDistance;
              const end = curPointer + nearDistance >= fileContent.length ? fileContent.length : curPointer + nearDistance;
              contentSegment = fileContent.slice(start, end + 1);
              for (const part of searchParts) {
                // console.log(contentSegment);
                if (!contentSegment.includes(part)) {
                  isIncludeThisItem = false;
                  contentSegment = '';
                  break;
                }
              }
              if (isIncludeThisItem) {
                // 必须使用reg2，因为reg1对象在执行exec，它是有状态的
                preview = contentSegment.replace(reg2, `<span class="${req.query.searchedTextClass}">$&</span>`);
                // preview = contentSegment;
              }
            }

            // 包含这个搜索结果
            if (isIncludeThisItem) {
              // 简单的实现一下加权计算
              // 当前行第一次命中某单词，加大分，因为此时比较重要。以后再命中，加小分
              // eslint-disable-next-line no-unused-expressions
              curLineSearchedItems[match[0]] === 0 ? curLineSearchedItems[match[0]] += 6 : curLineSearchedItems[match[0]] += 1;

              // 当前行检索结果汇总
              curFileRes.items.push({
                isSpecifiedMode: !!specifiedSearchFolder,
                noteDir,
                line: index,
                lineText: lineText.slice(0, 200),
                char: [match.index, match.index + match[0].length],
                previewText: contentSegment || previewText,
                preview,
                headers,
              });

              // 总共检索数量统计
              searchedItemsNum += 1;
            }
          }
          // 当前行检索结束后：如果匹配到了内容，则求当前行加权分
          if (matchIndexes.length) {
            // console.log(123, lineText);
            lineScores[index] = 0;
            let headerScore = 0; // 标题带来的加权分
            let itemsScore = 0; // 命中词汇带来的加权分
            let distanceScore = 0; // 词汇距离带来的加权分

            // 当前行是标题行，额外加分
            if (/^#+\s/.test(lineText)) {
              headerScore += 12;
              // console.log('标题分：10分');
              if (lineText.replace(/#+\s/g, '').length <= 12) { // 短标题额外加分
                // console.log(lineText);
                headerScore += 8;
              }
            }

            // 长句子、多次匹配要适当扣分
            if (lineText.length >= 30 && matchIndexes >= 3) {
              itemsScore -= 4;
            }

            // 汇总单词分
            const searchedItemValues = Object.values(curLineSearchedItems);
            itemsScore = searchedItemValues.reduce((a, b) => a + b);
            if (searchedItemValues.filter(v => v === 0).length === 0) { // 当前行命中的所有词汇，额外加分
              itemsScore += curScorePlan.matchAllScore;
            }
            // console.log('单词分：', curLineSearchedItems, itemsScore);

            // 单词距离越近，加分越多
            const diff = matchIndexes.sort((a, b) => a - b).map((item, idx, arr) => (idx === 0 ? 0 : item - arr[idx - 1])); // 求差值
            const distanceAvg = diff.reduce((a, b) => a + b) / diff.length; // 求差值的均指
            distanceScore = Math.floor(curScorePlan.distanceScore / (distanceAvg || 999)); // 如果距离为0，应该值命中的一个词汇，则此项加很少的分
            // console.log('距离分：', distanceAvg, distanceScore);

            // console.log(123, curScorePlan);

            // 汇总
            lineScores[index] += (itemsScore + headerScore + distanceScore);
            // console.log('总分：', lineScores[index]);

            // const lastIndex = -1;
            // const isFirstSearch = true;
            // do {
            //   // eslint-disable-next-line no-labels
            //   if (searchedItemsNum >= config.maxSearchNum) break search;
            //   lastIndex = lineText.indexOf(
            //     searchText,
            //     isFirstSearch ? 0 : lastIndex + searchText.length,
            //   );
            //   isFirstSearch = false;
            //   if (lastIndex > -1) {
            //     // Intercept 40 words
            //     const start = lastIndex - 30 < 0 ? 0 : lastIndex - 30;
            //     const preview = [
            //       lineText.slice(start, lastIndex),
            //       `<span class="${req.query.searchedTextClass}">`,
            //       oriLineText.slice(lastIndex, lastIndex + searchText.length),
            //       '</span>',
            //       lineText.slice(
            //         lastIndex + searchText.length,
            //         lastIndex + searchText.length + 30,
            //       ),
            //     ].join('');
            //     curFileRes.items.push({
            //       noteDir: `${path.dirname(fileList[fileIndex])}/`,
            //       line: index,
            //       char: [lastIndex, lastIndex + searchText.length],
            //       preview,
            //     });
            //     searchedItemsNum += 1;
            //   }
            // } while (lastIndex > -1);
          }

          // 要放在最后一行
          fileWordPointer += (lineText.length + 1); // 向前移动指针，因为还包含一个空格，所以多移动一位
        }

        // 打印用的
        // const lineScoresSortedKeys = Object.keys(lineScores).sort((a, b) => lineScores[b] - lineScores[a]);
        // const lineScoresSorted = {};
        // // eslint-disable-next-line no-loop-func
        // lineScoresSortedKeys.forEach((line) => {
        //   lineScoresSorted[lines[line]] = lineScores[line];
        // });
        // console.log(lineScoresSorted);

        // 为当前文件的每个item，写入其所在行的得分
        if (curFileRes.items.length > 0) {
          curFileRes.items.forEach((item) => {
            item.lineScore = lineScores[item.line];
          });

          const lineScoresValue = Object.values(lineScores);
          curFileRes.score = lineScoresValue.reduce((a, b) => a + b);
          curFileRes.maxLineScore = Math.max(...lineScoresValue);
          // console.log(curFileRes.score, curFileRes.maxLineScore);

          // 对当前篇章内item，按item对应行的得分排序
          curFileRes.items.sort((a, b) => b.lineScore - a.lineScore);

          // 填充结果
          searchRes.push(curFileRes);
        }
      }
    }

    // 递归，搜索下一个文件
    if ((fileIndex + 1) < fileList.length && searchRes.length < config.maxSearchNum) {
      fileIndex += 1;
      await _search();
    }
  }

  // 正则表达式生成成功，则触发检索
  if (reg) await _search();
  const timeConsumption = new Date() - startTime;

  // search
  console.log(
    `${new Date().toLocaleString()}: [search all file] `,
    'Number of files searched:', fileIndex + 1,
    '\nSearch directory:', req.query.searchPath,
    '\nSearched items number:', searchedItemsNum,
    '\nTime consumption:', timeConsumption,
  );

  // 对笔记篇章进行排序：按maxLineScore排序
  searchRes.sort((a, b) => b.maxLineScore - a.maxLineScore);

  // console.log(searchRes);

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

/**
 * open 打开文件
 * @returns
 */
exports.openFileDefault = async (req, res) => {
  if (!req.query.path) {
    res.status(400).send('错误的path参数');
    return;
  }
  console.log(`${new Date().toLocaleString()}: [open file] `, req.query.path);

  res.send();
  try {
    // 对于txt，尝试打开同名pdf⚠️
    let filePath;
    if (req.query.path.endsWith('.txt')) {
      const pdfPath = path.normalize(req.query.path).replace(/.txt$/, '.pdf');
      if (fs.existsSync(pdfPath)) {
        filePath = pdfPath;
      } else {
        filePath = req.query.path;
      }
    }


    // 处理命令行
    // start C:\Users\ji\Desktop\english\"集群 cluster.txt"   要处理成这种，在win上面才能打开，注意不能直接全部加引号""
    filePath = path.normalize(filePath
      .split('\\')
      .map((seg) => {
        if (seg.includes(' ')) {
          return `"${seg}"`;
        }
        return seg;
      })
      .join('\\'));


    // sameNamePdf = filePath.replace(/.txt$/, '.pdf');
    // if (fs.existsSync(sameNamePdf)) filePath = sameNamePdf;
    childProcess.exec(`start ${filePath}`, {
      windowsHide: true,
    });
  } catch (error) {
    res.status(500).send(`读取文件失败${req.query.path}`);
  }
  // await Files.read(path.normalize(req.query.path))
  //   .then((data) => {
  //     res.send(data);
  //   })
  //   .catch((e) => {
  //     console.error(e);
  //     res.status(500).send(`读取文件失败${req.query.path}`);
  //   });
};
