/* eslint-disable import/no-unresolved */
<template>
  <div id="catalog" v-if="isCatalogLoaded">

    <!-- 一二三级目录 -->
    <div class="catalog-container" id="catalog-level-1">
      <ul v-for="cat of catsLv1" :key="cat" v-show="catsLv1.length">
        <li @click="changeCurCat(1, cat)" :class="{'cat-active': curCatLv1 === cat}">
          <img
            :src="`icons/${cat}.png`"
            v-if="isShowCatIcon"
            onerror="this.style.visibility='hidden'"
            class="catalog-icon"
          >
          {{cat}}
        </li>
      </ul>
    </div>

    <div class="catalog-container" id="catalog-level-2" v-show="catsLv2.length">
      <ul v-for="cat of catsLv2" :key="cat">
        <li @click="changeCurCat(2, cat)" :class="{'cat-active': curCatLv2 === cat}">
          <img
            :src="`icons/${cat}.png`"
            v-if="isShowCatIcon"
            onerror="this.style.visibility='hidden'"
            class="catalog-icon"
          >
          {{cat}}
        </li>
      </ul>
    </div>

    <div class="catalog-container" id="catalog-level-3" v-show="catsLv3.length">
      <ul v-for="cat of catsLv3" :key="cat">
        <li @click="changeCurCat(3, cat)" :class="{'cat-active': curCatLv3 === cat}">
          <img
            :src="`icons/${cat}.png`"
            v-if="isShowCatIcon"
            onerror="this.style.visibility='hidden'"
            class="catalog-icon"
          >
          {{cat}}
        </li>
      </ul>
    </div>

    <!-- 模态框 -->
    <div id="catalog-modal" v-show="$store.state.isEditorLoading"></div>

    <!-- 目录跳转 -->
    <div id="catalog-jump" v-show="isShowCatalogJump">
      <input
        class="catalog-jump-input"
        type="text"
        v-model="catalogJumpSearchStr"
        ref="catalog-jump-input"
      >
      <ul
        class="catalog-jump-result"
        v-for="curRes of catalogJumpSearchRes"
        :key="curRes.toString()"
      >
        <li
          @click="jumpCatalog(curRes)"
          :class="{'selected-search-res':
          curRes === catalogJumpSearchRes[0 + curSelectedSearchResBias]}"
        >
          {{curRes}}
        </li>
      </ul>
    </div>

    <!-- 音效 -->
    <audio style="display:none" ref="audio-player"></audio>
  </div>
</template>
<script>
import config from '@/config';
import _ from 'lodash';

const catalogOrder = config.catalog.order;

