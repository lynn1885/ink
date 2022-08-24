export default {
  plugins: {}, // 插件

  /**
 * 插件导出对象
 * @param {string} pluginName 插件名, 也是对象名
 * @param {object} obj 插件导出的对象
 */
  addPluginObject(pluginName, obj) {
    if (this.plugins[pluginName]) {
      console.warn('该插件已经导出过对象了, 现在将覆盖并重新导出: ', pluginName, this[pluginName]);
    }
    this.plugins[pluginName] = obj;
  },

  /**
  * 移除插件对象
  * @param {string} pluginName 插件名, 也是对象名
  */
  removePluginObject(pluginName) {
    this.plugins[pluginName] = null;
  }
};
