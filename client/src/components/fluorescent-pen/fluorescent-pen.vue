<template>
  <div id="fluorescent-pen">
  </div>
</template>
<script>
import $ from 'jquery';

export default {
  name: 'fluorescent-pen',
  data() {
    return {
      editor: null,
    };
  },

  watch: {
    // eslint-disable-next-line func-names
    '$store.state.editor': {
      immediate: true,
      handler(value) {
        if (value) {
          this.editor = value;
          window.onmouseup = this.onCursorActivity;
        }
      },
    }
  },

  methods: {
    onCursorActivity() {
      const selectionText = this.editor.cm.doc.getSelection();
      if (selectionText) {
        this.editor.cm.doc.replaceSelection(`*${selectionText.trim()}*`);
        this.editor.playAudio('addEmphasis');
      }
    }
  },

  created() {
  },

  mounted() {
    $('.CodeMirror-lines').css('cursor', "url('/imgs/fluorescent-pen.ico'), auto");
  },

  destroyed() {
    window.onmouseup = null;
    $('.CodeMirror-lines').css('cursor', 'auto');
  }
};
</script>
