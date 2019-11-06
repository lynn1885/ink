<template>
  <div id="note-content">
    <quick-open-bar id="quick-open-bar"></quick-open-bar>
    <editor id="editor"></editor>
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
  mounted() {

  },
};
</script>

<style lang="scss" scoped>
#note-content {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}
#quick-open-bar {
  width: 100%;
  height: 28px;
}
#editor {
  position: absolute;
  top: 28px;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
