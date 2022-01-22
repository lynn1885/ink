<template>
  <div id="status-bar">
    <div class="cur-note-path items" :title="notePath" @click="copyNotePath">{{ notePath }}</div>
    <div class="url items" :title="url" @click="copyUrl">Url</div>
    <!-- <div class="note-properties items" title="Set Current Note Properties">Prop</div> -->
    <div class="Time items" :title="'Time, click to restart'" @click="restartTime">Time: {{ timeStr }}</div>
    <div class="progress items" :title="`Current Progress: ${progress}%`">Progress: {{ progress }}%</div>
    <div class="note-count items" :title="`Note Count: ${noteCount}`">Notes: {{ noteCount }}</div>
    <div class="line-count items" :title="`Line Count: ${lineCount}`">Lines: {{ lineCount }}</div>
    <div
      :class="{ 'word-count': true, items: true, warning: wordCount >= recommendedMaxNumOfWords }"
      :title="`Word Count: ${wordCount}${wordCount >= recommendedMaxNumOfWords ? '\nThe number of words in this note exceeds ' + recommendedMaxNumOfWords + ', which may cause performance problems. It is recommended to split this note into several notes.' : ''}`"
    >Words: {{ wordCount }}</div>
  </div>
</template>
<script>
import tools from '@/tools/tools';

const isEnableConsole = false;

export default {
  name: 'status-bar',
  data() {
    return {
      editor: null,
      wordCount: 0, // cur note word count
      lineCount: 0, // cur note line count
      noteCount: 0, // cour note count
      progress: 0, // progress
      time: 0, // time number
      timeStr: '0s', // time string
      timeCounter: null, // time counter
      notePath: '', // current file path
      updateTime: null,
      updateDelay: 2000,
      changeSeasonTimeInterval: 3000,
      recommendedMaxNumOfWords: 30000,
      url: `${window.location.hostname}:9009`,
      season: '',
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
        this.start();
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
      if (value && this.editor) {
        this.notePath = value.replace(/\/[^/]+.md/, '');
        this.start();
      }
    },
  },
  methods: {
    start() {
      this.clear();
      this.editor.on('changes', this.changesHandler);
      this.editor.on('cursorActivity', this.cursorActivityHandler);
      this.restartTime();
      this.getWordAndLineCount();
    },
    // on change
    changesHandler() {
      clearTimeout(this.updateTime);
      this.updateTime = setTimeout(() => {
        this.getWordAndLineCount();
      }, this.updateDelay);
    },

    // on cursor activity
    cursorActivityHandler(e) {
      const curLineNum = e.doc.getCursor().line || 1;
      const lineCount = e.doc.lineCount() || 1;
      this.progress = ((curLineNum / lineCount) * 100).toFixed(2);
    },

    // restartTime
    restartTime() {
      clearInterval(this.timeCounter);
      this.time = 0;
      this.timeStr = '0s';
      this.startTime();
    },

    // startTime
    startTime() {
      this.timeCounter = setInterval(() => {
        this.time += 1;
        this.timeStr = this.secondToStr(this.time);
      }, 1000);
    },

    // convert a second number to a time string
    secondToStr(timeNum) {
      const hour = Math.floor(timeNum / 3600);
      const minute = Math.floor((timeNum - (hour * 3600)) / 60);
      const second = timeNum % 60;
      let res = '';
      if (hour) res += `${hour}h `;
      if (minute) res += `${minute}m `;
      res += `${second}s`;
      return res;
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
      tools.copyText(text);
    },

    copyUrl() {
      const text = this.url;
      tools.copyText(text);
    },

    clear() {
      if (this.editor) {
        this.editor.off('changes', this.changesHandler);
        this.editor.off('cursorActivity', this.cursorActivityHandler);
      }
      clearInterval(this.timeCounter);
    }
  },

  beforeDestroy() {
    this.clear();
  }
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
