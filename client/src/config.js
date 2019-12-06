// 应用程序监听端口参见vue.config.js
const ip = 'http://localhost';

const config = {
  server: {
    serverUrl: `${ip}:3001/`,
    staticImageUrl: `${ip}:3001/images/`, // 最后/不能省略
    staticIconUrl: `${ip}:3001/icons/`,
  },
  defaultIconName: '__default__.png',
  bgImgName: '__background__', // Do not write the file type
};

// export
export default config;
