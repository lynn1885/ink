<template>
  <div
    id="side-bar"
    :class="{'side-bar-small-mode': isSideBarSmallMode}"
    @resize.native="resize"
    :style="{
      width: sideBarWidth
    }"
    >
    <!-- tool icons -->
    <div id="tool-icons">
      <div
        v-for="t of tools"
        v-show="t.icon"
        :title="t.displayName + (t.keyMap ? ` (${t.keyMap.join('+')})` : '')"
        :class="{
          'tool-icon': true,
          'active': t.name === activePage || activeButtons[t.name],
          'bottom-icon': t.isBottom
        }"
        :key="t.name"
        @click.exact="changeTool(t)"
        @click.ctrl="changeCommonTool(t.name)"
      >
        <svg viewBox="0 0 1024 1024" version="1.1" v-html="t.icon" />
        <!-- <div class="button-name" v-if="activeButtons[t.name] !== true && activeButtons[t.name] !== false">
          {{activeButtons[t.name]}}
        </div> -->

        <div class="button-name" v-if="activeButtons[t.name] || activePage == t.name">
          {{t.displayName}}
        </div>

        <!-- <div class="button-name">
          {{t.displayName}}
        </div> -->
      </div>
    </div>

    <!-- page -->
    <div id="tool-page" class="tool-page">
      <!-- 悬浮按钮 -->
      <div
        v-show="commonTools[activePage] === false"
        id="float"
        @click="changeCommonTool(activePage)"
        title="置于右侧常用工具栏"
      >
        <i class="icon el-icon-arrow-right"></i>
      </div>
      <!--never close catalog-->
      <!-- <catalog
        v-show="activePage === 'Catalog'"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></catalog>
      <outline
        v-if="activePage === 'Outline' && !commonTools.Outline"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></outline>
      <search
        v-if="activePage === 'Search' && !commonTools.Search"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></search>
      <note-map
        v-if="activePage === 'Note Map' && !commonTools['Note Map']"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></note-map>
      <structure
        v-if="activePage === 'Structure' && !commonTools['Structure']"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></structure>
      <todo
        v-if="activePage === 'Todo' && !commonTools.Todo"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></todo>
      <mind-map
        v-if="activePage === 'Mind Map' && !commonTools['Mind Map']"
        :timestamp="changeToolTimestamp "
        :class="{tool: true}"
      ></mind-map>
      <statistics
        v-if="activePage === 'Statistics' && !commonTools.Statistics"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></statistics>
      <batch
        v-if="activePage === 'Batch' && !commonTools.Batch"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></batch>
      <paint
        v-if="activeButtons.Paint  && !commonTools.Paint"
        :timestamp="changeToolTimestamp"
        @close="activeButtons.Paint = false"
        :class="{tool: true}"
      ></paint>
      <gallery
        v-if="activePage === 'Gallery' && !commonTools.Gallery"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></gallery>
      <tags
        v-if="activePage === 'Tags' && !commonTools.Tags"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></tags>
       <web
        v-if="activePage === 'Web' && !commonTools.Web"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></web> -->

      <catalog
        v-show="activePage === 'Catalog'"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></catalog>
      <outline
        v-if="activePage === 'Outline'"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></outline>
      <search
        v-if="activePage === 'Search'"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></search>
      <note-map
        v-if="activePage === 'Note Map'"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></note-map>
      <structure
        v-if="activePage === 'Structure'"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></structure>
      <paper
        v-if="activePage === 'Paper'"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></paper>
      <todo
        v-if="activePage === 'Todo'"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></todo>
      <mind-map
        v-if="activePage === 'Mind Map'"
        :timestamp="changeToolTimestamp "
        :class="{tool: true}"
      ></mind-map>
      <statistics
        v-if="activePage === 'Statistics'"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></statistics>
      <batch
        v-if="activePage === 'Batch'"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></batch>
      <paint
        v-if="activeButtons.Paint"
        :timestamp="changeToolTimestamp"
        @close="activeButtons.Paint = false"
        :class="{tool: true}"
      ></paint>
      <gallery
        v-if="activePage === 'Gallery'"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></gallery>
      <tags
        v-if="activePage === 'Tags'"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></tags>
      <web
        v-if="activePage === 'Web'"
        :timestamp="changeToolTimestamp"
        :class="{tool: true}"
      ></web>
    </div>

    <!-- other components -->
    <sticky-note v-if="activeButtons['Sticky Note']"></sticky-note>
    <fluorescent-pen v-if="activeButtons['Fluorescent Pen']"></fluorescent-pen>
    <search-note-bar v-if="activeButtons['Search Note Bar']" @close="activeButtons['Search Note Bar'] = false"></search-note-bar>
  </div>
