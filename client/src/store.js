import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    editor: null, // 编辑器对象
    isProhibitOperateCat: false, // 是否进制操作catalog组件, 当editor正在加载, 或正在创建文件时, 会进行禁止
    filePath: null, // 打开的md文件路径
    userConfig: null, // 用户配置
  },
  mutations: {
    // 更新编辑器对象
    updateEditor(state, data) {
      state.editor = data;
    },

    // 对象是否编辑器处于正在加载状态
    updateIsProhibitOperateCat(state, data) {
      state.isProhibitOperateCat = data;
    },

    // 更新文件路径
    updateFilePath(state, data) {
      state.filePath = data;
    },

    // 更新用户配置
    updateUserConfig(state, data) {
      state.userConfig = data;
    },
  },
  actions: {

  },
});
