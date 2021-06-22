<template>
  <div id="note-map-container">
    <!-- 地图视口 -->
    <div class="note-map-view">
      <div class="note-map" ref="note-map">
        <!-- 当前鼠标选择框 -->
        <div class="cur-cusor-block" :style="curCursorBlockPosition"></div>

        <!-- 图片 -->
        <div
          class="note-img-container"
          v-for="img of noteMapArr"
          :key="img.lineNum + img.src"
          :style="{
            left: img.pos.left,
            top: img.pos.top,
            width: img.pos.width,
            height: img.pos.height,
          }"
          :id="'note-map-line-' + img.lineNum"
          @click="gotoThisLine(img.lineNum, $event)"
        >
          <img class="note-img" :src="img.src" :style="{
            transform: img.pos.transform,
          }">
          <div class="note-text" v-if="img.previousLine">{{img.previousLine}}</div>
        </div>
      </div>
    </div>

    <!-- 搜索图片 -->
    <div class="img-searcher">
      <iframe :src="'https://www.bing.com/images/search?q=' + imgSearcherStr + '&form=HDRSC2&first=1&tsc=ImageBasicHover'" frameborder="0" seamless></iframe>
      <iframe :src="'https://www.bing.com/images/search?q=' + imgSearcherStr + ' 卡通&form=HDRSC2&first=1&tsc=ImageBasicHover'" frameborder="0" seamless></iframe>
    </div>
  </div>
</template>
<script>
import $ from 'jquery';
import tools from '@/tools/tools';
import config from '@/config';
import classNames from '@/tools/class-names';

const isEnableConsole = false;

