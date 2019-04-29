<template>
  <div id="side-bar" :class="{'side-bar-small': isSideBarSmall}">
    <!-- 工具列表 -->
    <div id="tools">
      <div
        v-for="t of tools"
        :class="{'tool': true, 'active': t.name === activePage || activeButtons[t.name]}"
        :key="t.name"
        @click="changeTool(t)"
      >
        <font-awesome-icon :icon="t.icon" />
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

export default {
  name: 'side-bar',
  components:  {
    Catalog,
  },
  data() {
    return {
      activePage: 'catalog',      // 当前激活的工具
      activeButtons: {},  // 当前激活的按钮
      isSideBarSmall: false,   // 是否显示为小工具栏状态
      tools: [
        { name: 'catalog', icon: 'torah', url: '/catalog', type: 'page' },
        { name: 'readonly', icon: 'moon', url: '/readonly', type: 'button', onclick: readonly }
      ],
    };
  },
  methods: {
    changeTool(tool) {
      if (tool.type === 'page') {
        if (this.activePage === tool.name) {
        this.isSideBarSmall = !this.isSideBarSmall;
        } else {
          this.isSideBarSmall = false;
          this.activePage = tool.name;
        }
      } else if (tool.type === 'button') {
        const { isActive } = tool.onclick(this.$store.state.editor);
        if (!this.activeButtons[tool.name]) {
          this.$set(this.activeButtons, tool.name, true); // 触发vue监听
        }
        if (isActive) {
          this.activeButtons[tool.name] = true;
        } else {
          this.activeButtons[tool.name] = false;
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
$tools-width: 50px;

#side-bar {
  display: flex;
  width: 380px;
  background: rgb(248, 247, 246);
  &.side-bar-small { // 小工具栏
    width: $tools-width;
    #tool-pages {
      display: none;
    }
  }
}

#tools {
  flex-basis: $tools-width;
  flex-shrink: 0;
  flex-grow: 0;
  height: 100%;
  background: rgb(236, 234, 232);
}
#tool-pages {
  display: block;
  height: 100%;
  flex-grow: 1;
  overflow-x: hidden;
  overflow-y: auto;
}
.tool {
  width: 100%;
  height: 50px;
  text-align: center;
  line-height: 50px;
  color: #999;
  transition: all 0.3s;
  cursor: pointer;
  &.active {
    color: #333;
    transition: all 0.3s;
  }
  &:not(.active):hover {
    color: #888;
  }
  svg {
    text-align: center;
    line-height: 60px;
    font-size: 22px;
    vertical-align: middle;
  }
}


</style>
