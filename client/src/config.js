// 应用程序监听端口参见vue.config.js
const config = {
  serverUrl: 'http://localhost:3001/',
  staticResUrl: 'http://localhost:3001/images/',
  autoSaveInterval: 30 * 1000, // ms
  autoFoldDelay: 200, // ms
  defaultCatLv1: 'mine', // 默认路径
  defaultCatLv2: 'model',
  defaultCatLv3: 'routine',
};
export default config;
