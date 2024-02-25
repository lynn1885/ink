<template>
  <div id="outline">
    <div id="outline-info" v-if="!displayHeaders">没有发现标题~</div>
    <div class="important-headers">
      <!-- 特级标题 -->
      <div class="headers-container">
        <div class="container-title">零级标题</div>
        <div
          v-if="header.lv === 1 && header.text.startsWith('# - ') "
          :class="{
            item: true,
            active: header.lineNum === activeHeaderLineNum
          }"
          :key="header.lineNum + '-' + header.lv + '-' + header.text"
          v-for="header of displayHeaders"
          @click="scrollNoteToThisLine(header.lineNum, false)"
          :title="header.text.replace(/^#+/, '')"
        >{{ header.text.replace(/^#+/, '') }}</div>
      </div>
      <!-- 重要标题 -->
      <div class="headers-container">
        <div class="container-title">重要标题</div>
        <div
          v-if="header.text.endsWith('⭐')"
          :class="{
            item: true,
            active: header.lineNum === activeHeaderLineNum
          }"
          :key="header.lineNum + '-' + header.lv + '-' + header.text"
          v-for="header of displayHeaders"
          @click="scrollNoteToThisLine(header.lineNum, false)"
          :title="header.text.replace(/^#+/, '')"
        >{{ header.text.replace(/^#+/, '') }}</div>
      </div>
      <!-- 一级标题 -->
      <div class="headers-container">
        <div class="container-title">一级标题</div>
        <div
          v-if="header.lv === 1 && (!header.text.startsWith('# %'))"
          :class="{
            item: true,
            active: header.lineNum === activeHeaderLineNum
          }"
          :key="header.lineNum + '-' + header.lv + '-' + header.text"
          v-for="header of displayHeaders"
          @click="scrollNoteToThisLine(header.lineNum, false)"
          :title="header.text.replace(/^#+/, '')"
        >{{ header.text.replace(/^#+/, '') }}</div>
      </div>
    </div>


    <div class="headers-container">
      <div
        :class="{
          item: true,
          header1: header.lv === 1,
          header2: header.lv === 2,
          header3: header.lv === 3,
          header4: header.lv === 4,
          header5: header.lv === 5,
          header6: header.lv === 6,
          important: header.text.includes('⭐'),
          danger: header.text.includes('❌'),
          cutting: header.text.startsWith('# - '),
          active: header.lineNum === activeHeaderLineNum
        }"
        :ref="`lineNum${header.lineNum}`"
        :key="header.lineNum + '-' + header.lv + '-' + header.text"
        v-for="header of displayHeaders"
        @click="scrollNoteToThisLine(header.lineNum)"
        :title="header.text.replace(/^#+/, '')"
      >
        {{ header.text.replace(/^#+/, '') }}
        <span v-if="header.children && header.children.length" class="children-count">{{header.children.length}}</span>
      </div>
    </div>

    <!-- 标题计数: 下面的-1是, 为了去除最后一行命令行带来的干扰-->
    <div class="headers-counter">
      <div class="count lv1">{{headerCount[1]}}</div>
      <div class="count lv2">{{headerCount[2]}}</div>
      <div class="count lv3">{{headerCount[3]}}</div>
      <div class="count lv4">{{headerCount[4]}}</div>
      <div class="count lv5">{{headerCount[5]}}</div>
      <div class="count lv6">{{headerCount[6]}}</div>
      <div class="count important"> <span class="star">⭐</span> {{headerCount.important}}</div>
      <div class="count all">{{headerCount.all}} 个知识点</div>
    </div>
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
      headerCount: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        important: 0,
        all: 0,
      }, // 标题计数
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
          this.updateAllHeaders();
          this.calDisplayHeaders(0);
          // if (!this.isUpdatedAfterSwitch) {
          //   if (isEnableConsole) {
          //     console.log('update after switch');
          //   }
          //   this.updateAllHeaders();
          //   this.isUpdatedAfterSwitch = true;
          // }
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
      this.calHeaderCount(this.allHeaders);
      if (isEnableConsole) {
        console.log('update all headers: ', this.allHeaders);
      }
    },

    // 计算1,2,3级标题个数
    calHeaderCount(headerArr = []) {
      const headerCount = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        important: 0
      };

      function getHeaderCount(lv, headers) {
        if (headers && headers.length) {
          headerCount[lv] += headers.length;
          headers.forEach((item) => {
            if (item.children && item.children.length) getHeaderCount(lv + 1, item.children);
            if (item && item.text.includes('⭐')) headerCount.important += 1;
          });
        }
      }

      getHeaderCount(1, headerArr);
      headerCount.all = headerCount[1] + headerCount[2] + headerCount[3] + headerCount[4] + headerCount[5] + headerCount[6];
      this.headerCount = headerCount;
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
      }, 200);
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
    scrollNoteToThisLine(lineNum, isForbidHeadersBarToScroll = true) {
      // this.curCursorLineNum = lineNum;
      this.isForbidHeadersBarToScroll = isForbidHeadersBarToScroll;
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
  position: relative;
  flex-direction: row;
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* &.float {
    display: flex;
    position: fixed;
    right: 10px;
    bottom: 30px;
    width: 230px;
    height: 400px;
    background: $float-bg-alpha;
    backdrop-filter: blur(10px);
    border-radius: 10px;
    z-index: $float-window-index;
    font-size: $font-size-sidebar;
    color: $tool-page-color;
    box-shadow: $float-box-shadow;
  } */

  /* 信息栏 */
  #outline-info {
    width: 100%;
    text-align: center;
    font-size: $font-size-sidebar;
    height: 30px;
    line-height: 30px;
    background: $tool-page-bg;
    color: $comment-color;
  }

  /* 标题容器 */
  .important-headers {
    width: 200px;
    flex-grow: 0;
    overflow-y: auto;
    &::-webkit-scrollbar {
      width: 0px;
      height: 0px;
    }
    .container-title {
      color: $header-1;
      text-align: center;
    }
    .item {
      padding: 4px 4px 4px 6px!important;
      color: $header-2;
    }
  }
  .headers-container {
    width: 100%;
    overflow: auto;
    box-sizing: border-box;

    &::-webkit-scrollbar {
      width: 0px;
      height: 0px;
    }
    .item {
      position: relative;
      padding: 4px 10px 4px 8px;
      font-size: $font-size-sidebar + 0.5px;
      white-space: nowrap;
      text-overflow: ellipsis;
      line-height: 1.4;
      overflow: hidden;
      border-bottom: $cutting-border-light;
      cursor: pointer;
      &:hover {
        background: $sidebar-item-hover-bg;
      }
      &:last-of-type {
        margin-bottom: 10px;
      }
      .children-count {
        position: absolute;
        right: 2px;
        top: 6px;
        min-width: 14px;
        height: 14px;
        line-height: 14px;
        border-radius: 2px;
        /* background: rgba(255, 255, 255, 0.5); */
        text-align: center;
        font-size: 11px;
      }
      &.cutting{
        // background: red;
        text-align: center;
        font-weight: bold;
        // background: $sidebar-item-active-bg;
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
    .important {
      background: rgba(252, 250, 241, 0.6);
    }
    .danger {
      // background: rgba(252, 242, 241, 0.6);
    }
    .cutting {
      /* text-align: center; */
    }
    .active {
      background: $sidebar-item-active-bg;
    }
  }

  /* 标题计数 */
  .headers-counter {
    flex-shrink: 0;
    flex-grow: 0;
    position: absolute;
    display: flex;
    bottom: 0;
    padding: 0 4px;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    width: 100%;
    .count {
      padding: 2px;
      margin: 2px;
      flex-shrink: 0;
    }
    .lv1 {
      color: $header-1;
      font-weight: bold;
    }
    .lv2 {
      color: $header-2;
      font-weight: bold;
    }
    .lv3 {
      color: $header-3;
    }
    .lv4 {
      color: $header-4;
    }
    .lv5 {
      color: $header-5;
    }
    .lv6 {
      color: $header-6;
    }
    .important {
      .star {
        display: inline-block;
        font-size: 10px;
        transform: translate(3px, -2px);
      }
      color:rgb(236, 204, 134);
    }
    .all {
      font-weight: bold;
      color:rgb(236, 204, 134);
      flex-grow: 1;
      text-align: right;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

}
</style>
