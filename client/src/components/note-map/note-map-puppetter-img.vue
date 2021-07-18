<template>
  <div id="note-map-container">
    <!-- 图片列表 -->
    <div class="found-images-list">
      <div class="found-images-container" v-for="(images, imgName) in curImgs" :key="imgName">
        <div class="img-name">{{imgName}}</div>
        <img :src="img" v-for="(img, index) of images" :key="index">
      </div>
    </div>

    <textarea v-model="searchInput"></textarea>
  </div>
</template>
<script>
import Images from '@/models/images';

export default {
  name: 'note-map',
  data() {
    return {
      editor: null,
      searchInput: '',
      imgsTemp: {},
      curImgs: {},
      updateTimer: null,
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

    // 输入
    async searchInput(inputText) {
      clearTimeout(this.updateTimer);
      this.updateTimer = setTimeout(() => {
        this.build(inputText);
      }, 200);
    },

  },

  methods: {
    async build(inputText) {
      // 清理
      this.curImgs = {};
      if (Object.keys(this.imgsTemp).length >= 100) this.imgsTemp = {};

      // 解析
      const commandArr = inputText.split('\n').filter(item => item);
      for (const command of commandArr) {
        // eslint-disable-next-line no-await-in-loop
        this.$set(this.curImgs, command, await this.searchImgsOnline(command));
      }
    },

    // 在线搜索图片
    async searchImgsOnline(searchText) {
      if (this.imgsTemp[searchText]) {
        return this.imgsTemp[searchText];
      }
      const imgs = await Images.getIllustrations(searchText);
      this.$set(this.imgsTemp, searchText, imgs);
      return imgs;
    }
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
  display: flex;
  height: 100%;
  overflow: hidden;
  .found-images-list {
    background: rgb(248, 246, 245);
    flex-grow: 1;
    height: 100%;
    overflow: auto;
    .found-images-container {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      position: relative;
      .img-name {
        width: 50px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        flex-shrink: 0;
        position: absolute;
        background: rgba(255, 255, 255, 0.3);
        color: #fff;
        backdrop-filter: blur(10px);
      }
      img {
        height: 50px;
        margin-right: 2px;
        border-radius: 2px;
        cursor: pointer;
      }
    }
  }
  textarea {
    height: 100%;
    width: 300px;
    border: none;
    outline: none;
    background: rgb(253, 252, 251);
    border-right: 2px dashed #ddd;
    border-radius: 2px;
    color: rgb(117, 89, 50);
    font-weight: bold;
  }
}
</style>
