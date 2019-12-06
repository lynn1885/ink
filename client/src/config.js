// 应用程序监听端口参见vue.config.js
const ip = 'http://localhost';

const config = {
  server: {
    serverUrl: `${ip}:12340/`,
    staticImageUrl: `${ip}:12340/images/`, // 最后/不能省略
    staticIconUrl: `${ip}:12340/icons/`,
  },
  defaultIconName: '__default__.png',
  bgImgName: '__background__', // Do not write the file type
};

// export
export default config;
