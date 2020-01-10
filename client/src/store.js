import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    editor: null, // 编辑器对象
    isProhibitOperation: false, // 是否禁止操作侧边栏, 当editor正在加载, 切换文件, 或正在创建文件时, 会进行禁止
    curFilePath: null, // 当前打开的md文件路径. 只有精确到某个.md文档的那一刻, 才会更新这个值
    userConfig: null, // 用户配置
    catalog: null, // 目录
    gotoThisCatalog: [], // 要跳转到的目录, catalog组件会监听该目录
    curNoteTheme: null, // 当前笔记主题
  },
  mutations: {
    // 更新编辑器对象
    updateEditor(state, data) {
      state.editor = data;
    },

    // 更新侧边栏是否处于不可用状态
    updateIsProhibitOperation(state, data) {
      state.isProhibitOperation = data;
      window.IS_PORHIBIT_KEY_DOWN = data;
    },

    // 更新文件路径
    updateCurFilePath(state, data) {
      state.curFilePath = data;
    },

    // 更新用户配置
    updateUserConfig(state, data) {
      state.userConfig = data;
    },

    // 更新目录
    updateCatalog(state, data) {
      state.catalog = data;
    },

    // 更新要跳转到的目录
    updateGotoThisCatalog(state, data) {
      state.gotoThisCatalog = data;
    },

    // 更新当前笔记的主题
    updateCurNoteTheme(state, data) {
      state.curNoteTheme = data;
    },
  },
  actions: {

  },
});
