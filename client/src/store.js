import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    editor: null, // 编辑器对象
    isProhibitOperateCat: false, // 是否进制操作catalog组件, 当editor正在加载, 或正在创建文件时, 会进行禁止
    curFilePath: null, // 当前打开的md文件路径. 只有精确到某个.md文档时, 才会更新这个值
    userConfig: null, // 用户配置
    catalog: null, // 目录
    isShowStickyNote: false, // 是否显示sticky note
    gotoThisCatalog: [], // 要跳转到的目录, catalog组件会监听该目录
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

    // 更新是否显示sticky note
    updateIsShowStickyNote(state, data) {
      state.isShowStickyNote = data;
    },

    // 更新要跳转到的目录
    updateGotoThisCatalog(state, data) {
      state.gotoThisCatalog = data;
    },
  },
  actions: {

  },
});
