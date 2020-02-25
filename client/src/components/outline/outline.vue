<template>
  <div id="outline">
    <div id="outline-info" v-if="!displayHeaders">没有发现标题~</div>
    <div
      :class="{
        item: true,
        header1: header.lv === 1,
        header2: header.lv === 2,
        header3: header.lv === 3,
        header4: header.lv === 4,
        header5: header.lv === 5,
        header6: header.lv === 6,
        active: header.lineNum === activeHeaderLineNum
      }"
      :ref="`lineNum${header.lineNum}`"
      :key="header.lineNum + '-' + header.lv + '-' + header.text"
      v-for="header of displayHeaders"
      @click="scrollNoteToThisLine(header.lineNum)"
    >{{ header.text.replace(/^#+/, '') }}</div>
  </div>
</template>
<script>
import classNames from '@/tools/class-names';

const isEnableConsole = false;

export default {
  name: 'outline',
  data() {
    return {
      editor: null,
      allHeaders: null,
      displayHeaders: null,
      curCursorLineNum: null,
      updateDelay: 500, // ms
      updateTimer: null,
      isUpdatedAfterSwitch: false,
      isContentChanged: false,
      isForbidHeadersBarToScroll: false,
      highlightLineClass: classNames.highlightLineClass,
      activeHeaderLineNum: -1,
    };
  },

  watch: {
    // eslint-disable-next-line func-names
    '$store.state.editor': {
      immediate: true,
      handler(value) {
        if (value) {
          this.editor = value;
          if (isEnableConsole) {
            console.log('get editor', this.editor);
          }
          if (!this.isUpdatedAfterSwitch) {
            if (isEnableConsole) {
              console.log('update after switch');
            }
            this.updateAllHeaders();
            this.isUpdatedAfterSwitch = true;
          }
          this.editor.on('changes', this.changesHandler);
        }
      },
    },

    // eslint-disable-next-line func-names
    '$store.state.editor.curCursorLineNum': {
      immediate: true,
      handler(value) {
        this.curCursorLineNum = value;
        if (value && !this.isContentChanged) {
          const startTime = new Date();
          this.calDisplayHeaders(value);
          if (this.isForbidHeadersBarToScroll) {
            this.isForbidHeadersBarToScroll = false;
          } else {
            this.focusActiveHeader(value);
          }
          if (isEnableConsole) {
            console.log('cursor changed: ', value);
            console.log('update consumption(cursor): ', new Date() - startTime);
          }
        }
      },
    },
  },

  methods: {
    // changes handler
    changesHandler() {
      this.isContentChanged = true;
      clearTimeout(this.updateTimer);
      this.updateTimer = setTimeout(() => {
        const startTime = new Date();
        this.updateAllHeaders();
        this.calDisplayHeaders(this.curCursorLineNum);
        this.focusActiveHeader(this.curCursorLineNum);
        this.isContentChanged = false;
        const updateConsumption = new Date() - startTime;
        if (isEnableConsole) {
          console.log(
            'update consumption: (changes event emitted)',
            updateConsumption
          );
        }
        if (updateConsumption > 50) {
          console.warn(
            'It took too long to update todos(without delay, ms): ',
            updateConsumption
          );
        }
        console.log('outline: changes', updateConsumption);
      }, this.updateDelay);
    },

    // update outline
    updateAllHeaders() {
      this.allHeaders = this.editor.getHeadersHierarchy();
      if (isEnableConsole) {
        console.log('update all headers: ', this.allHeaders);
      }
    },

    // scroll outline to active header
    // may not be compatible, but available in chrome
    focusActiveHeader() {
      setTimeout(() => {
        if (isEnableConsole) {
          console.log('focus active header');
        }
        if (
          this.$refs[`lineNum${this.activeHeaderLineNum}`] &&
          this.$refs[`lineNum${this.activeHeaderLineNum}`][0]
        ) {
          this.$refs[`lineNum${this.activeHeaderLineNum}`][0].scrollIntoView({
            behavior: 'auto',
            block: 'center',
            inline: 'center',
          });
        }
      }, 0);
    },

    // calculate headers to disply in the outline area
    calDisplayHeaders(curCursorLineNum) {
      if (!this.allHeaders || this.allHeaders.length === 0) {
        this.displayHeaders = [];
        return;
      }
      // calculate the active header
      let activeHeader = null;
      let headersHierarchy = [];
      for (const h1 of this.allHeaders) {
        if (h1.lineNum <= curCursorLineNum) {
          activeHeader = h1;
          headersHierarchy[0] = h1;
        }
        if (h1.children.length === 0) continue;
        for (const h2 of h1.children) {
          if (h2.lineNum <= curCursorLineNum) {
            activeHeader = h2;
            headersHierarchy[1] = h2;
          }
          if (h2.children.length === 0) continue;
          for (const h3 of h2.children) {
            if (h3.lineNum <= curCursorLineNum) {
              activeHeader = h3;
              headersHierarchy[2] = h3;
            }
            if (h3.children.length === 0) continue;
            for (const h4 of h3.children) {
              if (h4.lineNum <= curCursorLineNum) {
                activeHeader = h4;
                headersHierarchy[3] = h4;
              }
              if (h4.children.length === 0) continue;
              for (const h5 of h4.children) {
                if (h5.lineNum <= curCursorLineNum) {
                  activeHeader = h5;
                  headersHierarchy[4] = h5;
                }
                if (h5.children.length === 0) continue;
                for (const h6 of h5.children) {
                  if (h6.lineNum <= curCursorLineNum) {
                    activeHeader = h6;
                    headersHierarchy[5] = h6;
                  }
                }
              }
            }
          }
        }
      }
      if (!activeHeader) {
        this.displayHeaders = [];
        return;
      }

      headersHierarchy = headersHierarchy.slice(0, activeHeader.lv);

      // console.log(curCursorLineNum, headersHierarchy, activeHeader);
      const displayHeaders = [];
      for (const h1 of this.allHeaders) {
        displayHeaders.push(h1);
        if (h1.children.length === 0) continue;
        for (const h2 of h1.children) {
          displayHeaders.push(h2);
          if (h2.children.length === 0) continue;
          for (const h3 of h2.children) {
            if (
              activeHeader.lv >= 2 &&
              headersHierarchy[0] === h1 &&
              headersHierarchy[1] === h2
            ) {
              displayHeaders.push(h3);
            }
            if (h3.children.length === 0) continue;
            for (const h4 of h3.children) {
              if (
                activeHeader.lv >= 3 &&
                headersHierarchy[0] === h1 &&
                headersHierarchy[1] === h2 &&
                headersHierarchy[2] === h3
              ) {
                displayHeaders.push(h4);
              }
              if (h4.children.length === 0) continue;
              for (const h5 of h4.children) {
                if (
                  activeHeader.lv >= 4 &&
                  headersHierarchy[0] === h1 &&
                  headersHierarchy[1] === h2 &&
                  headersHierarchy[2] === h3 &&
                  headersHierarchy[3] === h4
                ) {
                  displayHeaders.push(h5);
                }
                if (h5.children.length === 0) continue;
                for (const h6 of h5.children) {
                  if (
                    activeHeader.lv >= 5 &&
                    headersHierarchy[0] === h1 &&
                    headersHierarchy[1] === h2 &&
                    headersHierarchy[2] === h3 &&
                    headersHierarchy[3] === h4 &&
                    headersHierarchy[4] === h5
                  ) {
                    displayHeaders.push(h6);
                  }
                }
              }
            }
          }
        }
      }

      // apply
      this.displayHeaders = displayHeaders;
      this.activeHeaderLineNum = activeHeader.lineNum;
    },

    // let the note scroll to this line
    scrollNoteToThisLine(lineNum) {
      // this.curCursorLineNum = lineNum;
      this.isForbidHeadersBarToScroll = true;
      this.calDisplayHeaders(lineNum);
      this.editor.scrollNoteToThisLine(lineNum, this.highlightLineClass, 'unfoldAll', true);
    },
  },

  created() {
    if (isEnableConsole) {
      console.log('created');
    }
  },

  destroyed() {
    this.editor.off('changes', this.changesHandler);
    if (isEnableConsole) {
      console.log('destroyed');
    }
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#outline {
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  &::-webkit-scrollbar {
    width: 0px;
    height: 0px;
  }
  .item {
    position: relative;
    padding: 4px 10px 4px 8px;
    font-size: $font-size-sidebar + 0.5px;
    // height: 26px;
    // white-space: nowrap;
    // text-overflow: ellipsis;
    line-height: 1.4;
    overflow: hidden;
    border-bottom: 1px dashed darken($color: $tool-page-bg, $amount: 6);
    cursor: pointer;
    &:hover {
      background: $sidebar-item-hover-bg;
    }
    &:last-of-type {
      margin-bottom: 120px;
    }
  }
  .header1:not(:first-of-type) {
    margin-top: 10px;
  }
  .header1:first-of-type {
    padding-top: 4px;
  }
  .header1 {
    color: $header-1;
    font-weight: bold;
  }
  .header2 {
    color: $header-2;
    font-weight: bold;
  }
  .header3 {
    color: $header-3;
    padding-left: 20px;
  }
  .header4 {
    color: $header-4;
    padding-left: 40px;
  }
  .header5 {
    color: $header-5;
    padding-left: 60px;
  }
  .header6 {
    color: $header-6;
    padding-left: 80px;
  }
  .active {
    background: $sidebar-item-active-bg;
  }
}

#outline-info {
  width: 100%;
  text-align: center;
  font-size: $font-size-sidebar;
  height: 30px;
  line-height: 30px;
  background: $tool-page-bg;
  color: $comment-color;
}
</style>
