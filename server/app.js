const express = require('express');

const app = express();
const router = require('./router/router');
const config = require('./config');
const task = require('./tools/tasks');

(async function fn() {
// 任务: 一致化用户设置中的catalog
  await task.uniformizeUserConfigCatalog();

  // 基础设置
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // 允许跨域
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE'); // 允许的方法
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'); // 允许接收这些头
    next();
  });

  // 基础路由 & 托管静态资源
  app.use('/', router);
  app.use('/images', express.static('notes/_images'));
  app.use('/icons', express.static('notes/_icons'));
  app.listen(config.port, () => console.log(`server listening on port ${config.port}`));
}());
