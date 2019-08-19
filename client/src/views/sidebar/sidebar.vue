<template>
  <div id="side-bar" :class="{'side-bar-small': isSideBarSmall}">
    <!-- 工具列表 -->
    <div id="tool-icons">
      <div
        v-for="t of tools"
        :title="t.name"
        :class="{
          'tool-icon': true,
          'active': t.name === activePage || activeButtons[t.name],
          'bottom-icon': t.isBottom
        }"
        :key="t.name"
        @click="changeTool(t)"
      >
        <svg
          viewBox="0 0 1024 1024"
          version="1.1"
          v-html="t.icon"
          >
        </svg>
      </div>
    </div>

    <!-- page -->
    <div id="tool-pages">
      <catalog v-show="activePage === 'catalog'"></catalog>
    </div>
  </div>
</template>
<script>
import Catalog from '@/components/catalog/catalog.vue';
import readonly from '@/components/readonly/readonly.js';
// import mindMap from '@/components/mind-map/mind-map.js';
import { bookSvg, stickyNoteSvg, settingSvg, pluginSvg } from './svg';

export default {
  name: 'side-bar',
  components: {
    Catalog,
  },
  data() {
    return {
      activePage: 'catalog', // 当前激活的工具
      activeButtons: {}, // 当前激活的按钮
      isSideBarSmall: false, // 是否显示为小工具栏状态
      tools: [
        {
          name: 'catalog', icon: bookSvg, type: 'page',
        }, {
          name: 'readonly', icon: readonly.icon, type: 'button', onclick: readonly.handler, lastStatus: false,
        }, {
          name: 'sticky note', icon: stickyNoteSvg, type: 'button', onclick: this.toggleShowStickyNote, lastStatus: false,
        }, {
          name: 'plugin', icon: pluginSvg, type: 'button', onclick: () => {}, lastStatus: false,
        },
        // {
        // name: 'mind map', icon: mindMap.icon, type: 'button', onclick: mindMap.handler, lastStatus: false,
        // },
        {
          name: 'setting', icon: settingSvg, type: 'button', onclick: () => {}, lastStatus: false, isBottom: true, // There can only be one "isBottom"
        },
      ],
    };
  },
  methods: {
    // change tool
    changeTool(tool) {
      // "page" tool will open a page, like Catalog tool
      if (tool.type === 'page') {
        if (this.activePage === tool.name) {
          this.isSideBarSmall = !this.isSideBarSmall;
        } else {
          this.isSideBarSmall = false;
          this.activePage = tool.name;
        }
      // "button" tool is a button, which will trigger something
      } else if (tool.type === 'button' && tool.onclick) {
        tool.lastStatus = tool.onclick(this.$store.state.editor, tool.lastStatus);
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

    // toggle if show sticky note
    toggleShowStickyNote() {
      const isActive = !this.$store.state.isShowStickyNote;
      this.$store.commit('updateIsShowStickyNote', isActive);
      return isActive;
    },
  },
};
</script>

<style lang="scss" scoped>
@import "@/themes/craft/var.scss";
// side bar
#side-bar {
  display: flex;
  position: relative;
  width: $side-bar-width;
  &.side-bar-small { // 小工具栏
    width: $icon-bar-width;
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
  background-color: $icon-bar-bg;
  .tool-icon {
    width: $icon-bar-width;
    height: $icon-bar-width;
    line-height: $icon-bar-width;
    text-align: center;
    cursor: pointer;
    svg {
      width: 50%;
      height: 50%;
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
  overflow-x: hidden;
  overflow-y: auto;
  background-color: $tool-page-bar-bg;
}

</style>
