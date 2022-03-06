<template>
  <div id="gallery">
    <div class="container">
      <div class="line" v-for="line of lines" :key="line.lineNum">
        <div class="header1" v-if="line.type === 'header1'" @click="gotoLine(line)">
          <div class="text">{{line.lineText}}</div>
          <div class="num">{{line.includeImgNum}}</div>
        </div>
        <div class="img" v-if="line.type ==='img'" @click="gotoLine(line)">
          <div class="prev">{{line.previousLineText}} 总共: {{line.imgIndex}}/{{allImgNum}} 本章: {{line.curHeader1ImgIndex}}/{{line.header1.includeImgNum}}</div>
          <img :src="line.imgSrc">
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
    };
  },

  watch: {
    // eslint-disable-next-line func-names
    '$store.state.editor': {
      immediate: true,
      handler(value) {
        if (value) {
          this.editor = value;
          this.updateImgs();
        }
      },
    },
  },

  methods: {
    async updateImgs() {
      const doc = this.editor.cm.getDoc();
      const lineCount = doc.lineCount();
      let previousHeader1 = null;

      // 获取图片信息
      let imgIndex = 0;
      for (let i = 0; i < lineCount; i += 1) {
        const lineText = doc.getLine(i);

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

          // eslint-disable-next-line no-await-in-loop
          await tools.sleep(1);
        }
      }

      this.allImgNum = imgIndex;
    },

    gotoLine(line) {
      const doc = this.editor.cm.getDoc();
      const lineNum = doc.getLineNumber(line.lineHandle);
      this.editor.scrollNoteToThisLine(
        lineNum,
        classNames.highlightLineClass,
        undefined,
        true
      );
    }
  },

  created() {

  },

};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#gallery {
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
</style>
