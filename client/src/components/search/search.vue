<template>
  <div id="search">
    <div id="search-container">
      <!-- 搜索其他 -->
      <div id="specific-search">
        <!-- 目录 -->
        <el-autocomplete
          class="ink-input-bar local-dir"
          v-model="specifiedSearchFolder"
          :fetch-suggestions="getFileHistory"
          placeholder="检索本地目录"
          :clearable="true"
        ></el-autocomplete>
        <!-- <input
          class="ink-input-bar local-dir"
          type="text"
          v-model="specifiedSearchFolder"
          placeholder="检索本地目录"
          autocomplete
        /> -->
        <!-- 文件类型 -->
        <!-- <input
          class="ink-input-bar"
          type="txt"
          v-model="specifiedSearchExtName"
          placeholder='拓展名，默认为 .txt'
        /> -->

        <!-- 临近检索 -->
        <input
          class="ink-input-bar"
          type="number"
          v-model="nearDistance"
          placeholder='文本距离'
          step="10"
          max="500"
          min="0"
        />

        <!-- 最小得分 -->
        <input
          class="ink-input-bar"
          type="number"
          v-model="minScore"
          placeholder='最少分'
          step="10"
          max="200"
          min="0"
        />
      </div>

      <!-- 搜索框 -->
      <div id="search-bar">
        <input
          class="ink-input-bar"
          type="text"
          v-model="searchText"
          :maxlength="maxSearchTextLength"
          @keydown="searchBarKeyDownHandler"
          ref="search-bar"
        />
        <button :class="{'ink-button': true, 'active': isGlobal}" @click="isGlobal = !isGlobal" title="golbal search">g</button>
        <button
          :class="{'ink-button': true, 'active': isSensitiveToCase}"
          title="sensitive to English case"
          @click="isSensitiveToCase = !isSensitiveToCase"
        >Aa</button>
        <!-- <button
          :class="{'active': isRegExp}"
          title="use regular expression"
          @click="isRegExp = !isRegExp"
        >r</button>-->
        <div class="clear" @click="clear(true)">×</div>
      </div>
      <!-- 检索框 -->

    </div>

    <!-- replace bar -->
    <!-- unavailable now!! -->
    <div id="replace-bar" v-if="false">
      <input
        class="input-bar"
        type="text"
        v-model="replaceText"
        @keydown="replaceAll"
        :disabled="!isReplaceAllAvailable"
      />
      <button :disabled="!isReplaceAllAvailable" @click="replace">replace all</button>
    </div>

    <!-- search info -->
    <div id="search-info">
      <!-- {{curFilePath}} -->
      <div v-show="isSearchDone">
        <div
          v-if="searchedItemsNum < maxSearchResLength"
        >共匹配到 {{searchedItemsNum}} 条结果, 耗时{{timeConsumption/1000}}s</div>
        <div
          class="warning"
          v-else
        >匹配项过多, 只显示前 {{maxSearchResLength}} 条结果, 耗时{{timeConsumption/1000}}s</div>
      </div>
      <div v-show="isSearching">搜索中...</div>
      <div v-show="!isSearching && !isSearchDone">按Enter键进行搜索, 点击×清空搜索~</div>
    </div>

    <!-- search results -->
    <div id="search-results" ref="search-results">
      <div class="note" :key="note.dir" v-for="note of searchResults">
        <div
          class="note-dir"
          v-if="note.items.length > 0"
          @click="closedSearchRes[note.dir] ? $set(closedSearchRes, note.dir, false) : $set(closedSearchRes, note.dir, true)"
          @dblclick="closedSearchRes[note.dir] ? searchResults.forEach(note =>  $set(closedSearchRes, note.dir, false)) : searchResults.forEach(note =>  $set(closedSearchRes, note.dir, true))"
        >
          <note-icon class="note-icon" :icon-name="note.dir.split('/')[2]"></note-icon>
          {{note.dir.slice(0, note.dir.length)}} ({{note.maxLineScore}}分，{{note.score}}分，{{note.items.length}}个)
        </div>
        <div
          v-for="item of note.items"
          v-show="!closedSearchRes[note.dir] "
          :class="{item: true, active: activeSearchItem === item}"

          :key="item.noteDir + item.line + '/' + item.char"
          @click="clickSearchItemHandler(item, $event)"
        >
          <div class="line" >{{item.noteDir}} {{item.line}}行，<span :style="'color: ' + getColorFromNum(item.lineScore)">{{item.lineScore}}分</span></div>
          <pre class="header" v-if="item.headers && item.headers.length">{{item.headers.join('\n') }}</pre>
          <pre class="preview" v-html="item.previewHighlight"></pre>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import NoteIcon from '@/components/note-icon/note-icon.vue';
