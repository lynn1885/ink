import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    editor: null,
    isEditorLoading: false, // 编辑器是否处于正在加载状态
    filePath: null, // 打开的md文件路径
  },
  mutations: {
    updateEditor(state, data) {
      state.editor = data;
    },

    updateIsEditorLoading(state, data) {
      state.isEditorLoading = data;
    },

    updateFilePath(state, data) {
      state.filePath = data;
    },
  },
  actions: {

  },
});