export default {
  name: 'note-map',
  data() {
    return {
      editor: null,
      noteHierarchy: [],
      contentUpdateTimer: null, // 笔记内容更新计时器
      imgSearcherTimer: null, // 要搜索的图片更新计时器
      curCursorBlockPosition: {
        left: '0px',
        top: '0px',
        width: '100px',
        height: '100px',
      }, // 当前鼠标选框位置
      noteMapArr: [], // 地图行, 用于构建dom
      imgSearcherStr: '风景' // 搜索图片的关键字
    };
  },

  watch: {
    // eslint-disable-next-line func-names
    '$store.state.editor': {
      immediate: true,
      handler(value) {
        if (value) {
          this.editor = value;
          this.editor.on('changes', this.onChanges);
          this.editor.on('cursorActivity', this.onCursorActivity);
          setTimeout(() => {
            this.build(this.editor);
          }, 0);
        }
      },
    },

    '$store.state.editor.curCursorLineNum': {
      handler(lineNum) {
        this.gotoThisNode(lineNum);
      }
    }
  },

  methods: {
    // ⭐ 构建地图
    build() {
      const noteLineArr = this.editor.cm.getDoc().getValue().split('\n');
      const noteMapArr = [];

      // 获取地图行
      noteLineArr.forEach((line, lineNum) => {
        line = line.replace(/\s+/g, '');
        if (line && line.startsWith('!') && line.endsWith(';')) { // 以'!'开始, 以';'结尾的图像行, 是地图行
          const [imgStr, posStr] = line.replace(/;/g, '').split(')');
          if (imgStr && posStr) {
            const posArr = posStr.split(',');
            const mapNode = {
              src: config.server.staticImagesUrl + imgStr.replace('![](', '').replace(')', ''),
              pos: {
                left: `${posArr[0]}px`,
                top: `${posArr[1]}px`,
                width: `${posArr[2]}px`,
                height: `${posArr[3]}px`
              },
              lineNum,
              previousLine: (noteLineArr[lineNum - 1] || '').trim().replace(/^#+ /, ''),
              nextLine: (noteLineArr[lineNum + 1] || '').trim().replace(/^#+ /, '')
            };
            // 处理文本行
            if (mapNode.previousLine === '图示') mapNode.previousLine = (noteLineArr[lineNum - 2] || '').trim().replace(/^#+ /, '');
            if (mapNode.previousLine.startsWith('![](')) mapNode.previousLine = '';
            if (posArr[4]) mapNode.pos.transform = `rotateZ(${posArr[4]}deg)`;
            // 存入数组
            noteMapArr.push(mapNode);
          }
        }
      });

      this.noteMapArr = noteMapArr;
    },

    // 编辑时
    onChanges() {
      clearTimeout(this.contentUpdateTimer);
      this.contentUpdateTimer = setTimeout(() => {
        this.build(this.editor); // 重新构建mind map
      }, 1000);
    },

    // 光标移动时
    onCursorActivity(e) {
      clearTimeout(this.imgSearcherTimer);
      this.imgSearcherTimer = setTimeout(() => {
        const selection = e.doc.getSelection();
        if (e.doc.getSelection()) {
          this.imgSearcherStr = selection;
        }
      }, 200);
    },

    // 初始化地图
    initNoteMap() {
      const noteMap = $(this.$refs['note-map']);
      let cursorX = 0;
      let cursorY = 0;
      let curCursorGroup = [[0, 0], [100, 100]]; // 当前鼠标两点位置
      let curCursorBlockPosition = {}; // 当前鼠标选矿位置

      // 点击地图时
      noteMap.on('click', () => {
      // 重新计算"鼠标框选"的位置
        curCursorGroup.push([cursorX, cursorY]);
        curCursorGroup = curCursorGroup.slice(-2);
        const imgLeft = Math.min(curCursorGroup[0][0], curCursorGroup[1][0]);
        const imgTop = Math.min(curCursorGroup[0][1], curCursorGroup[1][1]);
        const imgWidth = Math.abs(curCursorGroup[1][0] - curCursorGroup[0][0]);
        const imgHeight = Math.abs(curCursorGroup[1][1] - curCursorGroup[0][1]);
        curCursorBlockPosition = {
          left: `${imgLeft}px`,
          top: `${imgTop}px`,
          width: `${imgWidth}px`,
          height: `${imgHeight}px`,
        };
        this.curCursorBlockPosition = curCursorBlockPosition;
        tools.copyText(`${imgLeft},${imgTop},${imgWidth},${imgHeight},;`);
      });

      // 移动时, 获取鼠标位置
      noteMap.on('mousemove', (e) => {
        const offset = $(e.currentTarget).offset();
        cursorX = Math.floor(e.pageX - offset.left);
        cursorY = Math.floor(e.pageY - offset.top);
      });
    },

    // 跳转到笔记指定行
    gotoThisLine(lineNum, event) {
      if (!lineNum) return;
      if (!event.ctrlKey) return; // 按住ctrl, 点击鼠标进行跳转
      event.stopPropagation();
      try {
        this.editor.scrollNoteToThisLine(lineNum, classNames.highlightLineClass, 'unfoldAll', true);
      } catch (error) {
        console.warn('无法跳转到指定行: ', error);
      }
    },

    // 跳转到对应地图节点
    gotoThisNode(lineNum) {
      const node = $(`#note-map-line-${lineNum}`);
      try {
        if (node && node[0]) {
          node[0].scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          });
          node.addClass('active');
          setTimeout(() => {
            node.removeClass('active');
          }, 600);
        }
      } catch (error) {
        console.warn('无法滚动到指定node map节点: ', error);
      }
    }
  },

  created() {
    if (isEnableConsole) {
      console.log('created');
    }
  },

  mounted() {
    this.initNoteMap();
  },

  destroyed() {
    if (isEnableConsole) {
      console.log('destroyed');
    }
    this.editor.off('changes', this.onChanges);
    this.editor.off('cursorActivity', this.onCursorActivity);
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';

#note-map-container {
  width: 100%;
  height: 100%;
  overflow: hidden;

  /* 地图视口 */
  .note-map-view {
    height: calc(100% - 300px);
    width: 100%;
    overflow: auto;
    box-sizing: border-box;

    /* 地图容器 */
    .note-map {
      position: relative;
      width: 4000px;
      height: 4000px;
      // 鼠标框选
      .cur-cusor-block {
        position: absolute;
        background: rgba(255, 255, 255, 0.7);
        z-index: 100;
        transition: all 0.1s;
      }

      /* 图片容器 */
      .note-img-container {
        position: absolute;
        transition: all 0.2s;
        &.active {
          outline: 2px solid $active-color;
        }
        .note-img {
          width: 100%;
          height: 100%;
          &:hover {
            /* opacity: 0.5; */
            cursor: pointer;
          }
        }
        .note-text {
          display: inline-block;
          padding: 2px;
          margin-top: -4px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 2px;
        }
      }
    }
  }

   /* 图片搜索 */
  .img-searcher {
    width: 100%;
    height: 300px;
    overflow: hidden;

    iframe {
      width: 50%;
      height: 400px;
      transform: translateY(-10px);
    }
  }
}
</style>