import classNames from '@/tools/class-names.js';
import Files from '@/models/files';
import tools from '@/tools/tools';

const isEnableConsole = false;

export default {
  name: 'search',
  components: {
    NoteIcon,
  },
  props: {
    timestamp: Number
  },
  data() {
    return {
      editor: null,
      curFilePath: null,
      curFileDir: null,
      searchText: '',
      minScore: null,
      specifiedSearchFolder: '', // 要搜索的目录
      specifiedSearchExtName: '', // 要搜索的文件类型
      nearDistance: null, // 多少字以内，不设置或为0时，不限制距离
      lastSearchText: '',
      replaceText: '',
      isGlobal: false,
      isSensitiveToCase: false,
      isSearchDone: false,
      isSearching: false,
      isRegExp: false,
      updateDelay: 1400, // ms
      updateTimer: null,
      searchedItemsNum: 0,
      maxSearchTextLength: 30,
      maxSearchResLength: null, // According to different situations, will be set to different values
      maxSearchResLengthOneNote: 100, // When searching for a note
      maxSearchResLengthAll: 500, // when searching for all notes
      timeConsumption: null,
      closedSearchRes: {},
      searchResults: [],
      activeSearchItem: null,
      waitHighlightAndScrollNoteDir: null,
      searchedTextClass: classNames.searchedTextClass,
      highlightLineClass: classNames.highlightLineClass,
    };
  },

  watch: {
    // eslint-disable-next-line func-names
    '$store.state.editor': {
      immediate: true,
      handler(value) {
        if (value) {
          this.editor = value;
        }
      },
    },

    // eslint-disable-next-line func-names
    '$store.state.curFilePath': {
      immediate: true,
      handler(value) {
        if (value) {
          // get curFilePath & curFileDir
          this.curFilePath = value;
          const curFilePathArr = this.curFilePath.split('/');
          this.curFileDir = `${curFilePathArr[0]}/${curFilePathArr[1]}/${
            curFilePathArr[2]
          }/`;

          // After the curFilePath changes, check whether it needs to be highlighted or scrolled.
          if (this.waitHighlightAndScrollNoteDir === this.curFileDir) {
            if (isEnableConsole) {
              console.log(
                'need to highlight and scroll after change curFilePath: ',
                this.waitHighlightAndScrollNoteDir
              );
            }
            this.waitHighlightAndScrollNoteDir = null;
            setTimeout(() => {
              this.highlight();
              this.editor.scrollNoteToThisLine(
                this.activeSearchItem.line,
                this.highlightLineClass,
                'intelligently',
                true,
              );
            }, 500);
          }
        }
      },
    },

    timestamp: {
      handler() {
        if (this.$refs['search-bar']) this.$refs['search-bar'].focus();
      }
    }
  },

  computed: {
    isReplaceAllAvailable() {
      if (
        !this.isGlobal &&
        this.searchedItemsNum > 0 &&
        this.searchedItemsNum < this.maxSearchResLength
      ) {
        return true;
        // eslint-disable-next-line no-else-return
      } else {
        return false;
      }
    },
  },

  methods: {
    // search entry 1
    async search() {
      // clear & check
      if (isEnableConsole) {
        console.log('begin search');
      }


      this.clear();
      if (!this.searchText) {
        return;
      }

      // search
      this.lastSearchText = this.searchText;
      let res;
      const startTime = new Date();
      this.isSearching = true;
      this.editor.on('changes', this.changesHandler);

      if (this.isGlobal) {
        // search all
        await this.editor.runCommand('SAVE', {
          triggerType: 'BEFORE_GLOBAL_SEARCH',
        }); // must save before global search
        this.maxSearchResLength = this.maxSearchResLengthAll;
        const searchRes = await this.searchAll();
        ({ res, searchedItemsNum: this.searchedItemsNum } = searchRes);
        if (isEnableConsole) {
          console.log('search globally');
        }
        // fold results automatically
        res.forEach((note) => { this.$set(this.closedSearchRes, note.dir, true); });
      } else {
        // search one
        this.maxSearchResLength = this.maxSearchResLengthOneNote;
        const searchRes = this.searchCurrent(this.searchText);
        ({ res, searchedItemsNum: this.searchedItemsNum } = searchRes);
        if (isEnableConsole) {
          console.log('search one');
        }
      }
      if (isEnableConsole) {
        console.log('searched items number', this.searchedItemsNum);
      }

      // apply results
      if (this.searchedItemsNum) {
        // res = this.sortSearchRes(res); // 不再排序，后端会排序
        this.searchResults = res;
        this.highlight();
      }

      // sundry
      this.isSearchDone = true;
      this.isSearching = false;
      if (this.$refs['search-results']) {
        this.$refs['search-results'].scrollTop = 0;
      }
      const timeConsumption = new Date() - startTime;
      this.timeConsumption = timeConsumption;
      if (isEnableConsole) {
        console.log(
          'search end, results: ',
          this.searchResults,
          'time consumption: ',
          timeConsumption
        );
      }
    },

    // search entry 2
    changesHandler(cm, changes) {
      if (this.isGlobal) {
        return;
      }
      clearTimeout(this.updateTimer);
      // on changes
      this.updateTimer = setTimeout(() => {
        const startTime = new Date();
        if (this.isGlobal) {
          let searchText = this.lastSearchText;
          if (this.searchText.includes('|')) {
            [, searchText] = this.lastSearchText.split('|');
          }
          // global
          // after the global search, you will get a result set
          // when you are updating your note content(instead of jumping to another note)
          // the result set will update automatically
          // instead of triggering a new request, the update is calculated locally and partially
          // Perhaps the note you added contains several keywords to search for, and at the same time the result set will grow
          // However, the result set cannot grow endlessly, which will make the page become stuck.
          // The result set can grow by up to `this.maxSearchResLengthAll + 50`
          if (changes[0].origin !== 'setValue') {
            if (this.searchedItemsNum >= this.maxSearchResLengthAll + 50) {
              return;
            }
            for (let i = 0; i < this.searchResults.length; i += 1) {
              if (this.searchResults[i].dir === this.curFileDir) {
                const searchRes = this.searchCurrent(searchText);
                if (searchRes && searchRes.res && searchRes.res[0]) {
                  this.searchedItemsNum =
                    // eslint-disable-next-line no-mixed-operators
                    this.searchedItemsNum -
                    // eslint-disable-next-line no-mixed-operators
                    this.searchResults[i].items.length +
                    searchRes.res[0].items.length;
                  if (this.searchedItemsNum > this.maxSearchResLengthAll + 50) {
                    break;
                  }
                  this.$set(this.searchResults, i, searchRes.res[0]);
                  this.highlight();
                }
                break;
              }
            }
          } else if (changes[0].origin === 'setValue') {
            // If you jump to a note outside the result set: clear the result set
            // If you jump to a note inside the result set: do nothing
            let isNeedClear = true;
            for (let i = 0; i < this.searchResults.length; i += 1) {
              if (this.searchResults[i].dir === this.curFileDir) {
                isNeedClear = false;
                break;
              }
            }
            if (isNeedClear) {
              this.clear();
            }
          } else {
            // other conditions: clear the result set
            this.clear();
          }
        } else if (!this.isGlobal) {
          // not global
          // When the current note content changes, the search will be triggered automatically.
          if (changes[0].origin !== 'setValue') {
            const searchRes = this.searchCurrent(this.lastSearchText);
            if (searchRes && searchRes.res && searchRes.res[0]) {
              this.searchedItemsNum = searchRes.searchedItemsNum;
              this.searchResults = searchRes.res;
              this.highlight();
              if (isEnableConsole) {
                console.log('changes event emitted(not global): update');
              }
            }
          } else {
            // If you jump to another note: clear the result set
            this.clear();
          }
        }
        const updateConsumption = new Date() - startTime;
        if (isEnableConsole) {
          console.log(
            'changes event emitted(is global): Partial update',
            'time consumption: ',
            updateConsumption
          );
        }
        console.log('search changes: ', updateConsumption);
      }, this.updateDelay);
    },

    // clear search text & unhighlight
    clear(isClearSearchText = false) {
      if (isEnableConsole) {
        console.log('clear');
      }
      if (isClearSearchText) this.searchText = '';
      this.replaceText = '';
      this.lastSearchText = '';
      this.searchResults = [];
      this.closedSearchRes = {};
      this.searchedItemsNum = 0;
      this.maxSearchResLength = null;
      this.waitHighlightAndScrollNoteDir = null;
      this.editor.off('changes', this.changesHandler);
      this.unhighlight();
      this.isSearchDone = false;
    },

    // search current note
    // Search for up to this.maxSearchResLength results
    searchCurrent(searchText) {
      let searchedItemsNum = 0;
      const res = [{ dir: this.curFileDir, items: [] }];
      if (!searchText) {
        return { searchedItemsNum, res };
      }
      const doc = this.editor.cm.getDoc();
      const lineCount = doc.lineCount();
      if (!this.isSensitiveToCase) {
        searchText = searchText.toLowerCase();
      }
      // eslint-disable-next-line no-labels
      search: for (let i = 0; i < lineCount; i += 1) {
        let lineText = doc.getLine(i);
        // is sensitive to case
        const oriLineText = lineText;
        if (!this.isSensitiveToCase) {
          lineText = lineText.toLowerCase();
        }
        // search
        if (!this.isRegExp) {
          // is not regexp
          let lastIndex = -1;
          let isFirstSearch = true;
          do {
            // eslint-disable-next-line no-labels
            if (searchedItemsNum >= this.maxSearchResLength) break search;
            lastIndex = lineText.indexOf(
              searchText,
              isFirstSearch ? 0 : lastIndex + searchText.length
            );
            isFirstSearch = false;
            if (lastIndex > -1) {
              const start = lastIndex - 30 < 0 ? 0 : lastIndex - 30;
              const previewHighlight = [
                lineText.slice(start, lastIndex),
                `<span class="${this.searchedTextClass}">`,
                oriLineText.slice(lastIndex, lastIndex + searchText.length),
                '</span>',
                lineText.slice(
                  lastIndex + searchText.length,
                  lastIndex + searchText.length + 30
                ),
              ].join('');
              res[0].items.push({
                noteDir: this.curFileDir,
                line: i,
                char: [lastIndex, lastIndex + searchText.length],
                previewHighlight,
              });
              searchedItemsNum += 1;
            }
          } while (lastIndex > -1);
        } else {
          // is regexp
          // const reg = new RegExp();
          // const matchRes = lineText.match()
        }
      }
      return { searchedItemsNum, res };
    },

    // search all notes
    // The search will be done on the server
    async searchAll() {
      // 记录本地路径
      if (this.specifiedSearchFolder) {
        const historyArr = JSON.parse(localStorage.getItem('localFileHistory')) || [];
        if (!historyArr.includes(this.specifiedSearchFolder)) {
          historyArr.push(this.specifiedSearchFolder);
          if (historyArr.length > 12) {
            historyArr.shift();
          }
        }
        localStorage.setItem('localFileHistory', JSON.stringify(historyArr));
      }

      let searchDir = '';
      let { searchText } = this;
      if (this.searchText.includes('|')) {
        const textArr = this.searchText.split('|');
        if (textArr[0] && textArr[1]) {
          [searchDir] = textArr;
          [, searchText] = textArr;
        }
      }
      const req = {
        fromPath: `${this.curFilePath
          .split('/')
          .slice(0, 3)
          .join('/')}/`,
        searchPath: searchDir,
        searchText,
        searchedTextClass: this.searchedTextClass,
        isRegExp: this.isRegExp,
        isSensitiveToCase: this.isSensitiveToCase,
        minScore: this.minScore,
        messager: this.$message,
        specifiedSearchFolder: this.specifiedSearchFolder,
        specifiedSearchExtName: this.specifiedSearchExtName,
      };
      if (this.nearDistance) req.nearDistance = this.nearDistance;
      const searchRes = await Files.searchAllFiles(req);

      // console.log(123, searchRes);
      return searchRes;
    },

    // search bar key down handler
    searchBarKeyDownHandler(e) {
      if (!this.isGlobal) {
        setTimeout(() => {
          this.search();
        }, 100);
      }

      // press Enter key
      if (e.keyCode === 13) {
        if (isEnableConsole) {
          console.log('search: press enter');
        }
        this.search();
      }
    },

    // click search item handler
    async clickSearchItemHandler(item, e) {
      this.activeSearchItem = item;

      if (item.isSpecifiedMode) {
        if (e.ctrlKey) {
          tools.copyText(item.previewText.slice(0, 12));
          await Files.open(item.noteDir, this.$message);
          this.$message.success('打开文件');
        }
        return;
      }

      if (this.curFileDir === item.noteDir) {
        // scroll directly
        this.editor.scrollNoteToThisLine(
          item.line,
          this.highlightLineClass,
          'unfoldAll',
          true
        );
      } else {
        // go to target note path, then scroll
        this.waitHighlightAndScrollNoteDir = item.noteDir;
        this.$store.commit(
          'updateGotoThisCatalog',
          item.noteDir.split('/').slice(0, 3)
        );
      }
    },

    // optimizeSearchRes
    sortSearchRes(res) {
      res.sort((a, b) => b.items.length - a.items.length);
      function sortItems(a, b) {
        const matchResA = a.previewHighlight.match(/^#+ /);
        const matchResB = b.previewHighlight.match(/^#+ /);
        const numA = matchResA ? 7 - matchResA[0].length : 0;
        const numB = matchResB ? 7 - matchResB[0].length : 0;
        return numB - numA;
      }
      for (let i = 0; i < res.length; i += 1) {
        res[i].items.sort(sortItems);
      }
      return res;
    },

    // todo: replace
    replace() {},

    // replace one
    replaceCurrent() {},

    // replace all
    replaceAll() {},

    // highlight the searched text
    highlight() {
      // this.editor.cm.execCommand('unfoldAll');
      let items = [];
      for (const note of this.searchResults) {
        if (note.dir === this.curFileDir) {
          ({ items } = note);
          if (isEnableConsole) {
            console.log('highlight:', note.dir);
          }

          break;
        }
      }
      const doc = this.editor.cm.getDoc();
      let i = 0;
      // Up to 'this.maxSearchResLengthOneNote' highlights per note
      // beacause doc.markText() is a very heavy operation.
      for (const item of items) {
        if (i < this.maxSearchResLengthOneNote) {
          doc.markText(
            { line: item.line, ch: item.char[0] },
            { line: item.line, ch: item.char[1] },
            {
              className: this.searchedTextClass,
            }
          );
          i += 1;
        } else {
          break;
        }
      }
    },

    // unhighlight the searched text
    unhighlight() {
      const doc = this.editor.cm.getDoc();
      const allMarks = doc.getAllMarks();
      for (const mark of allMarks) {
        if (mark.className === this.searchedTextClass) mark.clear();
      }
    },

    // 根据行号计算颜色
    getColorFromNum(num) {
      num = Number(num);
      // const a = (num * 30) % 56;
      // const b = (num * 50) % 256;
      // const c = (num * 70) % 256;
      // return `rgb(${a},${b},${c})`;
      if (num > 60) {
        return 'rgb(255 164 164)';
      } if (num > 50) {
        return 'purple';
      } else if (num > 40) {
        return 'green';
      } else if (num > 30) {
        return 'blue';
      } else if (num > 20) {
        return 'orange';
      }
      return 'red';
    },

    // 获取目录
    getFileHistory(str, cb) {
      const historyArr = JSON.parse(localStorage.getItem('localFileHistory'));
      if (historyArr && historyArr.length) {
        cb(historyArr.reverse().map(item => ({ value: item })));
      }
    }
  },
  mounted() {
    if (isEnableConsole) {
      console.log('mounted');
    }
    this.$refs['search-bar'].focus();
  },

  destroyed() {
    this.clear();
    if (isEnableConsole) {
      console.log('destroyed');
    }
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#search {
  height: 100%;
  position: relative;
}

// top bar
#search-bar,
#specific-search,
#replace-bar {
  position: relative;
  display: flex;
  height: 34px;
  padding: 4px;
  box-sizing: border-box;
  .input-bar[disabled] {
    background: $sidebar-input-disabled-bg;
  }
  input {
    height: 24px;
  }
  button {
    flex-basis: 26px;
    margin: 0px 2px;
  }
  button[disabled] {
    background: $sidebar-button-disabled-bg;
    color: $sidebar-button-disabled-color;
    cursor: default;
    &:hover {
      background: $sidebar-button-disabled-bg;
    }
  }
  .clear {
    position: absolute;
    right: 66px;
    font-size: 20px;
    line-height: 26px;
    color: $comment-color;
    cursor: pointer;
    &:hover {
      color: $tool-page-color;
    }
  }
}
#replace-bar {
  button {
    flex-basis: 100px;
  }
}
#specific-search {
  .local-dir {
    min-width: 60%;
  }
}
// search info
#search-info {
  text-align: center;
  font-size: $font-size-sidebar;
  height: 26px;
  line-height: 26px;
  color: $comment-color;
  .warning {
    background: $warning-bg;
    color: $warning-color;
  }
}

