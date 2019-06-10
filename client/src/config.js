// 应用程序监听端口参见vue.config.js

const config = {
  server: {
    serverUrl: 'http://localhost:3001/',
    staticImageUrl: 'http://localhost:3001/images/',
    staticIconUrl: 'http://localhost:3001/icons/',
  },
  password: '123456', // 密码, 用于删除文件或别的需要加密的地方
};

// export
export default config;
