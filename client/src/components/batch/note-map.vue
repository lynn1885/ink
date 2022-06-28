<template>
  <div id="note-map-container">
    <!-- 图片列表 -->
    <div class="found-images-list">
      <div class="found-images-container" v-for="(images, imgName) in curImgs" :key="imgName">
        <div class="img-name">{{imgName.replace(/[0-9]+/, '')}}</div>
        <img :src="img" v-for="(img, index) of images" :key="index" @click="changeImg(imgName, img)">
      </div>
    </div>

    <!-- 输入 -->
    <div class="text-container">
      <i class="el-icon-close" @click="curImgs = {}"> </i>
      <input class="text-input" v-model="curText" @keydown="onInputKeyDown" title="清空图片">
    </div>
  </div>
</template>
<script>
import Images from '@/models/images';

export default {
  name: 'note-map',
  data() {
    return {
      editor: null,
      imgsTemp: {},
      curImgs: {},
      curText: '', // 当前文本
      updateTimer: null,
      boardData: {
        isMouseDown: false,
        blocks: {},
        curEditBlock: null,
      },
      maxTempLen: 50,
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
    // 在线搜索图片
    async searchImgsOnline(searchText) {
      if (!searchText) return undefined;
      if (this.imgsTemp[searchText]) {
        return this.imgsTemp[searchText];
      }
      const imgs = await Images.getIllustrations(searchText);
      this.$set(this.imgsTemp, searchText, imgs);
      if (Object.keys(this.imgsTemp).length > this.maxTempLen) {
        this.imgsTemp = {};
        console.log('清空缓存');
      }
      this.$set(this.curImgs, searchText, imgs);
      return imgs;
    },

    onInputKeyDown(e) {
      if (e.keyCode === 13) {
        if (this.curText) {
          this.searchImgsOnline(this.curText);
          this.curText = '';
        }
      }
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
  flex-direction: column;
  /* 找到的图片 */
  .found-images-list {
    background: rgb(248, 246, 245);
    flex-grow: 1;
    height: 50%;
    flex-shrink: 0;
    overflow: auto;
    .found-images-container {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      position: relative;
      .img-name {
        width: 40px;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        flex-shrink: 0;
        position: absolute;
        background: rgba(255, 255, 255, 0.3);
        color: #000;
        backdrop-filter: blur(10px);
        overflow: hidden;
      }
      img {
        height: 40px;
        margin-right: 2px;
        border-radius: 2px;
        cursor: pointer;
      }
    }
  }

  /* 输入框 */
  .text-container {
    flex-grow: 0;
    flex-shrink: 0;
    display: flex;
    align-items: center;

    input {
      flex-grow: 1;
    }
    i {
      padding: 4px;
      cursor: pointer;
    }
  }
}
</style>
