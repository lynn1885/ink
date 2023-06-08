<template>
  <div id="search-note-bar" ref="search-note-bar">
    <div class="wrapper">
      <input
        class="search-input"
        type="text"
        v-model="searchText"
        ref="search-input"
        onfocus="this.select();"
      />
      <div class="placeholder"></div>
      <div
        class="max-search-res-length-warn"
        v-show="maxSearchResLengthWarn"
      >{{maxSearchResLengthWarn}}</div>
      <ul class="search-res">
        <li
          v-for="res of searchRes"
          :key="res.toString()"
          @click="gotoNote(res)"
          :class="{'selected-search-res': res === searchRes[0 + curSelectedSearchResBias]}"
          :title="res"
          :ref="res === searchRes[0 + curSelectedSearchResBias] ? 'selected-search-res' : ''"
        >
          <note-icon class="note-icon" :icon-name="res.split('/')[2]"></note-icon>
          {{res}}
        </li>
      </ul>
    </div>
  </div>
</template>
<script>
import _ from 'lodash';
import config from '@/config';
import NoteIcon from '@/components/note-icon/note-icon.vue';

const isEnableConsole = false;

export default {
  name: 'search-note-bar',
  components: {
    NoteIcon
  },
  data() {
    return {
      catalogArr: [], // catalog array
      searchText: '', // search text
      searchRes: [], // search results
      searchTimeoutId: null, // search timeout id (for search function throttle)
      searchDealy: 200, // ms (for search function throttle)
      maxSearchResLength: 30,
      maxSearchResLengthWarn: '',
      curSelectedSearchResBias: 0, // current selected search results bias, press ↑, bias += 1, press ↓, bias -= 1
      staticIconsUrl: config.server.staticIconsUrl,
      defaultIconUrl: `${config.server.staticIconsUrl}${config.defaultIconName}`, // 默认图标地址, 没有对应图标时会使用该图标
    };
  },
  watch: {
    searchText(val) {
      this.search(val);
    },
  },
  methods: {
    // open bar
    open() {
      const catalog = _.cloneDeep(this.$store.state.catalog);
      for (const cat1 in catalog) {
        for (const cat2 in catalog[cat1]) {
          for (const cat3 in catalog[cat1][cat2]) {
            this.catalogArr.push(`${cat1}/${cat2}/${cat3}`); // don't call toLowerCase(), we need the original case format for openning corresponding catalog
          }
        }
      }
      if (this.$store.state.curFilePath) {
        this.searchText = this.$store.state.curFilePath
          .split('/')
          .slice(0, 2)
          .join('/');
        this.searchText += '/';
      }
      setTimeout(() => {
        if (this.$refs['search-input']) {
          this.$refs['search-input'].focus();
        }
      }, 100);
    },

    // close bar
    close() {
      this.catalogArr = [];
      this.searchText = '';
      this.searchRes = [];
      this.curSelectedSearchResBias = 0;
      this.maxSearchResLengthWarn = '';
    },

    // search calalog (on press key)
    search(searchText) {
      clearTimeout(this.searchTimeoutId);
      this.searchTimeoutId = setTimeout(() => {
        let resCount = 0;
        this.maxSearchResLengthWarn = '';
        this.searchRes = [];
        const res = [];
        if (!searchText) {
          return;
        } else if (searchText) {
          // search logic
          const searchTextArr = searchText.toLowerCase().split(' ');
          for (const cat of this.catalogArr) {
            let isNeedPush = true;
            for (let i = 0; i < searchTextArr.length; i += 1) {
              if (cat.toLowerCase().includes(searchTextArr[i].trim())) {
                isNeedPush = true;
              } else {
                isNeedPush = false;
                break;
              }
            }
            // push
            if (isNeedPush) {
              resCount += 1;
              res.push(cat);
              if (resCount >= this.maxSearchResLength) {
                this.maxSearchResLengthWarn = `Only the top ${this.maxSearchResLength} results are displayed`;
                break;
              }
            }
          }
        }
        this.searchRes = res;
      }, this.searchDealy);
    },

    // goto selected note
    gotoNote(path) {
      this.close();
      this.$emit('close');
      if (path) {
        this.$store.commit('updateGotoThisCatalog', path.split('/'));
      }
    },

    imgLoadError(e) {
      e.target.src = this.defaultIconUrl;
    },

    // bind hotkey
    bindHotKey(el) {
      el.addEventListener('keydown', (e) => {
        if (e.keyCode === 40 || e.keyCode === 38 || e.keyCode === 13) {
          e.preventDefault();
          // 上下键切换目录搜索结果
          if (
            e.keyCode === 40 &&
            this.curSelectedSearchResBias < this.searchRes.length - 1
          ) {
            this.curSelectedSearchResBias += 1;
          }
          if (e.keyCode === 38 && this.curSelectedSearchResBias > 0) {
            this.curSelectedSearchResBias -= 1;
          }
          // scroll
          if (this.$refs['selected-search-res'][0]) {
            this.$refs['selected-search-res'][0].scrollIntoView({
              block: 'center',
            });
          }
          // try {
          //   this.$refs['selected-search-res'][0].scrollIntoView({
          //     block: 'center',
          //   });
          // } catch (err) {
          //   // nothing
          // }
          // enter键跳转至当前选中的目录
          if (e.keyCode === 13) {
            this.gotoNote(this.searchRes[0 + this.curSelectedSearchResBias]);
          }
        }
      });
    },
  },
  mounted() {
    if (isEnableConsole) {
      console.log('search note bar mounted');
    }
    this.bindHotKey(this.$refs['search-note-bar']);
    this.open();
  },
  destroyed() {
    this.close();
    if (isEnableConsole) {
      console.log('search note bar destroyed');
    }
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#search-note-bar {
  background: $float-bg-alpha ;
  box-shadow: $float-box-shadow;
  font-size: $font-size-sidebar;
  color: $tool-page-color;
  backdrop-filter: blur(8px) saturate(200%);
  .wrapper {
    // necessary. without this, ".search-input" cannot "fixed"
    width: 100%;
    max-height: 400px;
    overflow-x: hidden;
    overflow-y: auto;
    .placeholder {
      // placeholder: Just to hold up the line-hight, becasue "absolute .search-input" will out of standard flow
      width: 100%;
      height: 30px;
    }
  }
}
.max-search-res-length-warn {
  color: $warning-color;
  background: $warning-bg;
  padding: 4px 0px;
  text-align: center;
}
.search-input {
  position: absolute; // this element will relative to #search-note-bar actually, instead of .wrapper. and it will out of standard flow
  left: 0;
  top: 0;
  width: 100%;
  height: 30px;
  line-height: 30px;
  border: none;
  font-size: $font-size-sidebar;
  background: lighten($float-bg, 1%);
  box-sizing: border-box;
  padding: 0px 6px;
  outline: none;
}

.search-res {
  list-style: none;
  padding: 0;
  margin: 0;
  li {
    height: 27px;
    line-height: 27px;
    padding-left: 4px;
    box-sizing: border-box;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    &:hover {
      cursor: pointer;
      background: lighten($sidebar-item-active-bg, 3%);
    }
  }
  .note-icon {
    height: 54%;
    vertical-align: middle;
  }
}

.selected-search-res {
  background: $sidebar-item-active-bg;
}
</style>
