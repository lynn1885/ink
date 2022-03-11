<template>
  <div id="gallery">
    <div class="tools-bar">
      <div class="item no-img" @click="isShowImg = !isShowImg">图片开关</div>
      <div class="item fresh" @click="refresh">刷新</div>
      <div class="all-img-number">图片总计 {{allImgNum}} 张</div>
    </div>
    <div class="gallery-container">
      <div class="line" v-for="line of lines" :key="line.lineNum">
        <div class="header1" v-if="line.type === 'header1'" @click="gotoLine(line)">
          <div class="text">{{line.lineText}}</div>
          <div class="num">{{line.includeImgNum}}</div>
        </div>
        <div class="img" v-if="line.type ==='img'" @click="gotoLine(line)" @dblclick="editImg(line.lineHandle)">
          <div class="prev">{{line.curHeader1ImgIndex}}. {{line.headers[line.headers.length - 1].headerLineText}} 总排序: {{line.imgIndex}} 本章排序: {{line.curHeader1ImgIndex}}/{{line.header1.includeImgNum}}</div>
          <img v-show="isShowImg" :src="line.imgSrc">
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import tools from '@/tools/tools';
import classNames from '@/tools/class-names.js';

export default {
  name: 'gallery',
  data() {
    return {
      editor: null,
      lines: [],
      allImgNum: 0,
      isShowImg: true,
      isContinueLoadImg: true,
    };
  },

  watch: {
    // eslint-disable-next-line func-names
    '$store.state.editor': {
      immediate: true,
      handler(value) {
        if (value) {
          this.editor = value;
          this.refresh();
        }
      },
    },

    '$store.state.curFilePath': {
      handler() {
        this.refresh();
      },
    }

  },

  methods: {
    // 获取图片
    async updateImgs() {
      const doc = this.editor.cm.getDoc();
      const lineCount = doc.lineCount();
      let previousHeader1 = null;

      // 获取图片信息
      let imgIndex = 0;
      for (let i = 0; i < lineCount; i += 1) {
        const lineText = doc.getLine(i);
        if (!this.isContinueLoadImg) {
          console.log('中止加载图片');
          break;
        }

        // 一级标题行
        if (this.editor.getHeaderLvByStr(lineText) === 1) {
          const header = {
            type: 'header1',
            lineNum: i,
            lineHandle: doc.getLineHandle(i),
            lineText,
            includeImgNum: 0,
          };
          this.lines.push(header);
          previousHeader1 = header;
        }

        // 图片行
        const imgInfo = this.editor.getLineImgInfo(lineText);
        if (imgInfo) {
          previousHeader1.includeImgNum += 1;
          imgIndex += 1;

          this.lines.push({
            type: 'img',
            lineNum: i,
            lineHandle: doc.getLineHandle(i),
            ...imgInfo,
            previousLineText: doc.getLine(i - 1),
            imgSrc: this.editor.fileServer.staticImagesUrl + imgInfo.imgSrc,
            imgIndex,
            curHeader1ImgIndex: previousHeader1.includeImgNum,
            header1: previousHeader1,
            headers: this.editor
              .getHeaderAncestors({ line: i, ch: 0 })
              .reverse(),
          });

          this.allImgNum = imgIndex;
          // eslint-disable-next-line no-await-in-loop
          await tools.sleep(1);
        }
      }
    },

    // 跳转到指定行
    gotoLine(line) {
      const doc = this.editor.cm.getDoc();
      const lineNum = doc.getLineNumber(line.lineHandle);
      this.editor.scrollNoteToThisLine(
        lineNum,
        classNames.highlightLineClass,
        undefined,
        true
      );
    },

    // 刷新
    async refresh() {
      this.lines = [];
      this.allImgNum = 0;
      this.isContinueLoadImg = false;
      await tools.sleep(100);
      this.isContinueLoadImg = true;
      await this.updateImgs();
    },

    // 编辑图片
    editImg(lineHandle) {
      if (lineHandle.widgets && lineHandle.widgets[0] && lineHandle.widgets[0].node) {
        this.editor.inkCommon.plugins['side-bar'].changeTool('Paint');
      }
    }
  },

  created() {

  },

};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#gallery {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  /* 工具 */
  .tools-bar {
    height: 34px;
    display: flex;
    align-items: center;
    flex-grow: 0;
    flex-shrink: 0;
    color: $tool-page-color;
    .item {
      height: 24px;
      line-height: 24px;
      padding: 2px 6px;
      background: $sidebar-button-bg;
      margin: 0 10px 0 2px;
      border-radius: 2px;
      cursor: pointer;
    }
  }

  /* 画廊 */
  .gallery-container {
    flex-grow: 1;
    overflow-y: auto;
    .line {
      border-bottom: $cutting-border;
      padding: 2px;
      cursor: pointer;
    }
    .header1 {
      display: flex;
      padding: 10px;
      justify-content: center;
      align-items: center;
      font-size: 20px;
      font-weight: bold;
      .num {
        padding-left: 10px;
      }
    }

    .img {
      padding-top: 10px;
      img {
        max-width: 100%;
        border-radius: 2px;
      }
    }
  }
}
</style>
