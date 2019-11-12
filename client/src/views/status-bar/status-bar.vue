<template>
  <div id="status-bar">
    <div class="cur-note-path items" :title="notePath" @click="copyNotePath">{{ notePath }}</div>
    <div class="note-properties items" title="Set Current Note Properties">Prop</div>
    <div class="note-count items" :title="`Note Count: ${noteCount}`">Notes: {{ noteCount }}</div>
    <div class="line-count items" :title="`Line Count: ${lineCount}`">Lines: {{ lineCount }}</div>
    <div
      :class="{ 'word-count': true, items: true, warning: wordCount >= recommendedMaxNumOfWords }"
      :title="`Word Count: ${wordCount}${wordCount >= recommendedMaxNumOfWords ? '\nThe number of words in this note exceeds ' + recommendedMaxNumOfWords + ', which may cause performance problems. It is recommended to split this note.' : ''}`"
    >Words: {{ wordCount }}</div>
  </div>
</template>
<script>
import $ from 'jquery';

const isEnableConsole = false;

export default {
  name: 'status-bar',
  data() {
    return {
      editor: null,
      wordCount: 0, // cur note word count
      lineCount: 0, // cur note line count
      noteCount: 0, // cour note count
      notePath: '', // current file path
      updateTimer: null,
      updateDelay: 2000,
      recommendedMaxNumOfWords: 30000,
    };
  },
  watch: {
    // eslint-disable-next-line func-names
    '$store.state.editor': function (value) {
      if (value) {
        this.editor = value;
        this.editor.on('changes', this.changesHandler);
      }
    },
    // eslint-disable-next-line func-names
    '$store.state.catalog': function (value) {
      if (value) {
        if (this.editor && this.editor.catalog) {
          this.noteCount = this.editor.catalogPlugin.getNoteCount();
        }
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
    changesHandler() {
      clearTimeout(this.updateTimer);
      this.updateTimer = setTimeout(() => {
        this.getWordAndLineCount();
      }, this.updateDelay);
    },
    // calculate word count & line count
    getWordAndLineCount() {
      const startTime = new Date();
      const doc = this.editor.cm.getDoc();
      let text = doc.getValue();
      this.wordCount = text.length;
      this.lineCount = doc.lineCount();
      let englishWordCount = 0;
      text = text.replace(/\b[a-zA-Z]+\b/g, () => {
        englishWordCount += 1;
        return '';
      });
      this.wordCount = text.length + englishWordCount;
      const updateConsumption = new Date() - startTime;
      if (updateConsumption > 10) {
        console.warn(
          'It took too long to update word count: ',
          updateConsumption
        );
      }
      if (isEnableConsole) {
        console.log('cumulative update consumption: ', updateConsumption);
      }
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
@import '@/themes/craft/var.scss';
#status-bar {
  box-sizing: border-box;
  font-size: 13px;
  text-align: right;
  color: $tool-page-color;
  background-color: $tool-page-bg;
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
    background-color: darken($tool-page-bg, 3%);
  }
}
.warning {
  background: $warning-bg;
  color: $warning-color;
}
</style>