export default {
  name: 'catalog',
  data() {
    return {
      levels: 3, // catalog hierarchies, don't modify it
      curCatLv1: '', // 当前路径
      curCatLv2: '',
      curCatLv3: '',
      defaultCatLv1: config.catalog.defaultOpen.lv1, // 默认路径
      defaultCatLv2: config.catalog.defaultOpen.lv2,
      defaultCatLv3: config.catalog.defaultOpen.lv3,
      catalog: [], // 总目录
      catsLv1: [], // 各级目录
      catsLv2: [],
      catsLv3: [],
      curSelectedSearchResBias: 0, // 当前选中的目录搜索结果的偏移值, 默认选中第一个搜索结果
      catalogJumpSearchStr: '', // 目录跳转搜索字符串
      catalogJumpSearchRes: [], // 目录跳转搜索结果
      isShowCatIcon: true, // 是否显示目录图标
      isCatalogLoaded: false, // 目录是否加载完毕
      isShowCatalogJump: false, // 是否显示目录跳转
      isPlayClickAudio: false, // 是否播放点击音效
      clickSoundSrc: './sounds/click.wav', // 点击音效
    };
  },

  watch: {
    // 监听编辑器加载
    '$store.state.editor': {
      immediate: true,
      async handler(editor) {
        if (editor) {
          await this.getCatalog(editor);
        }
      },
    },

    // 总目录变更, 更新一级目录
    catalog() {
      this.updateCatalog(1);
    },

    // 一级路径变更, 更新二级目录
    curCatLv1() {
      this.updateCatalog(2);
    },

    // 二级路径变更, 更新三级目录
    curCatLv2() {
      this.updateCatalog(3);
    },

    // 三级路径变更时, 更新页面
    curCatLv3(value) {
      if (value) {
        this.updateFilePath();
      }
    },

    // 目录跳转: 及时搜索
    catalogJumpSearchStr() {
      this.updateCatalogJumpSearchRes(this.catalogJumpSearchStr);
    },

    // 目录跳转: 关闭时, 做一些清理工作
    isShowCatalogJump(value) {
      if (value === false) {
        this.catalogJumpSearchStr = '';
        this.catalogJumpSearchRes = [];
      }
    },
  },

  methods: {
    // 获取目录, 更新一二三级默认路径
    async getCatalog(editor) {
      this.catalog = await editor.fileServer.getCatalog();
      this.catalog = _.merge(catalogOrder, this.catalog);
      if (this.defaultCatLv1) {
        this.curCatLv1 = this.defaultCatLv1;
      }
      if (this.defaultCatLv2) {
        this.curCatLv2 = this.defaultCatLv2;
      }
      if (this.defaultCatLv3) {
        this.curCatLv3 = this.defaultCatLv3;
      }
      if (!this.curCatLv1 && typeof this.catalog === 'object') {
        [this.curCatLv1] = Object.keys(this.catalog);
        if (!this.curCatLv2 && typeof this.catalog[this.curCatLv1] === 'object') {
          [this.curCatLv2] = Object.keys(this.catalog[this.curCatLv1]);
          if (!this.curCatLv3 && typeof this.catalog[this.curCatLv1][this.curCatLv2] === 'object') {
            [this.curCatLv3] = Object.keys(this.catalog[this.curCatLv1][this.curCatLv2]);
          }
        }
      }
      this.isCatalogLoaded = true;
    },

    // 更新目录
    updateCatalog(lv) {
      if (lv === 1) {
        this.curCatLv1 = '';
        this.curCatLv2 = '';
        this.curCatLv3 = '';
        this.catsLv1 = this.catalog ? Object.keys(this.catalog) : [];
        if (this.defaultCatLv1) {
          this.curCatLv1 = this.defaultCatLv1;
          this.defaultCatLv1 = false;
        }
      }
      if (lv === 2) {
        this.curCatLv2 = '';
        this.curCatLv3 = '';
        this.catsLv2 = this.curCatLv1 && typeof this.catalog[this.curCatLv1] === 'object'
          ? Object.keys(this.catalog[this.curCatLv1])
          : [];
        if (this.defaultCatLv2) {
          this.curCatLv2 = this.defaultCatLv2;
          this.defaultCatLv2 = false;
        }
      }
      if (lv === 3) {
        this.curCatLv3 = null;
        this.catsLv3 = this.curCatLv2 &&
          typeof this.catalog[this.curCatLv1][this.curCatLv2] === 'object'
          ? Object.keys(this.catalog[this.curCatLv1][this.curCatLv2])
          : [];
        if (this.defaultCatLv3) {
          this.curCatLv3 = this.defaultCatLv3;
          this.defaultCatLv3 = false;
        }
      }
    },

    // 更新路径
    updateFilePath() {
      const filePath = `${this.curCatLv1}/${this.curCatLv2}/${this.curCatLv3}/${this.curCatLv3}.md`;
      this.$store.commit('updateFilePath', filePath);
    },

    // 更改当前目录
    changeCurCat(lv, value) {
      if (lv === 1) {
        this.curCatLv1 = value;
      } else if (lv === 2) {
        this.curCatLv2 = value;
      } else if (lv === 3) {
        this.curCatLv3 = value;
      }

      if (this.isPlayClickAudio) {
        this.playAudio(this.clickSoundSrc);
      }
    },

    // 播放声音
    playAudio(src) {
      if (!src) return;
      this.$refs['audio-player'].setAttribute('src', src);
      this.$refs['audio-player'].play();
    },

    // 绑定热键
    bindHotKey() {
      document.addEventListener('keydown', (e) => {
        // ctrl + /: 显隐目录跳转
        if (e.ctrlKey && e.keyCode === 191) {
          this.isShowCatalogJump = !this.isShowCatalogJump;
          if (this.isShowCatalogJump) {
            this.curSelectedSearchResBias = 0;
            setTimeout(() => {
              this.$refs['catalog-jump-input'].focus();
            }, 300);
          }
        }

        // 上下切换目录搜索结果
        if (this.isShowCatalogJump
          && e.keyCode === 40
          && this.curSelectedSearchResBias < this.catalogJumpSearchRes.length - 1
        ) {
          this.curSelectedSearchResBias += 1;
        }
        if (this.isShowCatalogJump
          && e.keyCode === 38
          && this.curSelectedSearchResBias > 0
        ) {
          this.curSelectedSearchResBias -= 1;
        }

        // enter键跳转至当前选中的目录
        if (this.isShowCatalogJump && e.keyCode === 13) {
          this.jumpCatalog(this.catalogJumpSearchRes[0 + this.curSelectedSearchResBias]);
        }
      });
    },

    // 目录跳转: 搜索目录
    updateCatalogJumpSearchRes(searchStr) {
      this.catalogJumpSearchRes = [];
      const res = [];
      if (searchStr) {
        for (const cat1 in this.catalog) {
          for (const cat2 in this.catalog[cat1]) {
            for (const cat3 in this.catalog[cat1][cat2]) {
              if (cat1.toLowerCase().includes(searchStr.toLowerCase())) {
                const r = cat1;
                res.push(r);
              }
              if (cat2.toLowerCase().includes(searchStr.toLowerCase())) {
                const r = `${cat1} > ${cat2}`;
                res.push(r);
              }
              if (cat3.toLowerCase().includes(searchStr.toLowerCase())) {
                const r = `${cat1} > ${cat2} > ${cat3}`;
                res.push(r);
              }
            }
          }
        }
      }
      this.catalogJumpSearchRes = Array.from(new Set(res));
    },

    // 目录跳转: 跳转
    jumpCatalog(catStr) {
      if (typeof catStr !== 'string') {
        return;
      }
      const aimCats = catStr.split(' > ');
      if (aimCats[0]) {
        [this.curCatLv1] = aimCats;
      }
      setTimeout(() => {
        if (aimCats[1]) {
          [, this.curCatLv2] = aimCats;
        }
        setTimeout(() => {
          if (aimCats[2]) {
            [, , this.curCatLv3] = aimCats;
          }
        }, 0);
      }, 0);
      this.isShowCatalogJump = false;
    },
  },

  mounted() {
    this.bindHotKey();
  },
};
</script>

