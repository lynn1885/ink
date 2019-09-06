const path = require('path');
const Files = require('../models/files');
const Directories = require('../models/directories');
const config = require('../../config');

/**
 * get 获取文件
 */
exports.get = async (req, res) => {
  if (!req.query.path) {
    res.status(400).send('错误的path参数');
  }
  console.log('[read file] ', req.query.path);
  await Files.read(config.notesDir + req.query.path)
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
  }

  // 写入
  const filePath = config.notesDir + req.body.path;
  await Files.write(filePath, req.body.data)
    .then((data) => {
      console.log('[update file] ', req.body.path);
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
