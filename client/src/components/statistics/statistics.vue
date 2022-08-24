<template>
  <div id="statistics">
    <!-- top bar -->
    <div id="top-bar">
      <div class="buttons">
        <button
          class="get-statistics"
          @click="getStatistics"
          :disabled="isGettingStatistics"
        >获取</button>
        <!-- <button
          class="sort"
          :disabled="!isGetStatisticsDone"
          @click="sort"
        >{{isSorted ? '取消排序': ' 排序'}}</button> -->
      </div>
      <div class="tips">
        <div
          v-show="noteCount >= tooManyNoteCount && !isGettingStatistics && !isGetStatisticsDone"
          class="tip warning"
        >共有 {{noteCount}} 篇笔记{{noteCount >= tooManyNoteCount ? ', 统计可能需要较长时间' : ''}}</div>
        <div class="tip processing" v-show="isGettingStatistics && !isGetStatisticsDone">统计中...</div>
        <div
          class="tip result-info"
          v-show="!isGettingStatistics && isGetStatisticsDone"
        >统计结束, 耗时: {{timeConsumption/1000}}s</div>
      </div>
    </div>

    <!-- result -->
    <div id="result">
      <div
        :class="{ item: true, lv1: item.lv === 1, lv2: item.lv === 2, lv3: item.lv === 3 }"
        v-for="(item, notePath) in displayFileInfo"
        :key="notePath"
        :title="notePath"
        @click="updateDisplayFilesInfo(notePath)"
      >
        <div class="note-path">
          <note-icon
            class="note-icon"
            :icon-name="notePath.split('/')[notePath.split('/').length - 1]"
          ></note-icon>
          {{notePath}}
        </div>
        <div class="info-line">
          <div
            class="info proportion"
          >占比: {{calProportion(notePath)}} {{calProportion(notePath, true)}}</div>
          <div class="info word-count">字数: {{calWordCount(item.wordCount)}}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Files from '@/models/files';
import NoteIcon from '@/components/note-icon/note-icon.vue';

const isEnableConsole = false;