</template>
<script>
import _ from 'lodash';
import Catalog from '@/components/catalog/catalog.vue';
import Search from '@/components/search/search.vue';
import Outline from '@/components/outline/outline.vue';
import NoteMap from '@/components/note-map/note-map.vue';
import Todo from '@/components/todo/todo.vue';
import StickyNote from '@/components/sticky-note/sticky-note.vue';
import FluorescentPen from '@/components/fluorescent-pen/fluorescent-pen.vue';
import SearchNoteBar from '@/components/search-note-bar/search-note-bar.vue';
import MindMap from '@/components/mind-map/mind-map.vue';
import Statistics from '@/components/statistics/statistics.vue';
import Readonly from '@/components/readonly/readonly';
import SplitScreen from '@/components/split-screen/split-screen';
import Review from '@/components/review/review';
import Batch from '@/components/batch/batch';
import Structure from '@/components/structure/structure';
import Paint from '@/components/paint/paint';
import Gallery from '@/components/gallery/gallery';
import Tags from '@/components/tags/tags';
import Web from '@/components/web/web';
import Paper from '@/components/paper/paper';

// eslint-disable-next-line no-unused-vars
import {
  bookSvg,
  searchSvg,
  stickyNoteSvg,
  // settingSvg,
  // pluginSvg,
  outlineSvg,
  mindMapSvg,
  noteMapSvg,
  todoSvg,
  statisticsSvg,
  nightModeSvg,
  fluorescentPenSvg,
  batchSvg,
  structureSvg,
  paintSvg,
  gallerySvg,
  tagsSvg,
  webSvg,
  paperSvg
} from './svg';

const isEnableConsole = false;
const name = 'side-bar';
const { clientWidth } = document.body;


