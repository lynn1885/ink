// 应用程序监听端口参见vue.config.js
const ip = 'http://localhost';

const config = {
  server: {
    serverUrl: `${ip}:12340/`,
    staticImagesUrl: `${ip}:12340/images/`, // 最后/不能省略
    staticIconsUrl: `${ip}:12340/icons/`,
    staticPluginsUrl: `${ip}:12340/plugins/`,
  },
  defaultIconName: '__default__.png',
  bgImgName: '__background__', // Do not write the file type
};

// export
export default config;
