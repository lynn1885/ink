<template>
  <div id="knowledge-tree">
    <!-- top bar -->
    <div id="top-bar">
      <button class="get-knowledge-tree" @click="getKnowledgeTree">get knowledge tree</button>
      <button class="sort" @click="sort">{{isSort ? 'unsort': 'sort'}}</button>
      <div
        v-show="noteCount >= tooManyNoteCount"
        class="warning"
      >共有 {{noteCount}} 篇笔记{{noteCount >= tooManyNoteCount ? ', 读取分析可能需要较长时间' : ''}}</div>
      <div class="processing" v-show="isGettingKnowledgeTree">分析中...</div>
      <div class="result-info" v-show="isGettingKnowledgeTree">统计耗时</div>
    </div>

    <!-- result -->
    <div id="result">
      <div
        :class="{ item: true, lv1: item.lv === 1, lv2: item.lv === 2, lv3: item.lv === 3 }"
        v-for="(item, notePath) in displayKnowledgeTree"
        :key="notePath"
        :title="notePath"
        @click="updateDisplayKnowledgeTree(notePath)"
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

const isEnableConsole = true;

export default {
  name: 'knowledge-tree',
  components: {
    NoteIcon,
  },
  data() {
    return {
      editor: null,
      catalog: null,
      allFileInfo: null,
      allFilesInfoProcessed: null,
      isGettingKnowledgeTree: false,
      isGetKnowledgeTreeDone: false,
      noteCount: null,
      tooManyNoteCount: 500,
      displayKnowledgeTree: [],
      lastSelectedPath: '',
      isSort: false,
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
    async getKnowledgeTree() {
      this.allFileInfo = await Files.getAllFilesInfo();
      const tempInfo = this.calAllFilesInfoProcessed(this.allFileInfo);
      this.allFilesInfoProcessed = this.sortByCatalog(tempInfo);
      this.updateDisplayKnowledgeTree('/');
    },

    sort() {
      if (this.isSort) {
        // eslint-disable-next-line function-paren-newline
        this.allFilesInfoProcessed = this.sortByCatalog(
          this.allFilesInfoProcessed
        // eslint-disable-next-line function-paren-newline
        );
        this.updateDisplayKnowledgeTree('/');
      } else {
        // eslint-disable-next-line function-paren-newline
        this.allFilesInfoProcessed = this.sortByWordCount(
          this.allFilesInfoProcessed
        // eslint-disable-next-line function-paren-newline
        );
        this.updateDisplayKnowledgeTree('/');
      }
      this.isSort = !this.isSort;
    },

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

    sortByCatalog(oldInfo) {
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

      console.log(sortedPath);
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
      console.log(res);
      return res;
    },

    updateDisplayKnowledgeTree(curSelectedPath) {
      if (
        !this.allFilesInfoProcessed ||
        !curSelectedPath ||
        this.allFilesInfoProcessed[curSelectedPath].lv === 3
      ) {
        return;
      }
      const res = {};

      if (curSelectedPath === '/') {
        for (const notePath in this.allFilesInfoProcessed) {
          if (this.allFilesInfoProcessed[notePath].lv <= 1) {
            res[notePath] = this.allFilesInfoProcessed[notePath];
          }
        }
        this.lastSelectedPath = curSelectedPath;
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
      } else if (curSelectedPath === this.lastSelectedPath) {
        Object.keys(this.displayKnowledgeTree).forEach((notePath) => {
          if (!notePath.includes(`${curSelectedPath}/`)) {
            res[notePath] = this.displayKnowledgeTree[notePath];
          }
        });
        this.lastSelectedPath = '';
      }
      this.displayKnowledgeTree = res;
    },

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
        console.log(allWordCount);
        parentWordCount = allWordCount;
      }
      res = (
        (this.allFilesInfoProcessed[notePath].wordCount / parentWordCount) *
        100
      ).toFixed(2);
      res += '%';
      return res;
    },

    calWordCount(number) {
      let res = 0;
      if (number < 1000) {
        res = number;
      } else {
        res = `${(number / 10000).toFixed(2)}万`;
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
#knowledge-tree {
  position: relative;
  height: 100%;
}
#top-bar {
  height: 42px;
  padding-top: 2px;
  box-sizing: border-box;
  text-align: center;
  .get-knowledge-tree {
    width: 70%;
  }
  .sort {
    width: 26%;
    margin-right: 2px;
    float: right;
  }
  button {
    padding: 2px;
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
  .warning {
    font-size: $font-size-sidebar;
    padding: 2px 0px;
    text-align: center;
    background: $warning-bg;
    color: $warning-color;
  }
}

#result {
  position: absolute;
  width: 100%;
  left: 0;
  right: 0;
  top: 42px;
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
    }
  }
  .lv1 {
    margin-left: 20px;
  }
  .lv2 {
    margin-left: 40px;
  }
  .lv3 {
    margin-left: 60px;
  }
}
</style>