export default {
  name: 'statistics',
  components: {
    NoteIcon,
  },
  data() {
    return {
      editor: null,
      catalog: null,
      allFilesInfoProcessed: null,
      displayFileInfo: {},
      isGettingStatistics: false,
      isGetStatisticsDone: false,
      noteCount: null,
      tooManyNoteCount: 500,
      timeConsumption: 0,
      lastSelectedPath: '',
      isSorted: false,
    };
  },

  watch: {
    // eslint-disable-next-line func-names
    '$store.state.editor': {
      immediate: true,
      handler(value) {
        if (value) {
          this.editor = value;
          if (this.editor && this.editor.catalogPlugin) {
            this.noteCount = this.editor.catalogPlugin.getNoteCount();
          }
        }
      },
    },

    '$store.state.catalog': {
      immediate: true,
      deep: true,
      handler(value) {
        if (value) {
          this.catalog = value;
        }
      },
    },
  },

  methods: {
    /**
     * getStatistics
     */
    async getStatistics() {
      this.clear();
      const startTime = new Date();
      let tempInfo = await Files.getAllFilesInfo();
      tempInfo = this.calAllFilesInfoProcessed(tempInfo);
      // this.allFilesInfoProcessed = this.sortByCatalog(tempInfo);
      this.allFilesInfoProcessed = this.sortByWordCount(tempInfo);
      this.updateDisplayFilesInfo('/');
      this.timeConsumption = new Date() - startTime;
      this.isGettingStatistics = false;
      this.isGetStatisticsDone = true;
    },

    /**
     * clear
     */
    clear() {
      this.isSorted = false;
      this.isGettingStatistics = true;
      this.isGetStatisticsDone = false;
      this.displayFileInfo = {};
    },

    /**
     * click handler of sort button
     */
    sort() {
      if (this.isSorted) {
        this.allFilesInfoProcessed = this.sortByCatalog(this.allFilesInfoProcessed);
      } else {
        this.allFilesInfoProcessed = this.sortByWordCount(this.allFilesInfoProcessed);
      }

      this.updateDisplayFilesInfo('/');
      this.isSorted = !this.isSorted;
    },

    /**
     * calculate allFilesInfoProcessed from allFilesInfo
     * @param {Object} oldInfo allFilesInfo
     * @return {Object} allFilesInfoProcessed
     */
    calAllFilesInfoProcessed(oldInfo) {
      const res = {};
      const lv1 = Object.keys(oldInfo);
      res['/'] = {
        lv: 0,
        childrenNum: lv1.length,
      };
      let wordCount0 = 0;
      lv1.forEach((dir1) => {
        const lv2 = Object.keys(oldInfo[dir1]);
        res[dir1] = {
          lv: 1,
          childrenNum: lv2.length,
        };
        let wordCount1 = 0;
        lv2.forEach((dir2) => {
          const lv3 = Object.keys(oldInfo[dir1][dir2]);
          res[`${dir1}/${dir2}`] = {
            lv: 2,
            childrenNum: lv3.length,
          };
          let wordCount2 = 0;
          lv3.forEach(async (note) => {
            res[`${dir1}/${dir2}/${note}`] = {
              lv: 3,
              childrenNum: 0,
              wordCount: oldInfo[dir1][dir2][note].wordCount,
            };
            wordCount2 += oldInfo[dir1][dir2][note].wordCount;
          });
          res[`${dir1}/${dir2}`].wordCount = wordCount2;
          wordCount1 += wordCount2;
        });
        res[dir1].wordCount = wordCount1;
        wordCount0 += wordCount1;
      });
      res['/'].wordCount = wordCount0;
      return res;
    },

    /**
     * sort allFilesInfoProcessed by catalog
     * @param {Object} oldInfo allFilesInfoProcessed
     * @return {Object} allFilesInfoProcessed
     */
    sortByCatalog(oldInfo) {
      if (!this.catalog) {
        return oldInfo;
      }
      const res = {
        '/': oldInfo['/'],
      };
      Object.keys(this.catalog).forEach((dir1) => {
        res[dir1] = oldInfo[dir1];
        Object.keys(this.catalog[dir1]).forEach((dir2) => {
          res[`${dir1}/${dir2}`] = oldInfo[`${dir1}/${dir2}`];
          Object.keys(this.catalog[dir1][dir2]).forEach((dir3) => {
            res[`${dir1}/${dir2}/${dir3}`] = oldInfo[`${dir1}/${dir2}/${dir3}`];
          });
        });
      });
      return res;
    },

    /**
     * sort allFilesInfoProcessed by word count
     * @param {Object} oldInfo allFilesInfoProcessed
     * @return {Object} allFilesInfoProcessed
     */
    sortByWordCount(oldInfo) {
      const sorted = {};
      const notePathArr = Object.keys(oldInfo);
      notePathArr.sort((a, b) => oldInfo[b].wordCount - oldInfo[a].wordCount);
      notePathArr.forEach((notePath) => {
        sorted[notePath] = oldInfo[notePath];
      });

      const sortedPath = {};
      sortedPath['/'] = {};
      Object.keys(sorted).forEach((path) => {
        if (path !== '/') {
          const pathArr = path.split('/');
          if (pathArr.length === 1) {
            sortedPath['/'][pathArr[0]] = {};
          } else if (pathArr.length === 2) {
            sortedPath['/'][pathArr[0]][pathArr[1]] = {};
          } else if (pathArr.length === 3) {
            sortedPath['/'][pathArr[0]][pathArr[1]][pathArr[2]] = {};
          }
        }
      });

      const res = {};
      Object.keys(sortedPath).forEach((dir0) => {
        res[dir0] = sorted[dir0];
        Object.keys(sortedPath[dir0]).forEach((dir1) => {
          res[dir1] = sorted[dir1];
          Object.keys(sortedPath[dir0][dir1]).forEach((dir2) => {
            res[`${dir1}/${dir2}`] = sorted[`${dir1}/${dir2}`];
            Object.keys(sortedPath[dir0][dir1][dir2]).forEach((dir3) => {
              res[`${dir1}/${dir2}/${dir3}`] =
                sorted[`${dir1}/${dir2}/${dir3}`];
            });
          });
        });
      });
      return res;
    },

    /**
     * click handler of result item. Update display file info
     * @param {String} curSelectedPath current selected note path
     */
    updateDisplayFilesInfo(curSelectedPath) {
      if (!this.allFilesInfoProcessed || !curSelectedPath) {
        // do nothing
      } else if (this.allFilesInfoProcessed[curSelectedPath].lv === 3) {
        this.$store.commit(
          'updateGotoThisCatalog',
          curSelectedPath.split('/').slice(0, 3)
        );
      } else {
        const res = {};
        if (curSelectedPath === '/') {
          for (const notePath in this.allFilesInfoProcessed) {
            if (this.allFilesInfoProcessed[notePath].lv <= 1) {
              res[notePath] = this.allFilesInfoProcessed[notePath];
            }
          }
          this.lastSelectedPath = curSelectedPath;
        } else if (
          curSelectedPath === this.lastSelectedPath ||
          this.lastSelectedPath.includes(`${curSelectedPath}/`)
        ) {
          Object.keys(this.displayFileInfo).forEach((notePath) => {
            if (!notePath.includes(`${curSelectedPath}/`)) {
              res[notePath] = this.displayFileInfo[notePath];
            }
          });
          this.lastSelectedPath = '';
        } else if (curSelectedPath !== this.lastSelectedPath) {
          const notePathArr = curSelectedPath.split('/');
          for (const notePath in this.allFilesInfoProcessed) {
            if (this.allFilesInfoProcessed[notePath].lv <= 1) {
              res[notePath] = this.allFilesInfoProcessed[notePath];
            } else if (
              notePath.includes(`${curSelectedPath}/`) &&
              this.allFilesInfoProcessed[notePath].lv ===
                this.allFilesInfoProcessed[curSelectedPath].lv + 1
            ) {
              res[notePath] = this.allFilesInfoProcessed[notePath];
            } else if (notePath === curSelectedPath) {
              res[notePath] = this.allFilesInfoProcessed[notePath];
            } else if (notePathArr.length === 2) {
              if (
                notePath === notePathArr[0] ||
                (notePath.includes(`${notePathArr[0]}/`) &&
                  this.allFilesInfoProcessed[notePath].lv === 2)
              ) {
                res[notePath] = this.allFilesInfoProcessed[notePath];
              }
            }
          }
          this.lastSelectedPath = curSelectedPath;
        }
        this.displayFileInfo = res;
      }
    },

    /**
     * Calculate the word count proportion
     * @param {String} notePath the note whose proportion is calculated
     * @param {Boolean} isTotalProportion is calculate total proportion
     * @return {String} proportion
     */
    calProportion(notePath, isTotalProportion) {
      let res = '';
      let parentWordCount = 0;
      const allWordCount = this.allFilesInfoProcessed['/'].wordCount;
      if (notePath === '/') {
        parentWordCount = allWordCount;
      } else {
        const notePathArr = notePath.split('/');
        if (notePathArr.length === 1) {
          parentWordCount = this.allFilesInfoProcessed['/'].wordCount;
        } else if (notePathArr.length === 2) {
          parentWordCount = this.allFilesInfoProcessed[notePathArr[0]]
            .wordCount;
        } else if (notePathArr.length === 3) {
          parentWordCount = this.allFilesInfoProcessed[
            `${notePathArr[0]}/${notePathArr[1]}`
          ].wordCount;
        }
      }
      if (parentWordCount === 0) {
        parentWordCount = 1; // Prevent divisor from being 0
      }
      if (isTotalProportion) {
        parentWordCount = allWordCount;
      }
      res = (
        (this.allFilesInfoProcessed[notePath].wordCount / parentWordCount) *
        100
      ).toFixed(2);
      res += '%';
      return res;
    },

    /**
     * word count display format
     * @param {Number} wordCount
     * @return {String} wordCountString
     */
    calWordCount(wordCount) {
      let res = 0;
      if (wordCount < 1000) {
        res = wordCount;
      } else {
        res = `${(wordCount / 10000).toFixed(2)}万`;
      }
      return res;
    },
  },

  created() {
    if (isEnableConsole) {
      console.log('created');
    }
  },

  destroyed() {
    if (isEnableConsole) {
      console.log('destroyed');
    }
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#statistics {
  position: relative;
  height: 100%;
}
#top-bar {
  height: 52px;
  padding-top: 2px;
  box-sizing: border-box;
  text-align: center;
  .buttons {
    display: flex;
    .get-statistics {
      flex-grow: 7;
      margin: 0px 3px;
    }
    .sort {
      flex-grow: 0;
      flex-shrink: 0;
      flex-basis: 100px;
      margin-right: 3px;
    }
    button {
      padding: 3px 0px;
      border: 1px solid $sidebar-button-border-color;
      font-size: $font-size-sidebar;
      box-sizing: border-box;
      background: $sidebar-button-bg;
      color: $tool-page-color;
      cursor: pointer;
      &:hover {
        background: darken($color: $sidebar-item-hover-bg, $amount: 2);
      }
      &.active {
        background: darken($color: $sidebar-item-active-bg, $amount: 2);
      }
    }
    button[disabled] {
      background: $sidebar-button-disabled-bg;
      color: $sidebar-button-disabled-color;
      cursor: default;
      &:hover {
        background: $sidebar-button-disabled-bg;
      }
    }
  }
  .tips {
    height: 24px;
    .tip {
      height: 100%;
      line-height: 24px;
      color: $comment-color;
    }
    .warning {
      font-size: $font-size-sidebar;
      text-align: center;
      background: $warning-bg;
      color: $warning-color;
    }
  }
}

#result {
  position: absolute;
  width: 100%;
  left: 0;
  right: 0;
  top: 52px;
  bottom: 0;
  overflow: auto;
  .item {
    padding: 4px 8px;
    box-sizing: border-box;
    cursor: pointer;
    &:hover {
      background: $sidebar-item-hover-bg;
    }
    &:last-of-type {
      margin-bottom: 200px;
    }
    .note-path {
      height: 16px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      .note-icon {
        height: 80%;
      }
    }
    .info-line {
      color: $comment-color;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .info {
      display: inline-block;
      padding-right: 8px;
      padding-top: 2px;
    }
  }
  .lv1 {
    padding-left: 20px;
  }
  .lv2 {
    padding-left: 40px;
  }
  .lv3 {
    padding-left: 60px;
  }
}
</style>