export default {
  name,
  components: {
    Catalog,
    Search,
    Outline,
    Todo,
    MindMap,
    NoteMap,
    Structure,
    StickyNote,
    SearchNoteBar,
    Statistics,
    FluorescentPen,
    Batch,
    Paint,
    Gallery,
    Tags,
    Web,
    Paper
  },
  data() {
    return {
      name,
      editor: null,
      activePage: 'Catalog', // current active page
      activeButtons: {}, // current active buttons
      isSideBarSmallMode: clientWidth < this.$store.state.smallScreenMaxWith, // whether to display side bar in small mode
      isShowStickyNote: false,
      isUsingFluorescentPen: false,
      isShortcutKeyBinded: false,
      isShowSearchNoteBar: false,
      toggleToolPageShortcut: ['Ctrl', 'Shift', 'B'],
      sideBarWidth: '380px',
      defaultSideBarWidth: '380px',
      changeToolTimestamp: Date.now(), // 切换工具的时间戳

      // tool name must be unique
      tools: [
        {
          name: 'Catalog',
          displayName: '目录',
          icon: bookSvg,
          type: 'page',
          keyMap: ['Ctrl', 'Shift', 'E'],
        },
        {
          name: 'Read Only',
          displayName: '只读',
          icon: Readonly.icon,
          type: 'button',
          onclick: Readonly.handler,
        },
        {
          name: 'Search',
          displayName: '搜索',
          icon: searchSvg,
          type: 'page',
          keyMap: ['Ctrl', 'F'],
        },
        {
          name: 'Outline',
          displayName: '大纲',
          icon: outlineSvg,
          type: 'page',
          keyMap: ['Ctrl', 'Shift', 'O'],
        },
        {
          name: 'Split Screen',
          displayName: '分屏',
          icon: SplitScreen.icon,
          type: 'button',
          isCannotActive: true,
          onclick: SplitScreen.handler
        },
        {
          name: 'Sticky Note',
          displayName: '便签',
          icon: stickyNoteSvg,
          type: 'button',
          keyMap: ['Ctrl', 'Shift', 'Y'],
          onclick: (editor, lastStatus) => (!lastStatus ? '便签' : false),
        },
        {
          name: 'Search Note Bar',
          icon: null,
          type: 'button',
          keyMap: ['Ctrl', 'P'],
          onEsc: () => {
            this.isShowSearchNoteBar = false;
          },
        },
        // {
        //   name: 'Note Map',
        //   icon: noteMapSvg,
        //   type: 'page',
        //   sideBarWidth: '38%',
        // },
        {
          name: 'Structure',
          displayName: '结构',
          icon: structureSvg,
          type: 'page',
        }, {
          name: 'Paper',
          displayName: '论文',
          icon: paperSvg,
          type: 'page',
        },
        {
          name: 'Todo',
          displayName: '待办',
          icon: todoSvg,
          type: 'page',
        },
        // {
        //   name: 'Review',
        //   icon: Review.icon,
        //   type: 'button',
        //   onclick: Review.handler,
        //   keyMap: ['Ctrl', 'Shift', 'R'],
        // },
        {
          name: 'Mind Map',
          displayName: '导图',
          icon: mindMapSvg,
          type: 'page',
          sideBarWidth: '35%',
          keyMap: ['Ctrl', 'Shift', 'M'],
        },
        {
          name: 'Statistics',
          displayName: '统计',
          icon: statisticsSvg,
          type: 'page',
        },
        {
          name: 'Batch',
          displayName: '批量修改',
          icon: batchSvg,
          type: 'page',
        },
        {
          name: 'Night Mode',
          displayName: '夜间模式',
          icon: nightModeSvg,
          onclick: (editor, lastStatus) => {
            this.$store.commit('updateIsNightModeOn', !lastStatus);
            return !lastStatus ? '夜间模式' : false;
          },
          type: 'button',
        },
        {
          name: 'Tags',
          displayName: '标签',
          icon: tagsSvg,
          type: 'page',
        },
        {
          name: 'Web',
          displayName: '网页',
          icon: webSvg,
          type: 'page',
          sideBarWidth: '38%',
        },
        {
          name: 'Gallery',
          displayName: '画廊',
          icon: gallerySvg,
          type: 'page',
          sideBarWidth: '50%',
        },
        {
          name: 'Fluorescent Pen',
          displayName: '荧光笔',
          icon: fluorescentPenSvg,
          type: 'button',
          onclick: (editor, lastStatus) => (!lastStatus ? '荧光笔*' : false),
        },
        {
          name: 'Paint',
          displayName: '绘图',
          icon: paintSvg,
          type: 'button',
          // onclick: () => {
          //   if (!this.activeButtons.Paint) { // 展开侧边栏, 防止paint界面无法显示
          //     // this.isSideBarSmallMode = false;
          //   }
          // },
          onclick: (editor, lastStatus) => (!lastStatus ? '画板' : false),
          keyMap: ['Ctrl', 'Shift', 'P'],
        },

        // {
        //   name: 'Game',
        //   icon: gameSvg,
        //   type: 'page',
        // },
        // {
        //   name: 'plugin', icon: pluginSvg, type: 'button', onclick: () => {}, lastStatus: false,
        // },

        // {
        //   name: 'setting',
        //   icon: settingSvg,
        //   type: 'button',
        //   onclick: () => {},
        //   lastStatus: false,
        //   isBottom: true, // There can only be one "isBottom"
        // },
      ],
    };
  },

  watch: {
    '$store.state.editor': {
      immediate: true,
      handler(value) {
        if (value) {
          this.editor = value;
          if (isEnableConsole) {
            console.log('get editor');
          }

          // 小屏幕自动只读
          if (clientWidth < this.$store.state.smallScreenMaxWith) {
            this.changeTool(this.tools.filter(tool => tool.name === 'Read Only')[0]);
          }

          if (!this.isShortcutKeyBinded) {
            this.bindShortcuKey();
            this.isShortcutKeyBinded = true;
            if (isEnableConsole) {
              console.log('bind shortcut key');
            }
          }
        }
      },
    },
  },

  computed: {
    commonTools() {
      return _.cloneDeep(this.$store.state.commonTools);
    }
  },

  methods: {
    changeTool(tool, isOpenSideBar) {
      this.changeToolTimestamp = Date.now();
      if (isEnableConsole) {
        console.log('change tool: ', tool);
      }
      // "page" tool will open a page, like Catalog tool
      if (tool.type === 'page') {
        if (isOpenSideBar || tool.name !== this.activePage) {
          this.isSideBarSmallMode = false;
        } else if (tool.name === this.activePage) {
          this.isSideBarSmallMode = !this.isSideBarSmallMode;
        }
        this.activePage = tool.name;
        this.sideBarWidth = tool.sideBarWidth || this.defaultSideBarWidth;
        // "button" tool is a button, which will trigger something
      } else if (tool.type === 'button') {
        if (tool.onclick) { // 如果有onclick, 开关状态由onclick控制
          const newButtonStatus = tool.onclick(
            this.$store.state.editor,
            this.activeButtons[tool.name],
            this
          );
          this.$set(this.activeButtons, tool.name, newButtonStatus);
        } else if (!this.activeButtons[tool.name]) { // 如果不存在onclick, 开发状态默认有true, false两种
          this.$set(this.activeButtons, tool.name, true); // 触发vue监听
        } else {
          this.$set(this.activeButtons, tool.name, false);
        }


        // if (tool.isCannotActive) { // 始终无法激活的按钮
        //   this.$set(this.activeButtons, tool.name, false);
        // } else if (!this.activeButtons[tool.name]) { // 可以激活的按钮
        //   this.$set(this.activeButtons, tool.name, true); // 触发vue监听
        // } else {
        //   this.$set(this.activeButtons, tool.name, false);
        // }
      }
    },

    bindShortcuKey() {
      // toggle side page
      this.editor.bindShortcutKeyMap(
        document,
        this.toggleToolPageShortcut,
        () => {
          this.isSideBarSmallMode = !this.isSideBarSmallMode;
        }
      );

      // bind shortcut key for tools
      for (const tool of this.tools) {
        // esc
        if (tool.onEsc) {
          document.addEventListener('keydown', (e) => {
            if (e.keyCode === 27) {
              tool.onEsc();
            }
          });
        }
        // change tool
        if (!tool.keyMap) {
          continue;
        } else {
          this.editor.bindShortcutKeyMap(document, tool.keyMap, () => {
            this.changeTool(tool, true);
          });
        }
      }
    },

    resize() {
      // console.log(1);
    },

    // 改变悬浮窗口
    changeCommonTool(toolName) {
      if (this.commonTools[toolName] === undefined) {
        this.editor.messager.warning('当前工具不支持置于常用工具区');
      } else if (this.commonTools[toolName] === false) {
        if (Object.values(this.commonTools).filter(item => item).length >= 3) {
          this.editor.messager.warning('最多支持放置 3 个常用工具');
        } else {
          this.commonTools[toolName] = true;
        }
      } else if (this.commonTools[toolName] === true) {
        this.commonTools[toolName] = false;
      }

      this.$store.commit('updateCommonTools', _.cloneDeep(this.commonTools));
    }
  },

  mounted() {
    this.inkCommon.addPluginObject(this.name, {
      changeTool: (toolName) => {
        const toolObj = this.tools.find(item => item.name === toolName);
        if (toolObj) this.changeTool(toolObj);
      }
    });

    // setTimeout(() => {
    //   this.editor.changeImgWidgetsVisibility(false);
    // }, 3000);
  },

  beforeDestroy() {
    this.inkCommon.removePluginObject(this.name);
  }

};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
// side bar
#side-bar {
  display: flex;
  resize: horizontal;
  position: relative;
  transition: width 0.2s;
  &.side-bar-small-mode {
    resize: none;
    width: $icon-bar-width!important;
    #tool-page {
      width: 0px;
    }
    #float {
      display: none;
    }
  }
}

