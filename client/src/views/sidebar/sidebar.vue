<template>
  <div
    id="side-bar"
    :class="{'side-bar-small-mode': isSideBarSmallMode}"
    @resize.native="resize(1)"
    :style="{
      width: sideBarWidth
    }"
    >
    <!-- tool icons -->
    <div id="tool-icons">
      <div
        v-for="t of tools"
        v-show="t.icon"
        :title="t.name + (t.keyMap ? ` (${t.keyMap.join('+')})` : '')"
        :class="{
          'tool-icon': true,
          'active': t.name === activePage || activeButtons[t.name],
          'bottom-icon': t.isBottom
        }"
        :key="t.name"
        @click="changeTool(t)"
      >
        <svg viewBox="0 0 1024 1024" version="1.1" v-html="t.icon" />
      </div>
    </div>

    <!-- page -->
    <div id="tool-pages">
      <!--never close catalog-->
      <catalog v-show="activePage === 'Catalog'"></catalog>

      <search v-if="activePage === 'Search'"></search>
      <outline v-if="activePage === 'Outline'"></outline>
      <note-map v-if="activePage === 'Note Map'"></note-map>
      <todo v-if="activePage === 'Todo'"></todo>
      <mind-map v-if="activePage === 'Mind Map'"></mind-map>
      <statistics v-if="activePage === 'Statistics'"></statistics>
    </div>

    <!-- other components -->
    <sticky-note v-if="isShowStickyNote"></sticky-note>
    <fluorescent-pen v-if="isUsingFluorescentPen"></fluorescent-pen>
    <search-note-bar v-if="isShowSearchNoteBar" @close="isShowSearchNoteBar = false"></search-note-bar>
  </div>
</template>
<script>
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
import readonly from '@/components/readonly/readonly';
import review from '@/components/review/review';
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
  fluorescentPen
} from './svg';

const isEnableConsole = false;

export default {
  name: 'side-bar',
  components: {
    Catalog,
    Search,
    Outline,
    Todo,
    MindMap,
    NoteMap,
    StickyNote,
    SearchNoteBar,
    Statistics,
    FluorescentPen
  },
  data() {
    return {
      editor: null,
      activePage: 'Catalog', // current active page
      activeButtons: {}, // current active buttons
      isSideBarSmallMode: false, // whether to display side bar in small mode
      isShowStickyNote: false,
      isUsingFluorescentPen: false,
      isShortcutKeyBinded: false,
      isShowSearchNoteBar: false,
      toggleToolPageShortcut: ['Ctrl', 'Shift', 'B'],
      sideBarWidth: '380px',
      defaultSideBarWidth: '380px',
      // tool name must be unique
      tools: [
        {
          name: 'Catalog',
          icon: bookSvg,
          type: 'page',
          keyMap: ['Ctrl', 'Shift', 'E'],
        },
        {
          name: 'Read Only',
          icon: readonly.icon,
          type: 'button',
          onclick: readonly.handler,
          lastStatus: false,
        },
        {
          name: 'Search',
          icon: searchSvg,
          type: 'page',
          keyMap: ['Ctrl', 'F'],
        },
        {
          name: 'Sticky Note',
          icon: stickyNoteSvg,
          type: 'button',
          onclick: () => {
            this.isShowStickyNote = !this.isShowStickyNote;
            return this.isShowStickyNote;
          },
          keyMap: ['Ctrl', 'Shift', 'Y'],
          lastStatus: false,
        },
        {
          name: 'Search Note Bar',
          icon: null,
          type: 'button',
          onclick: () => {
            this.isShowSearchNoteBar = !this.isShowSearchNoteBar;
            return this.isShowSearchNoteBar;
          },
          keyMap: ['Ctrl', 'P'],
          onEsc: () => {
            this.isShowSearchNoteBar = false;
          },
          lastStatus: false,
        },
        {
          name: 'Outline',
          icon: outlineSvg,
          type: 'page',
          keyMap: ['Ctrl', 'Shift', 'O'],
        },
        {
          name: 'Note Map',
          icon: noteMapSvg,
          type: 'page',
          sideBarWidth: '50%',
        },
        {
          name: 'Todo',
          icon: todoSvg,
          type: 'page',
        },
        {
          name: 'Review',
          icon: review.icon,
          type: 'button',
          onclick: review.handler,
          lastStatus: false,
          keyMap: ['Ctrl', 'Shift', 'R'],
        },
        {
          name: 'Mind Map',
          icon: mindMapSvg,
          // type: 'button',
          // onclick: mindMap.handler,
          // lastStatus: false,
          type: 'page',
          sideBarWidth: '50%',
          keyMap: ['Ctrl', 'Shift', 'M'],
        },
        {
          name: 'Statistics',
          icon: statisticsSvg,
          type: 'page',
        },
        {
          name: 'Night Mode',
          icon: nightModeSvg,
          type: 'button',
          onclick: (editor, lastStatus) => {
            let flag = false;
            if (lastStatus === false) {
              flag = true;
            }
            this.$store.commit('updateIsNightModeOn', flag);
            return flag;
          },
          lastStatus: false,
        },
        {
          name: 'Fluorescent Pen',
          icon: fluorescentPen,
          type: 'button',
          onclick: () => {
            this.isUsingFluorescentPen = !this.isUsingFluorescentPen;
            return this.isUsingFluorescentPen;
          },
          keyMap: ['Ctrl', 'Shift', 'X'],
          lastStatus: false,
        },
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

  methods: {
    changeTool(tool, isOpenSideBar) {
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
      } else if (tool.type === 'button' && tool.onclick) {
        tool.lastStatus = tool.onclick(
          this.$store.state.editor,
          tool.lastStatus,
          this
        );
        if (!this.activeButtons[tool.name]) {
          this.$set(this.activeButtons, tool.name, true); // 触发vue监听
        }
        if (tool.lastStatus) {
          this.activeButtons[tool.name] = true;
        } else {
          this.activeButtons[tool.name] = false;
        }
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
          this.editor.bindShortcutKeyMap(document, tool.keyMap, () =>
            this.changeTool(tool, true));
        }
      }
    },

    resize() {
      console.log(1);
    }
  },

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
    width: $icon-bar-width!important;
    #tool-pages {
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
#tool-pages {
  display: block;
  height: 100%;
  flex-grow: 1;
  overflow: auto;
  background-color: $tool-page-bg;
  /* backdrop-filter: blur(10px); */
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
