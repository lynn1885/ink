<template>
  <div id="note-map-container">
    <!-- 图片列表 -->
    <div class="found-images-list">
      <div class="found-images-container" v-for="(images, imgName) in curImgs" :key="imgName">
        <div class="img-name">{{imgName.replace(/[0-9]+/, '')}}</div>
        <img :src="img" v-for="(img, index) of images" :key="index" @click="changeImg(imgName, img)">
      </div>
    </div>

    <!-- 画板 -->
    <div class="board" @mousemove="onBoardMouseMove" @mousedown="onBoardMouseDown" @mouseup="onBoardMouseUp">
      <div
        class="board-block"
        :id="blockId"
        v-for="(blockObj, blockId) in boardData.blocks"
        :style="blockObj"
        :key="blockId"
        contenteditable="true"
        :ref="blockId"
        @keydown="searchText(blockId, true)"
        @mousemove="onBlockMouseMove(blockId, $event)"
      >
      </div>
    </div>

    <!-- 按钮 -->
    <div class="buttons">
      <button class="clear" @click="clearBoard">清空</button>
      <button class="search" @click="getBlockImgs">配图</button>
      <button class="toggle-text" @click="toggleText">文字</button>
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
      updateTimer: null,
      boardData: {
        isMouseDown: false,
        blocks: {},
        curEditBlock: null,
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
      clearTimeout(this.updateTimer);
      this.updateTimer = setTimeout(() => {
        this.build(inputText);
      }, 200);
    },

  },

  methods: {
    // 暂时无用
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
    },

    // 画板按下鼠标
    onBoardMouseDown(e) {
      if (!e.ctrlKey) return;
      this.boardData.isMouseDown = true;
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      const blockId = Date.now();
      const styleObj = {
        left: `${offsetX}px`,
        top: `${offsetY}px`,
        width: '1px',
        height: '1px',
        'background-image': '',
        color: 'inherit',
        transform: '',
        'z-index': 10,
        border: ''
      };

      this.boardData.curEditBlock = blockId;
      this.$set(this.boardData.blocks, blockId, styleObj);
    },

    // 画板鼠标移动
    onBoardMouseMove(e) {
      if (!e.ctrlKey) return;

      const curBlock = this.boardData.blocks[this.boardData.curEditBlock];
      if (this.boardData.isMouseDown && this.boardData.curEditBlock && curBlock) {
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        curBlock.width = `${offsetX - Number.parseInt(curBlock.left, 10)}px`;
        curBlock.height = `${offsetY - Number.parseInt(curBlock.top, 10)}px`;
        this.$set(this.boardData.blocks, this.boardData.curEditBlock, curBlock);
      }
    },

    // 画板鼠标弹起
    onBoardMouseUp() {
      this.boardData.isMouseDown = false;
      this.boardData.curEditBlock = null;
    },

    // 方块鼠标移动
    onBlockMouseMove(blockId, e) {
      if (e.shiftKey) {
        this.boardData.blocks[blockId].left = `${Number.parseInt(this.boardData.blocks[blockId].left, 10) + e.movementX}px`;
        this.boardData.blocks[blockId].top = `${Number.parseInt(this.boardData.blocks[blockId].top, 10) + e.movementY}px`;
      } else if (e.altKey) {
        this.boardData.blocks[blockId].width = `${Number.parseInt(this.boardData.blocks[blockId].width, 10) + e.movementX}px`;
        this.boardData.blocks[blockId].height = `${Number.parseInt(this.boardData.blocks[blockId].height, 10) + e.movementY}px`;
      }
    },

    // 更改图片
    changeImg(imgName, img) {
      const blockId = imgName.split(' ')[0];
      this.boardData.blocks[blockId]['background-image'] = `url(${img})`;
    },

    // 清理画板
    clearBoard() {
      this.curImgs = {};
      this.boardData.blocks = {};
    },

    // 获取方块图片
    getBlockImgs() {
      for (const blockId in this.boardData.blocks) {
        this.searchText(blockId);
      }
    },

    // 搜索文本对应的图片
    searchText(blockId, isKeyDown) {
      setTimeout(async () => {
        if (this.$refs[blockId] && this.$refs[blockId][0]) {
          const text = this.$refs[blockId][0].innerText;
          if (!isKeyDown) { // 批量设置
            await this.setBlockStyle(blockId, text);
          } else if (/\s|-|1|2|3|9/.test(text[text.length - 1])) {
            await this.setBlockStyle(blockId, text); // 单个设置
          }
        }
      }, 0);
    },

    // 设置block样式
    async setBlockStyle(blockId, text) {
      const searchText = text.replace(/\w|-/, '');
      const imgs = await this.searchImgsOnline(searchText);
      if (imgs && imgs.length) {
        this.boardData.blocks[blockId]['background-image'] = `url(${imgs[0]})`;
        this.boardData.blocks[blockId].transform = '';
        this.boardData.blocks[blockId].filter = '';
        this.$set(this.curImgs, `${blockId} ${text}`, imgs);
        if (text.endsWith('-')) {
          this.boardData.blocks[blockId].transform = 'rotateY(180deg)';
        }
        if (text.endsWith('1')) {
          this.boardData.blocks[blockId]['z-index'] = '1';
        }
        if (text.endsWith('2')) {
          this.boardData.blocks[blockId]['z-index'] = '2';
        }
        if (text.endsWith('3')) {
          this.boardData.blocks[blockId].filter = 'blur(4px)';
        }
        if (text.endsWith('9')) {
          this.boardData.blocks[blockId].background = 'rgb(239, 239, 239)';
          this.boardData.blocks[blockId].border = '2px solid rgb(143, 113, 82)';
        }
      }
    },


    // 显示或隐藏文字
    toggleText() {
      for (const blockId in this.boardData.blocks) {
        const text = this.$refs[blockId][0].innerText;
        if (!text.endsWith('9')) {
          if (this.boardData.blocks[blockId].color === 'transparent') {
            this.boardData.blocks[blockId].color = 'inherit';
            this.boardData.blocks[blockId].backgroundColor = 'rgba(223, 236, 255, 0.5)';
          } else {
            this.boardData.blocks[blockId].color = 'transparent';
            this.boardData.blocks[blockId].backgroundColor = 'transparent';
          }
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
    height: 50%;
    flex-shrink: 0;
    flex-grow: 0;
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

  .board {
    flex-grow: 1;
    background: #fff;
    position: relative;
    color: rgb(146, 111, 82);
    .board-block {
      position: absolute;
      font-weight: bold;
      text-align: center;
      display: block;
      background-color: rgba(223, 236, 255, 0.5);
      background-position: 0;
      background-size: contain;
      background-repeat: no-repeat;
      border-radius: 2px;
      outline: none;
    }
  }

  .buttons {
    display: flex;
    height: 26px;
    padding: 2px;
    button {
      flex-grow: 1;
      margin-right: 10px;
      border: 2px solid rgb(156, 148, 140);
      color: rgb(143, 113, 82);
      cursor: pointer;
      border-radius: 0;
      transition: all 0.2s;
      &:hover {
        box-shadow: 0px 0px 4px 0px #ccc;
        transition: all 0.2s;
      }
    }
    .clear {
      background: rgb(238, 191, 191);
      color: rgb(216, 98, 98);
      border: 2px solid rgb(216, 98, 98);
    }
  }

}
</style>
