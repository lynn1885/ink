<template>
  <div id="note-content">
    <editor></editor>
  </div>
</template>
<script>

import editor from './editor.vue';

export default {
  name: 'note-content',
  components: {
    editor,
  },
  mounted() {
    
  },
};
</script>

<style lang="scss" scoped>
#note-content {
  overflow: hidden;
  box-sizing: border-box;
}
#editor {
  width: 100%;
  height: 100%;
}
</style>