<style lang="scss" scoped>
@import "@/themes/craft/var.scss";
/* scrollbar */
.catalog-container::-webkit-scrollbar {
  width: 0px!important;
}

// 容器
#catalog {
  display: flex;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  height: 100%;
  font-size: $font-size-catalog;
  color: rgb(102, 84, 72);
}

// 目录
.catalog-container {
  flex-shrink: 0;
  flex-grow: 0;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  border-right: $catalog-col-border;
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    height: $font-size-main;
    line-height: $font-size-main;
    padding: 6px 0px 6px 4px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    cursor: default;
  }
  li:hover {
    background: $catalog-hover;
  }
  li.cat-active {
    background: $catalog-active-bg;
    color: $catalog-active-color;
  }
  .catalog-icon {
    position: relative;
    height: 100%;
    vertical-align: middle;
  }
}
#catalog-level-1 {
  flex-basis: 26%;
}
#catalog-level-2 {
  flex-basis: 28%;
}
#catalog-level-3 {
  flex-basis: 46%;
}

// 目录模态框
#catalog-modal {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: $catalog-modal-bg;
  cursor: wait;
}

// 目录跳转
#catalog-jump {
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  background: $catalog-jump-bg;
  .catalog-jump-input {
    width: 100%;
    height: 30px;
    background: $catalog-jump-input-bg;
    border: none;
    box-sizing: border-box;
    text-align: center;
    font-weight: bold;
    color: $catalog-jump-input-color;
    outline: none;
  }
  .catalog-jump-result {
    list-style: none;
    padding: 0;
    margin: 0;
    li {
      padding: 5px 8px;
      box-sizing: border-box;
      border-bottom: $catalog-jump-li-border;
      &:hover {
       background: $catalog-active-bg;
       color: $catalog-active-color;
       cursor: default;
      }
    }
  }
  .selected-search-res {
    background: $catalog-active-bg;
    color: $catalog-active-color;
  }
}

</style>
