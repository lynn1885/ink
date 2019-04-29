const fs = require('fs');
const Files = require('../models/files');
const Directories = require('../models/Directories');
const config = require('../../config');
const path = require('path');

exports.get = async (req, res) => {
  if (!req.query.path) {
    res.status(400).send('错误的path参数')
  }
  console.log('read file: ', req.query.path);
  await Files.readFile(config.notesDir + req.query.path)
    .then((data) => {
      res.send(data);
    })
    .catch((e) => {
      console.error(e);
      res.status(500).send(`读取文件失败${req.query.path}`)
    })
}

exports.update = async (req, res) => {
  if (!req.body.path || typeof req.body.data !== 'string') {
    console.error('update file failed, no path or data: ', req.body);
    res.status(400).send('错误的path或data参数')
  }
  console.log('update file: ', req.body.path);
  const filePath = config.notesDir + req.body.path;
  await Files.writeFile(filePath, req.body.data)
    .then((data) => {
      res.send(data);
    })
    .catch((e) => {
      console.error(e);
      res.status(500).send(`写入文件失败${path}`)
    });

  // backup
  let filePathDir = path.dirname(filePath);
  let files = await Directories.get(filePathDir);
  let backupTimes = [];
  files.forEach((file) => {
    let matchRes = file.match(/([0-9]+?)\.md/);
    if (matchRes) {
      backupTimes.push(Number(matchRes[1]));
    }
  })
  let curBackupFilesNumber = backupTimes.length;
  let lastBackupTime = Math.max(...backupTimes);
  let earliestBackupTime = Math.min(...backupTimes);
  let curTime = Math.floor(new Date().valueOf() / 1000); // time unit : second
  if (curBackupFilesNumber > config.maxBackupFilesNumber && earliestBackupTime !== -Infinity) {
    await Files.unlink(`${filePathDir}/${earliestBackupTime}.md`)
      .catch((err) => {
        console.error(`Delete backup file failed: ${earliestBackupTime}, ${err}`);
      });
  }
  if (lastBackupTime !== Infinity && curTime - lastBackupTime > config.backupInterval) {
    await Files.writeFile(`${filePathDir}/${curTime}.md`, req.body.data)
      .catch((err) => {
        console.error(`backup file failed: ${path}, ${err}`);
      });
  }
}