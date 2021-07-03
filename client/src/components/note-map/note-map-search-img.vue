<template>
  <div id="note-map-container">
    <textarea v-model="searchInput"></textarea>

    <div class="img-searcher" v-for="searchText of searchArr" :key="searchText">
      <iframe :src="'https://www.bing.com/images/search?q=' + searchText + '&form=HDRSC2&first=1&tsc=ImageBasicHover'" frameborder="0" seamless></iframe>
      <iframe :src="'https://www.bing.com/images/search?q=' + searchText + ' 卡通&form=HDRSC2&first=1&tsc=ImageBasicHover'" frameborder="0" seamless></iframe>
    </div>

    <!-- 搜索图片 -->
    <!-- <div class="img-searcher">
   </div> -->
  </div>
</template>
<script>
export default {
  name: 'note-map',
  data() {
    return {
      editor: null,
      searchInput: '',
      searchArr: []
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

    searchInput(value) {
      this.searchArr = value.trim().split(';').filter(item => item);
    }
  },

  methods: {

  },

  created() {

  },

  mounted() {

  },

  destroyed() {

  },
};
</script>

<style lang="scss" scoped>
#note-map-container {
  textarea {
    width: 90%;
  }
  .img-searcher {
    width: 100%;
    overflow: hidden;
    height: 200px;
    iframe {
      width: 50%;
      margin-top: -160px;
      height: 520px;
    }
  }
}
</style>
