// 前端应用程序监听的ip
// 端口参见vue.config.js
const ip = window.location.hostname ? `http://${window.location.hostname}` : 'http://localhost';
console.log('您连接的后台ip是: ', ip);

const config = {
  server: {
    serverUrl: `${ip}:12340/`,
    staticImagesUrl: `${ip}:12340/images/`, // 最后/不能省略
    staticMapImgUrl: `${ip}:12340/images/map/`, // 最后/不能省略
    staticIconsUrl: `${ip}:12340/icons/`,
    staticPluginsUrl: `${ip}:12340/plugins/`,
  },
  defaultIconName: '__default__.png',
  bgImgName: '__background__', // Do not write the file type
  importNodeImgPrefix: '__import__' // 导入的笔记的图片文件夹前缀
};

// export
export default config;
