const express = require('express');
const app = express();
const router = require('./router/router');
const config = require('./config');

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");  // 允许跨域
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");   // 允许的方法
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");   // 允许接收这些头
  next();
});

app.use('/', router);
app.use('/images', express.static('notes/_images'));
app.listen(config.port, () => console.log(`server listening on port ${config.port}`));