<template>
  <div id="search-note-bar" v-show="isShowSearchNoteBar">
    <div class="wrapper">
      <input class="search-input" type="text" v-model="searchText" ref="search-input" />
      <div class="placeholder"></div>
      <div class="max-search-res-length-warn" v-show="maxSearchResLengthWarn">{{maxSearchResLengthWarn}}</div>
      <ul class="search-res">
        <li
          v-for="res of searchRes" :key="res.toString()"
          @click="gotoNote(res)"
          :class="{'selected-search-res': res === searchRes[0 + curSelectedSearchResBias]}"
          :title="res"
        >{{res}}</li>
      </ul>
    </div>
  </div>
</template>
<script>
import $ from 'jquery';
import _ from 'lodash';

export default {
  name: 'search-note-bar',
  data() {
    return {
      isShowSearchNoteBar: false,
      catalogArr: [], // catalog array
      searchText: '', // search text
      searchRes: [], // search results
      searchTimeoutId: null, // search timeout id (for search function throttle)
      searchDealy: 240, // ms (for search function throttle)
      maxSearchResLength: 20,
      maxSearchResLengthWarn: '',
      curSelectedSearchResBias: 0, // current selected search results bias, press ↑, bias += 1, press ↓, bias -= 1
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
      this.isShowSearchNoteBar = true;
      const catalog = _.cloneDeep(this.$store.state.catalog);
      for (const cat1 in catalog) {
        for (const cat2 in catalog[cat1]) {
          for (const cat3 in catalog[cat1][cat2]) {
            this.catalogArr.push(`${cat1}/${cat2}/${cat3}`); // don't call toLowerCase(), we need the original case format for openning corresponding catalog
          }
        }
      }
      setTimeout(() => {
        if (this.$refs['search-input']) {
          this.$refs['search-input'].focus();
        }
      }, 300);
    },

    // close bar
    close() {
      this.isShowSearchNoteBar = false;
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
        let i = 0;
        this.maxSearchResLengthWarn = '';
        this.searchRes = [];
        const res = [];
        if (!searchText) {
          return;
        } else if (searchText.includes(' ') && searchText[0] !== ' ') {
          const reg = new RegExp(searchText.replace(/ +/, '.+'), 'i');
          for (const cat of this.catalogArr) {
            if (reg.test(cat)) {
              i += 1;
              res.push(cat);
              if (i >= this.maxSearchResLength) {
                this.maxSearchResLengthWarn = `Only the top ${this.maxSearchResLength} results are displayed`;
                break;
              }
            }
          }
        } else {
          for (const cat of this.catalogArr) {
            if (cat.toLowerCase().includes(searchText.toLowerCase())) {
              i += 1;
              res.push(cat);
              if (i >= this.maxSearchResLength) {
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
      if (path) {
        this.$store.commit('updateGotoThisCatalog', path.split('/'));
      }
    },

    // bind hotkey
    bindHotKey() {
      document.addEventListener('keydown', (e) => {
        // ctrl + p: toggle isShowSearchNoteBar
        if (e.ctrlKey && e.keyCode === 80) {
          e.preventDefault();
          if (this.isShowSearchNoteBar) {
            this.close();
          } else {
            this.open();
          }
        }
        // 上下切换目录搜索结果
        if (this.isShowSearchNoteBar
          && e.keyCode === 40
          && this.curSelectedSearchResBias < this.searchRes.length - 1
        ) {
          e.preventDefault();
          this.curSelectedSearchResBias += 1;
        }
        if (this.isShowSearchNoteBar
          && e.keyCode === 38
          && this.curSelectedSearchResBias > 0
        ) {
          e.preventDefault();
          this.curSelectedSearchResBias -= 1;
        }

        try {
          $('.selected-search-res')[0].scrollIntoView({ block: 'center' });
        } catch (err) {
          //
        }
        // enter键跳转至当前选中的目录
        if (this.isShowSearchNoteBar && e.keyCode === 13) {
          this.gotoNote(this.searchRes[0 + this.curSelectedSearchResBias]);
        }
      });
    },
  },
  mounted() {
    this.bindHotKey();
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#search-note-bar {
  background: $float-bg;
  box-shadow: $float-box-shadow;
  font-size: $font-size-catalog;
  .wrapper { // necessary. without this, ".search-input" cannot "fixed"
    width: 100%;
    max-height: 400px;
    overflow-x: hidden;
    overflow-y: auto;
    .placeholder { // placeholder: Just to hold up the line-hight, becasue "absolute .search-input" will out of standard flow
      width: 100%;
      height: 30px;
    }
  }
}
.max-search-res-length-warn {
  color: rgb(221, 191, 157);
  padding: 6px 0px;
  font-size: 12px;
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
  font-size: $font-size-catalog;
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
    padding: 6px;
    box-sizing: border-box;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    &:hover {
      cursor: pointer;
      background: lighten($catalog-active-bg, 3%);
    }
  }
}

.selected-search-res {
  background: $catalog-active-bg;
}
</style>
