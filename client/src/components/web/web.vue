<template>
  <div id="web">
    <div class="top-bar">
      <div class="input-container">
        <input class="ink-input-bar" v-model="inputText" @keypress.enter="search"/>
        <div class="ink-button" @click="clearSearchText">×</div>
      </div>
      <div class="websites">
        <div
          :class="{
            'website': true,
            'ink-button': true,
            'active': !!selectedWebsites[webname]
          }"
          v-for="(url, webname) in websites"
          @click="selectWebsite(webname)"
          :key="webname"
        >
          {{webname}}
        </div>
      </div>
    </div>

    <div class="iframes" v-if="searchText">
      <div class="iframe-container" v-for="url in selectedWebsites" :key="url" v-if="url">
        <iframe
          class="iframe-item"
          frameborder="0"
          seamless="seamless"
          :src="url.replace('$search', searchText)">
        </iframe>
      </div>
    </div>
  </div>
</template>
<script>
// import Web from '@/models/web';

export default {
  name: 'web',
  data() {
    return {
      name: 'web',
      editor: null,
      inputText: '',
      searchText: '',
      websites: {
        wiki: 'https://zh.m.wikipedia.org/wiki/$search',
        wikiEN: 'https://en.m.wikipedia.org/wiki/$search',
        Google: 'https://www.google.com/search?start=0&num=10&igu=1&newwindow=1&client=pub-3943842678236206:0871745404&q=$search',
      },
      selectedWebsites: {
        wiki: 'https://zh.m.wikipedia.org/wiki/$search',
      }
    };
  },

  watch: {
    // eslint-disable-next-line func-names
    '$store.state.editor': {
      immediate: true,
      handler(value) {
        if (value) {
          this.editor = value;
        }
      },
    },
  },

  methods: {
    selectWebsite(webname) {
      if (!this.selectedWebsites[webname]) this.$set(this.selectedWebsites, webname, this.websites[webname]);
      else this.selectedWebsites[webname] = null;
    },

    clearSearchText() {
      this.searchText = '';
      this.inputText = '';
    },

    search() {
      this.searchText = this.inputText;
    }

  },

  mounted() {
    this.editor.bindShortcutKeyMap(document, ['Ctrl', 'Q'], () => {
      const selection = this.editor.cm.getDoc().getSelection().trim();
      if (selection) {
        this.inputText = selection;
        this.search();
      }
    });
    this.inkCommon.addPluginObject(this.name, {
      search: (searchText) => {
        this.searchText = searchText;
      }
    });
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#web {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  .top-bar {
    padding: 4px;
    width: 100%;
    box-sizing: border-box;
    .input-container {
      width: 100%;
      display: flex;
      margin-bottom: 2px;
      .ink-button {
        margin-left: 4px;
        width: 24px;
        text-align: center;
      }
    }

    .websites {
      display: flex;
      .website {
        margin-right: 2px;
        &.active {
          background: $sidebar-item-active-bg
        }
      }
    }
  }

  .iframes {
      flex-grow: 1;
    display: flex;
    flex-direction: column;
    .iframe-container {
      flex-grow: 1;
      overflow: auto;
      border-bottom: 2px dashed $sidebar-item-border-color;
      .iframe-item {
        width: 100%;
        height: 100%;
      }
    }
  }
}
</style>
