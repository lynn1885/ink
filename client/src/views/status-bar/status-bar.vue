<template>
  <div id="status-bar">
    <div class="cur-note-path items" :title="notePath" @click="copyNotePath">{{ notePath }}</div>
    <div class="note-properties items" title="Set Current Note Properties">Prop</div>
    <div class="note-count items" :title="`Note Count: ${noteCount}`">Notes: {{ noteCount }}</div>
    <div class="line-count items" :title="`Line Count: ${lineCount}`">Lines: {{ lineCount }}</div>
    <div
      :class="{ 'word-count': true, items: true, warning: wordCount >= recommendedMaxNumOfWords }"
      :title="`Word Count: ${wordCount}${wordCount >= recommendedMaxNumOfWords ? '\nThe number of words in this note exceeds ' + recommendedMaxNumOfWords + ', which may cause performance problems. It is recommended to split this note into several notes.' : ''}`"
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
      changeSeasonTimeInterval: 3000,
      recommendedMaxNumOfWords: 30000,
      season: '',
      time: '',
      curSeasonTimeType: 'season',
      seasonTimeTypes: ['season', 'time', 'icon'],
      seasonTimeIcons: ['___spring1___', '___summer1___', '___autumn1___', '___winter___'],
      seasonTimeIcon: '',
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
    '$store.state.catalog': {
      immediate: true,
      deep: true,
      handler(value) {
        if (value && this.editor && this.editor.catalogPlugin) {
          this.noteCount = this.editor.catalogPlugin.getNoteCount();
        }
      },
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

    /**
     * calculate word count & line count
     * ⚠️ This algorithm is coupled with the back-end word count algorithm.
     */
    getWordAndLineCount() {
      const startTime = new Date();
      ({ wordCount: this.wordCount, lineCount: this.lineCount } = this.editor.getWordAndLineCount());
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

    /**
     * copy current note path
     */
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
  font-size: $font-size-sidebar;
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
.season-time {
  .icon {
    height: $font-size-sidebar;
  }
  .autumn {
    color:rgb(240, 214, 167);
  }
}
</style>
