import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);
const isEnableConsole = true;

export default new Vuex.Store({
  state: {
    editor: null, // 编辑器对象
    allEditors: new Set(), // 所有编辑器对象
    isProhibitOperation: false, // 是否禁止操作侧边栏, 当editor正在加载, 切换文件, 或正在创建文件时, 会进行禁止
    curFilePath: null, // 当前打开的md文件路径. 只有精确到某个.md文档的那一刻, 才会更新这个值, 不用手动提交更新这个值, 这个值由catalog组件自动管理
    curCatalogArr: [], // 当前打开的目录数组. 不管一级目录, 二级目录还是三级目录变更, 都会更新这个数组. 如果这一级目录不存在, 则标记为null, 数组始终长度是3
    userConfig: null, // 用户配置
    catalog: null, // 目录
    gotoThisCatalog: [], // 要跳转到的目录, catalog组件会监听该目录
    curNoteTheme: null, // 当前笔记主题
    isNightModeOn: false, // 是否启用了夜间模式
    splitScreenMode: 0, // 0: 不分屏, 1: 上下分屏, 2: 左右分屏
  },
  mutations: {
    // 更新编辑器对象
    updateEditor(state, data) {
      for (const editor of state.allEditors.values()) {
        editor.isActive = false;
      }
      state.editor = data;
      data.isActive = true;
      console.log('激活编辑器: ', data.id, state.allEditors);
    },

    // 更新所有编辑器对象
    updateAllEditors(state, data) {
      if (data.operation === 'add') {
        state.allEditors.add(data.editor);
      } else if (data.operation === 'remove') {
        state.allEditors.delete(data.editor);
      }
      if (isEnableConsole) console.log('更新编辑器, 更新后所有编辑器实例: ', state.allEditors);
    },

    // 更新分屏模式
    updateSplitScreenMode(state, data) {
      state.splitScreenMode = data;
    },

    // 更新侧边栏是否处于不可用状态
    updateIsProhibitOperation(state, data) {
      state.isProhibitOperation = data;
      window.IS_PORHIBIT_KEY_DOWN = data;
    },

    // 更新目录数组
    updateCurCatalogArr(state, data) {
      state.curCatalogArr = data;
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

    // 更新夜间模式状态
    updateIsNightModeOn(state, data) {
      state.isNightModeOn = data;
    },
  },
  actions: {

  },
});
