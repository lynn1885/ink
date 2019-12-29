<template>
  <div id="note-content">
    <quick-open-bar id="quick-open-bar"></quick-open-bar>
    <editor id="editor" ref="editor" @editorShowState="checkIsShowEditor"></editor>
    <div id="editor-placeholder" v-show="!isShowEditor"></div>
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
  data() {
    return {
      isShowEditor: false,
    };
  },
  methods: {
    checkIsShowEditor(flag) {
      if (flag === false || flag === true) {
        this.isShowEditor = flag;
      }
    },
  },
  mounted() {
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#note-content {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}
#quick-open-bar {
  width: 100%;
  height: 30px;
}
#editor, #editor-placeholder {
  position: absolute;
  top: 30px;
  left: 0;
  right: 0;
  bottom: 0;
}
#editor-placeholder {
  background: $editor-bg;
}
</style>
