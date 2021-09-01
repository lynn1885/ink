import config from '@/config';
import $ from 'jquery';

const tools = {
  /**
  * 注意: 这校验方法需要和后端保持一致
  * isFileNameValid: 检测文件名是否合法
  * @param {string} fileName 文件名
  * @return {boolean | string} 合法返回true, 否则返回string 错误信息
  */
  isFileNameValid: (fileName) => {
    // 校验
    if (typeof fileName !== 'string') {
      console.error(`目录名不是string: ${fileName}`);
      return '笔记名不是string';
    }
    // 目录名不能为空
    if (fileName.length < 1) {
      return '笔记名不能为空';
    }
    // 目录名不能超过200个字符
    if (fileName.length > 200) {
      return '笔记名不能超过200个字符';
    }
    // 目录名不能为纯数字
    // 纯数字会和备份文件名冲突
    if (fileName.match(/^\d+$/)) {
      return '笔记名不能为纯数字';
    }
    // 目录名不能包含四字节字符
    // eslint-disable-next-line no-restricted-syntax
    for (const char of fileName) {
      if (char.codePointAt(0) > 0xFFFF) return '笔记名不能包含特殊字符';
    }

    // 目录名不能以 . 空格, tab, 换行 开头或结尾
    if (fileName[0] === '.'
      || fileName[fileName.length - 1] === '.'
      || fileName[0] === ' '
      || fileName[fileName.length - 1] === ' '
      || fileName[0] === '\t'
      || fileName[fileName.length - 1] === '\t'
      || fileName[0] === '\n'
      || fileName[fileName.length - 1] === '\n'
    ) {
      return '笔记名不能以 . 空格 tab 换行符 开头或结尾';
    }

    // 目录名不能包含 < > : " / \ | ? *
    const r = /[<>:"/\\|?*]/;
    if (fileName.match(r)) {
      return '笔记名不能包含 < > : " / \\ | ? * 等特殊字符';
    }

    // 目录名不能以__开头的同时以__结尾
    const trimedFileName = fileName.trim();
    if (trimedFileName[0] === '_' &&
      trimedFileName[1] === '_' &&
      trimedFileName[trimedFileName.length - 1] === '_' &&
      trimedFileName[trimedFileName.length - 2] === '_') {
      return '笔记名不能以__开头的同时以__结尾';
    }
    return true;
  },

  /**
   * 获取段落图片
   * @param {string} line1 第一行
   * @param {string} line2 第二行
   * @return {string[]} 图片地址数组, 如果没有解析是来图片地址, 则返回空数组
   */
  getParaImg(line1 = '', line2 = '') {
    let line = '';
    let imgs = [];
    line1 = line1.trim();
    line2 = line2.trim();
    if (line1 && line1.endsWith('图示') && line2 && line2.endsWith('|')) {
      line = line2;
    } else if (line1 && line1.endsWith('|')) {
      line = line1;
    } else {
      return imgs;
    }

    imgs = line.split('|').filter(imgStr => imgStr).map((imgStr) => {
      if (imgStr && imgStr.startsWith('![](')) {
        const imgName = imgStr.replace('![](', '').replace(')', '').replace('|', '');
        const imgSrc = config.server.staticImagesUrl + imgName;
        return imgSrc;
      }
      return '';
    }).filter(imgSrc => imgSrc);

    return imgs;
  },

  /**
   *
   * @param {string} text 要拷贝的文字
   */
  copyText(text) {
    const element = $(`<textarea>${text}</textarea>`); // This element cannot be display none or hidden
    $('body').append(element);
    element[0].select();
    document.execCommand('Copy');
    element.remove();
  }
};

export default tools;
