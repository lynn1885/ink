<template>
  <div
    :class="['note-content', ($store.state.splitScreenMode && thisEditor && thisEditor.isActive) ? 'active' : '']"
    @mouseenter="activeThisEditor"
  >
    <quick-open-bar
      v-if="thisEditor"
      class="quick-open-bar"
      :editor="thisEditor"
      :curFilePath="thisEditorCurrentFilePatch"
    ></quick-open-bar>
    <editor
       class="editor"
      @curEditFilePath="fp => thisEditorCurrentFilePatch = fp"
      @editorShowState="checkIsShowEditor"
      @editor="getThisEditor"
    ></editor>
    <div class="editor-placeholder" v-show="!isShowEditor">
    </div>
  </div>
</template>
<script>

import QuickOpenBar from '@/components/quick-open-bar/quick-open-bar.vue';
import Editor from './editor.vue';

export default {
  name: 'note-content',
  components: {
    Editor,
    QuickOpenBar,
  },
  props: {
    isDefaultEditor: false,
    isAutoOpenCurFilePath: false
  },
  data() {
    return {
      curActiveEditor: null, // 当前活跃的编辑器
      thisEditor: null, // 此编辑器
      thisEditorCurrentFilePatch: '', // 此编辑器正在编辑的路径
      isShowEditor: false,
      isThisEditorActive: false,
    };
  },
  watch: {
    // eslint-disable-next-line func-names
    '$store.state.editor': function (value) {
      if (value) {
        this.curActiveEditor = value;
        if (this.isDefaultEditor) this.$store.commit('updateDefaultEditor', this.thisEditor);
      }
    },
  },
  methods: {
    // 是否显示编辑器
    checkIsShowEditor(flag) {
      if (flag === false || flag === true) {
        this.isShowEditor = flag;
      }
    },

    // 获取编辑器
    async getThisEditor(editor) {
      this.thisEditor = editor;
      // 按要求自动打开当前当前目录
      if (this.isAutoOpenCurFilePath && this.$store.state.curFilePath) {
        // 其他已经打开的editor先保存一下, 保证往后台写入了最新的内容, 然后当前editor再从后台获取内容
        for (const e of this.$store.state.allEditors.values()) {
          if (
            e !== this.thisEditor // 别的编辑器
          ) {
            // eslint-disable-next-line no-await-in-loop
            await e.runCommand('SAVE');
          }
        }
        this.thisEditor.runCommand('OPENFILE', this.$store.state.curFilePath);
      }
    },

    // 激活当前编辑器
    async activeThisEditor() {
      if (!this.curActiveEditor || !this.thisEditor) return;

      if (this.curActiveEditor.id !== this.thisEditor.id) {
        this.$store.commit('updateEditor', this.thisEditor); // 更新编辑器对象
        if (this.thisEditor.fileServer.curFilePath) { // 让目录指向当前编辑器打开的路径
          this.$store.commit('updateGotoThisCatalog', this.thisEditor.fileServer.curFilePath.split('/').slice(0, 3));
        }
      }
    },
  },
  mounted() {
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
.note-content {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid transparent;
  &.active {
    border: 1px solid $sidebar-item-active-border-color;
  }
  .quick-open-bar {
    width: 100%;
    height: 30px;
  }
  .editor, .editor-placeholder {
    position: absolute;
    top: 30px;
    left: 0;
    right: 0;
    bottom: 0;
    font-size: 30px;
  }
  .editor-placeholder {
    display: flex;
    background: $editor-bg;
    align-items: center;
    justify-content: center;
    color: #999;
  }
}

</style>