// icons
#tool-icons {
  flex-basis: $icon-bar-width;
  flex-shrink: 0;
  flex-grow: 0;
  height: 100%;
  overflow-y: auto;
  background-color: $icon-bar-bg;
  &::-webkit-scrollbar {
    width: 0px;
  }
  /* backdrop-filter: blur(10px); */
  .tool-icon {
    width: $icon-bar-width;
    height: $icon-bar-width;
    margin-bottom: 2px;
    line-height: $icon-bar-width;
    text-align: center;
    cursor: pointer;
    svg {
      width: 54%;
      height: 54%;
      vertical-align: middle;
      fill: $icon-color;
    }
    .button-name {
      font-size: 9px;
      margin-top: -20px;
      height: 14px;
      color:$icon-color-active;
    }
    &:last-child {
      margin-bottom: 100px;
    }
    &.active {
      svg {
        fill: $icon-color-active;
      }
    }
    &:not(.active):hover {
      svg {
        fill: $icon-color-hover;
      }
    }
  }
  .bottom-icon {
    position: absolute;
    bottom: 0px;
  }
}

// pages
#tool-page {
  display: block;
  height: 100%;
  flex-grow: 1;

  /* 悬浮按钮 */
  #float {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    right: 10px;
    bottom: 10px;
    height: 34px;
    width: 34px;
    border-radius: 60px;
    background: $float-bg-alpha-transparent;
    box-shadow: $float-box-shadow;
    z-index: $float-window-index;
    cursor: pointer;
    .icon {
      font-size: 16px;
      color: #999;
      font-weight: bold;
    }
  }
  .tool.float {
    position: fixed;
    right: 10px;
    bottom: 40px;
    width: 200px;
    height: 300px;
    border-radius: 4px;
    z-index: $float-window-index;
    background: $float-bg-alpha;
    backdrop-filter: blur(8px);
    box-shadow: $float-box-shadow;
    overflow: auto;
  }
}

/* 工具页 */
.tool-page {
  overflow: auto;
  background-color: $tool-page-bg;
  color: $tool-page-color;
  font-size: $font-size-sidebar;
}

// other components
// search-note-bar
#search-note-bar {
  position: fixed;
  right: 10px;
  top: 10px;
  width: 300px;
  z-index: $above-float-window-index;
}
</style>
