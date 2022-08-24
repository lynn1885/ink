<template>
  <div id="note-map-container">
    <textarea v-model="searchInput"></textarea>

    <!-- 图片列表 -->
    <div class="found-images-list">
       <div class="found-images-type" v-for="(typeData, type) in remImgs" :key="type">
        <div class="found-images-container" v-for="(images, name) in typeData" :key="name">
          <span>{{name}}</span>
          <img :src="img" v-for="(img, index) of images" :key="index">
        </div>
      </div>
    </div>

      <!-- 自动生成的记忆图片 -->
    <div class="rem-img-canvas" v-html="remImgsDoms" @click="changeRemImg($event)"></div>
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
      remImgs: { // 记忆图片们
        bg: {},
        s1: {},
        s2: {},
        s3: {},
        s4: {},
        s5: {},
        s6: {},
        s7: {},
      },
      remImgsFlatted: {}, // 一层结构的记忆图片
      remImgsDoms: '', // 生成的记忆图片dom字符串, 渲染用
      remImgParams: { // 记忆图片参数
        bgWidth: 600, // 背景图宽度
      },
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
      // 清理上次结果
      this.remImgs = {
        bg: {},
        s1: {},
        s2: {},
        s3: {},
        s4: {},
        s5: {},
        s6: {},
        s7: {},
      };
      this.remImgsFlatted = {};
      this.remImgsDoms = '';

      // 解析新输入
      const commands = inputText.split('\n');

      let lineIndex = 1;
      for (let command of commands) {
        // 解析每一行
        command = command.trim();
        // eslint-disable-next-line prefer-const
        let [type, textPairArr] = command.split(':'); // 分类类型 & 值
        if (textPairArr && typeof textPairArr === 'string' && textPairArr.includes(',')) textPairArr = textPairArr.split(',');
        if (!Array.isArray(textPairArr)) textPairArr = [textPairArr]; // 最终效果, 值都转换为数组形式: [抽象/具象, 抽象/具象, 抽象/具象]

        // 获取每一行的图片
        let pairIndex = 1;
        let images;
        for (const textPair of textPairArr) {
          // 解析一行中的每个字符对: 管理/管理员
          if (textPair) {
            // eslint-disable-next-line prefer-const
            let [oriText, searchText] = textPair.split('/');
            if (!searchText) searchText = oriText;
            // eslint-disable-next-line no-await-in-loop
            images = await Images.getIllustrations(searchText.replace(/-/, '')); // 去除搜索文本中的 -- 标记
            this.$set(this.remImgs[type], `${lineIndex}${pairIndex}_${oriText}_${searchText}`, images);
          }
          pairIndex += 1;
        }
        lineIndex += 1;
      }

      this.generateRemImg();
    },

  },

  methods: {
    // 生成记忆图片
    generateRemImg() {
      // 生成背景图片
      const bgKeysArr = Object.keys(this.remImgs.bg);
      if (bgKeysArr.length) {
        const imgs = this.remImgs.bg[bgKeysArr[0]];
        const id = Math.random();
        this.$set(this.remImgsFlatted, id, imgs);
        this.remImgsDoms += `<div class="rem-img-container" style="left: 0px; top: 0px"><img id="${id}" style="width: ${this.remImgParams.bgWidth}px; height: ${this.remImgParams.bgWidth}px;" src="${imgs[1]}" ><span>${bgKeysArr[0].split('_')[1]}</span></div>`;
      }

      // 生成句子图片
      const sentences = [this.remImgs.s1, this.remImgs.s2, this.remImgs.s3, this.remImgs.s4, this.remImgs.s5, this.remImgs.s6, this.remImgs.s7].filter(item => Object.keys(item).length);

      let sentenceIndex = 0;
      for (const sentence of sentences) { // 一个句子
        let pairIndex = 0;
        const pairLength = Object.keys(sentence).length;
        if (pairLength) {
          for (const imgName in sentence) { // 一个句子的多个节点
            const imgs = sentence[imgName];
            if (imgs.length) {
              const imgNameArr = imgName.split('_');
              const imgPos = this._calRemImgPos(sentences.length, sentenceIndex, pairLength, pairIndex, imgNameArr[2]);
              const id = Math.random();
              this.$set(this.remImgsFlatted, id, imgs);
              this.remImgsDoms += `<div class="rem-img-container" style="width: ${imgPos.width}px; left: ${imgPos.left}px; top: ${imgPos.top}px"><img id="${id}" src="${imgs[2]}"><span>${imgNameArr[1]}</span></div>`;
              pairIndex += 1;
            }
          }
        }
        sentenceIndex += 1;
      }
    },

    /**
     * 计算记忆图片位置
     * @param {number} sLen 一个有几个要记忆的句子
     * @param {number} sIndex 当前是第几个句子
     * @param {number} pLen 当前句子有几个pair
     * @param {number} pIndex 当前pair是第几个pair
     * @param {string} searchText 当前pair的搜索关键词
     */
    _calRemImgPos(sLen, sIndex, pLen, pIndex, searchText) {
      // 处理searchText中的特殊标记, 如果含有 '-', 表示这个pair的图片, 要和上一个pair的图片接近
      if (searchText && searchText.endsWith('-')) pIndex -= 0.7;
      if (searchText && searchText.endsWith('--')) pIndex -= 1.4;

      // 计算画布总大小
      const allWidth = this.remImgParams.bgWidth;
      const allHeight = allWidth;

      // 计算图片的标准宽高
      let lineHeight = allHeight / sLen; // 一个句子占一行, 计算平均行高
      if (lineHeight >= allHeight / 2) lineHeight = allHeight / 2;

      // 计算这一句子所在的行的标准top偏移
      const standardLineTop = lineHeight * sIndex;

      // 随机计算这张图片的top偏移
      const top = this.getRandomInt(standardLineTop, standardLineTop); // 允许相对本来应该在的位置, 有上下各50px的随机偏移

      // 随机计算这张图片的left偏移
      const pairWidth = 120;
      let left = pIndex * pairWidth;
      if (pLen <= 1) left += 300;
      else if (pLen <= 2) left += 200;
      else if (pLen <= 3) left += 100;

      // 随机计算这张图片的width
      const width = this.getRandomInt(pairWidth * 0.5, pairWidth * 0.8); // 允许在图片应该大小的这个倍数之间缩放

      // 返回
      return {
        top,
        left,
        width
      };
    },

    // 获取范围中的随机整数
    getRandomInt(start, end) {
      return Math.floor((Math.random() * (end - start)) + start);
    },

    changeRemImg(e) {
      if (e.target && e.target.id) {
        const imgs = this.remImgsFlatted[e.target.id];
        e.target.src = imgs[this.getRandomInt(0, imgs.length)];
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
  textarea {
    width: 94%;
    margin-left: 3%;
    margin-top: 10px;
    border: 2px solid rgb(109, 93, 83);
    background: rgb(250, 248, 246);
    height: 100px;
    border-radius: 2px;
    color: rgb(92, 83, 70);
  }

  /* 记忆图片容易 */
  .rem-img-canvas {
    position: relative;
    width: 600px;
    box-sizing: border-box;
    border-radius: 2px solid rgb(110, 93, 76);
    margin-left: 100px;
    margin-top: 80px;

  }

  /* 找到的图片列表 */
  .found-images-list {
    padding-left: 20px;
    .found-images-type {
      .found-images-container {
        display: flex;
        span {
          flex-shrink: 0;
        }
        img {
          height: 60px;
          margin-left: 2px;
          border-radius: 2px;
        }
      }
    }
  }
}
</style>
<style lang="scss">
.rem-img-container {
  display:block;
  position: absolute;
  text-align: center;
  img {
    display: block;
    border-radius: 2px;
    border: 2px solid rgb(110, 93, 76);
    width: 100%;
    box-sizing: border-box;
  }
  span {
    background: rgba(255,255,255,0.8);
    font-family: 方正像素14;
    font-weight: bold;
    color: rgb(156, 118, 68);
    padding: 2px;
    border-radius: 2px;
  }
}
</style>