// search results
#search-results {
  position: absolute;
  width: 100%;
  left: 0;
  right: 0;
  top: 94px;
  bottom: 0;
  overflow-y: scroll;
  .note {
    margin-bottom: 6px;
    background: lighten($color: $tool-page-bg, $amount: 1);
    box-shadow: 0px 0px 2px 0px darken($color: $tool-page-bg, $amount: 4);
    font-size: $font-size-sidebar;
    color: $tool-page-color;
    .note-dir {
      // height: 24px;
      box-sizing: border-box;
      padding: 4px 4px;
      background: darken($color: $tool-page-bg, $amount: 0.6);
      cursor: pointer;
      // overflow: hidden;
      // text-overflow: ellipsis;
      // white-space: nowrap;
      .note-icon {
        height: 14px;
      }
    }
    .item {
      // cursor: pointer;
      padding: 3px 8px;
      border-top: 1px solid darken($color: $tool-page-bg, $amount: 2);
      .line {
        color: $comment-color;
        margin-bottom: 5px;
        font-size: 12px;
         &::selection {
          background: rgb(191, 220, 255)!important;
        }
      }
      .header {
        color: $comment-color;
        margin: 0px;
        font-size: 12px;
      }
      .preview {
        white-space: pre-wrap;
        margin: 0;
        &::selection {
          background: rgb(191, 220, 255)!important;
        }
      }
      &:hover {
        background: $sidebar-item-hover-bg;
      }
      &.active {
        background: $sidebar-item-active-bg;
      }
    }
    &:last-of-type {
      margin-bottom: 200px;
    }
  }
}
</style>


<style lang="scss">
.el-autocomplete-suggestion {
  width: 280px!important;
  .el-autocomplete-suggestion__wrap {
    padding: 0px!important;
    li {
      padding: 0px 2px;
      font-size: 12px;
    }
  }
}

</style>
