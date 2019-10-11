<template>
  <div id="status-bar">
    <div class="cur-note-path items" :title="notePath" @click="copyNotePath">{{ notePath }}</div>
    <div class="note-properties items" title="set current note properties">Prop</div>
    <div class="note-count items" title="note count">Note: {{ noteCount }}</div>
    <div class="line-count items" title="line count">Ln: {{ lineCount }}</div>
    <div class="word-count items" title="character count">Ch: {{ wordCount }}</div>
  </div>
</template>
<script>
import $ from 'jquery';

export default {
  name: 'status-bar',
  data() {
    return {
      editor: null,
      wordCount: 0, // cur note word count
      lineCount: 0, // cur note line count
      noteCount: 0, // cour note count
      notePath: '', // current file path
    };
  },
  watch: {
    // eslint-disable-next-line func-names
    '$store.state.editor': function (value) {
      if (value) {
        this.editor = value;
        this.getWordAndLineCount();
      }
    },
    // eslint-disable-next-line func-names
    '$store.state.catalog': function (value) {
      if (value) {
        this.getNoteCount(value);
      }
    },
    // eslint-disable-next-line func-names
    '$store.state.curFilePath': function (value) {
      if (value) {
        this.notePath = value.replace(/\/[^/]+.md/, '');
      }
    },
  },
  methods: {
    // calculate word count & line count
    getWordAndLineCount() {
      setInterval(() => {
        const doc = this.editor.cm.getDoc();
        this.wordCount = doc.getValue().length;
        this.lineCount = doc.lineCount();
      }, 3000);
    },

    // get note count
    getNoteCount(catalog) {
      let count = 0;
      // eslint-disable-next-line no-restricted-syntax
      for (const lv1 in catalog) {
        if (catalog[lv1]) {
          // eslint-disable-next-line no-restricted-syntax
          for (const lv2 in catalog[lv1]) {
            if (catalog[lv1][lv2]) {
              count += Object.keys(catalog[lv1][lv2]).length;
            }
          }
        }
      }
      this.noteCount = count;
    },

    // copy current note path
    copyNotePath() {
      const text = this.notePath;
      const element = $(`<textarea>${text}</textarea>`); // This element cannot be display none or hidden
      $('body').append(element);
      element[0].select();
      document.execCommand('Copy');
      element.remove();
    },
  },
};
</script>

<style lang="scss" scoped>
@import "@/themes/craft/var.scss";
#status-bar {
  box-sizing: border-box;
  font-size: 13px;
  text-align: right;
  color: $status-bar-color;
  background-color: $status-bar-bg;
  overflow: hidden;
  cursor: default;
}
.cur-note-path {
  float: left;
  width: 180px;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.items {
  display: inline-block;
  padding: 0 10px;
  &:hover {
    background-color: lighten($status-bar-bg, 3%);
  }
}


</style>
