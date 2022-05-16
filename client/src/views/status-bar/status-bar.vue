<template>
  <div id="status-bar">
    <div class="cur-note-path item" :title="notePath" @click="copyNotePath">{{ notePath }}</div>

    <div class="auto-case item" title="Automatic replacement when text is entered" @click="changeAutoReplace">{{isAutoReplace ? 'Replace' : 'No Replace'}}</div>
    <div class="auto-replace item" title="Automatic uppercase/lowercase when text is entered" @click="changeAutoCase">{{autoCaseStatusArr[autoCaseStatus]}}</div>

    <div class="fold item" v-for="index of [1,2,3,4,5,6]" :key="index" :title="`Click to fold headers to level ${index}`" @click="changeFold(index)">{{index}}</div>
    <div class="fold unfold item" title="Click to unfold all headers" @click="changeFold(0)">Unfold</div>
    <!-- <div class="url item" :title="url" @click="copyUrl">Url</div> -->
    <div class="url item" title="Change images visibility" @click="changeImgVisibility">{{isShowImg ? 'Img' : 'No Img'}}</div>
    <!-- <div class="note-properties item" title="Set Current Note Properties">Prop</div> -->
    <div class="time item" :title="'Time, click to restart'" @click="restartTime">Time: {{ timeStr }}</div>
    <div class="progress item" :title="`Current Progress: ${progress}%`">Progress: {{ progress }}%</div>
    <div class="line-count item" :title="`Line Count: ${lineCount}`">Lines: {{curLineNum}}/{{ lineCount }}</div>
    <div class="note-count item" :title="`Note Count: ${noteCount}`">Notes: {{ noteCount }}</div>
    <div
      :class="{ 'word-count': true, item: true, warning: wordCount >= recommendedMaxNumOfWords }"
      :title="`Word Count: ${wordCount}${wordCount >= recommendedMaxNumOfWords ? '\nThe number of words in this note exceeds ' + recommendedMaxNumOfWords + ', which may cause performance problems. It is recommended to split this note into several notes.' : ''}`"
    >Words: {{ wordCount }}</div>
  </div>
</template>
<script>
import tools from '@/tools/tools';

const isEnableConsole = false;
const compName = 'status-bar';

export default {
  name: compName,
  data() {
    return {
      name: compName,
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
      curLineNum: 0,
      isShowImg: true,
      isAutoReplace: false,
      autoReplaceTimer: null,
      autoCaseStatusArr: ['Normal case', 'Uppercase', 'Lowercase'],
      autoCaseStatus: 0,
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
      if (this.isAutoReplace) this.editor.on('changes', this.autoReplaceFn);
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
      this.curLineNum = curLineNum;
      this.lineCount = lineCount;
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
      this.$message.success('网址已复制, 可在别的设备打开: ', text);
    },

    // 改变图片可见性
    changeImgVisibility() {
      this.isShowImg = !this.isShowImg;
      this.editor.changeImgWidgetsVisibility(this.isShowImg);
      if (this.isShowImg) {
        this.$message.success('显示图片');
      } else {
        this.$message.success('不显示图片');
      }
    },

    // 自动大小写
    changeAutoCase() {
      this.autoCaseStatus = (this.autoCaseStatus + 1) % this.autoCaseStatusArr.length;
      switch (this.autoCaseStatus) {
        case 0:
          this.$message.success('关闭字母自动大小写');
          break;
        case 1:
          this.$message.success('开启字母自动大写');
          break;
        case 2:
          this.$message.success('开启字母自动小写');
          break;
        default:
          break;
      }
    },

    // 改变是否自动替换
    changeAutoReplace() {
      this.isAutoReplace = !this.isAutoReplace;

      if (this.isAutoReplace) {
        this.$message.success('开启自动替换');
        this.editor.on('changes', this.autoReplaceFn);
      } else {
        this.$message.success('关闭自动替换');
      }
    },

    // 自动替换函数
    autoReplaceFn(cm, info) {
      if (info && info[0] && info[0].origin === '+input') {
        clearTimeout(this.autoReplaceTimer);

        this.autoReplaceTimer = setTimeout(() => {
          if (this.autoCaseStatus === 1) {
            this.editor.keyMapFns.toUpperCase();
          } else if (this.autoCaseStatus === 2) {
            this.editor.keyMapFns.toLowerCase();
          }

          // alt + n 替换
          if (this.isAutoReplace) {
            try {
              this.editor.keyMapFns.replaceLine();
            } catch (error) {
              console.warn('无法执行行替换: ', error);
            }
          }
        }, 500);
      }
    },

    // 展开或折叠
    changeFold(lv) {
      if (lv === 0) {
        this.editor.unfoldAll();
        this.$message.success('展开文档');
      } else {
        this.editor.foldHeaderTo(lv);
        this.$message.success(`折叠到 ${lv} 级标题`);
      }
    },

    clear() {
      if (this.editor) {
        this.editor.off('changes', this.changesHandler);
        this.editor.off('cursorActivity', this.cursorActivityHandler);
        this.editor.off('changes', this.autoReplaceFn);
      }
      clearInterval(this.timeCounter);
    },

  },

  mounted() {
    this.inkCommon.addPluginObject(this.name, {
      restartTime: this.restartTime,
      getCurTime: () => this.time
    });
  },

  beforeDestroy() {
    this.clear();
    this.inkCommon.removePluginObject(this.name);
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
.item {
  display: inline-block;
  padding: 0 10px;
  &:hover {
    background-color: darken($tool-page-bg, 3%);
  }
  &.time {
    cursor: pointer;
  }
  &.fold {
    padding: 0 4px;
    cursor: pointer;
  }
  &.unfold {
    padding-right: 10px;
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
