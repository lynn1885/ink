const express = require('express');

const app = express();
const router = require('./router/router');
const config = require('./config');
const task = require('./tools/tasks');

console.log(__dirname);

(async function fn() {
  // tasks at startup
  // create default user directories & user config & default note icon
  task.createDefaultUserDir();
  task.createDefaultUserConfig();
  task.createDefaultNoteIcon();
  // unify catalog
  await task.unifyCatalog();

  // 基础设置
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // 允许跨域
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE'); // 允许的方法
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'); // 允许接收这些头
    next();
  });

  // 基础路由 & 托管静态资源
  app.use('/', router);
  app.use('/images', express.static(config.user.dirs.noteImages));
  app.use('/icons', express.static(config.user.dirs.noteIcons));
  app.listen(config.port, () => console.log(`${new Date().toLocaleString()}: server listening on port ${config.port}`));
}());
