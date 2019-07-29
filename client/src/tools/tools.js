const tools = {
  /**
  * 注意: 这校验方法需要和后端保持一致
  * isFileNameValid: 检测文件名是否合法
  * @param {string} fileName 文件名
  * @return {boolean} 合法返回true, 否则返回false
  */
  isFileNameValid: (fileName) => {
    // 校验
    if (typeof fileName !== 'string') {
      console.error(`文件名不是string: ${fileName}`);
      return false;
    }
    // 文件名不能为空
    if (fileName.length < 1) {
      return false;
    }
    // 文件名不能以 . 空格, tab, 换行 开头或结尾
    if (fileName[0] === '.'
      || fileName[fileName.length - 1] === '.'
      || fileName[0] === ' '
      || fileName[fileName.length - 1] === ' '
      || fileName[0] === '\t'
      || fileName[fileName.length - 1] === '\t'
      || fileName[0] === '\n'
      || fileName[fileName.length - 1] === '\n'
    ) {
      return false;
    }

    // 文件名不能包含 < > : " / \ | ? *
    const r = /[<>:"'/\\|?*]/;
    if (fileName.match(r)) {
      return false;
    }
    return true;
  },
};

export default tools;
