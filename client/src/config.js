// 应用程序监听端口参见vue.config.js
const ip = 'http://localhost';

const config = {
  server: {
    serverUrl: `${ip}:3001/`,
    staticImageUrl: `${ip}:3001/images/`, // 最后/不能省略
    staticIconUrl: `${ip}:3001/icons/`,
  },
};

// export
export default config;
