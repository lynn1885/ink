<template>
  <div id="common-tools" :class="{
    active: activeCommonTools && activeCommonTools.length,
    'two-columns': activeCommonTools.length === 2,
    'three-columns': activeCommonTools.length === 3
  }">
    <div class="common-tool-container" v-for="toolName of activeCommonTools" :key="toolName">
      <div class="title">
        <div class="empty"></div>
        <div class="tool-name">{{toolName}}</div>
        <i class="el-icon-close" title="关闭当前工具" @click="closeCommonTool(toolName)"></i>
      </div>
      <div class="tool-container">
        <component
          :is="toolName"
          :timestamp="changeToolTimestamp"
          :class="{tool: true}"
        ></component>
      </div>
    </div>
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
import Batch from '@/components/batch/batch';
import Paint from '@/components/paint/paint';
import Gallery from '@/components/gallery/gallery';
import Tags from '@/components/tags/tags';
import Web from '@/components/web/web';
import Structure from '@/components/structure/structure';

export default {
  name: 'common-tools',
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
    FluorescentPen,
    Batch,
    Paint,
    Gallery,
    Tags,
    Web,
    Structure
  },
  data() {
    return {
      changeToolTimestamp: Date.now(),
      activeCommonTools: [],
    };
  },
  computed: {
    commonTools() {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      return _.cloneDeep(this.$store.state.commonTools);
    }
  },
  watch: {
    commonTools: {
      immediate: true,
      deep: true,
      handler(value) {
        this.changeToolTimestamp = Date.now();
        this.activeCommonTools = Object.keys(value).filter(item => value[item]);
      }
    }
  },
  methods: {
    closeCommonTool(toolName) {
      this.commonTools[toolName] = false;
      this.$store.commit('updateCommonTools', _.cloneDeep(this.commonTools));
    }
  }
};
</script>

<style lang="scss">
@import '@/themes/craft/var.scss';
/* 常用工具 */
#common-tools {
  width: 0px;
  display: flex;
  // flex-direction: column;
  bottom: $status-bar-height;
  overflow: hidden;
  box-sizing: border-box;
  background-color: $tool-page-bg;
  color: $tool-page-color;
  font-size: $font-size-sidebar;
  transition: all 0.2s;
  &.active {
     width: $right-sidebar-width;
     transition: all 0.2s;
  }
  &.two-columns {
    width: $right-sidebar-width * 1.8;
  }
  &.three-columns {
    width: $right-sidebar-width * 2.4;
  }
  /* 每个工具的容器 */
  .common-tool-container {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    flex-shrink: 0;
    flex-basis: 33%;
    box-sizing: border-box;
    border-right: $cutting-border;
    overflow: hidden;
    resize: horizontal;
    transition: all 0.2s;
    .title {
      padding: 4px;
      display: flex;
      flex-shrink: 0;
      flex-grow: 0;
      align-items: center;
      justify-content: space-between;
      color: $tool-page-color;
      flex-basis: 20px;
      font-weight: bold;
      .tool-name {
        background: $sidebar-item-active-bg;
        padding: 2px 6px;
        border-radius: 2px;
      }
      i {
        background: $tool-page-bg;
        margin-right: 4px;
        font-size: 16px;
        border-radius: 10px;
        cursor: pointer;
        font-size: bold;
        &:hover {
          color: $active-color;
        }
      }
    }
    .tool-container {
      flex-grow: 1;
      overflow: auto;
    }
  }
}
</style>

