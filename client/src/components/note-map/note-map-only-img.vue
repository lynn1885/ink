<template>
  <div id="note-map">
    <div
      class="item"
      v-for="(lineText, lineNum) in mapLines"
      :key="lineNum + lineText"
      :style="calNoteContainerStyle(lineText)"
      @click="gotoNoteLine(lineNum)"
    >
      <img :src="calNoteImg(lineText)">
    </div>
  </div>
</template>
<script>
import config from '@/config';
import classNames from '@/tools/class-names';

const isEnableConsole = false;

export default {
  name: 'note-map',
  data() {
    return {
      editor: null,
      mapLines: {}, // 地图数据
      staticImagesUrl: config.server.staticImagesUrl, // 图片服务器url, 上传图片后, 从这个地址获取图片
      contentUpdateTimer: null,
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
          this.build(this.editor);
        }
      },
    }
  },

  methods: {
    // 构造地图
    build() {
      const lineArr = this.editor.cm.getDoc().getValue().split('\n');
      const mapLines = {};

      let i = 0;
      for (let lineText of lineArr) {
        lineText = lineText.trim();
        if (lineText.startsWith('![](') && lineText.endsWith('-')) {
          console.log(i);
          mapLines[i] = lineText.replace(/-+$/, '').trim();
        }
        i += 1;
      }
      this.mapLines = mapLines;
    },

    // 编辑时
    onChanges() {
      clearTimeout(this.contentUpdateTimer);
      this.contentUpdateTimer = setTimeout(() => {
        this.build(); // 重新构建mind map
      }, 1000);
    },


    // 计算图片地址
    calNoteImg(lineText) {
      if (!lineText || !lineText.startsWith('![]')) return;

      const attrs = lineText.split('|');
      const bgImg = attrs[0].replace(/[!\[\]()]+/, '').replace(')', '');
      // eslint-disable-next-line consistent-return
      return this.staticImagesUrl + bgImg;
    },

    // 计算容器样式
    calNoteContainerStyle(lineText) {
      if (!lineText || !lineText.startsWith('![]')) return;

      const styleObj = {};
      const attrs = lineText.split('|');
      attrs.shift(); // 去除背景

      // 指定位置
      for (const kvText of attrs) {
        // 拆分键值对
        const kvArr = kvText.trim().toLowerCase().split(':');
        const key = kvArr[0];
        let value = kvArr[1];
        // 处理键值对
        switch (key) {
          // 处理位置和大小
          case 'pos': {
            value = value.replace(' ', '');
            const valueArr = value.split(',').map(item => item.trim());
            styleObj.left = `${valueArr[0]}px`;
            styleObj.top = `${valueArr[1]}px`;
            styleObj.width = `${valueArr[2]}px`;
            if (valueArr[3]) styleObj.height = `${valueArr[3]}px`;
            else styleObj.height = 'auto';
            break;
          }
          default:
            break;
        }
      }
      console.log(styleObj);
      // eslint-disable-next-line consistent-return
      return styleObj;
    },

    // 跳转到对应行
    gotoNoteLine(lineNum) {
      this.editor.scrollNoteToThisLine(lineNum, classNames.highlightLineClass, 'unfoldAll', true);
    }

  },

  created() {
    if (isEnableConsole) {
      console.log('created');
    }
  },

  destroyed() {
    if (isEnableConsole) {
      console.log('destroyed');
    }
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#note-map {
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
  .item {
    position: absolute;
    width: fit-content;
    height: fit-content;
    cursor: pointer;
    box-sizing: border-box;
    img {
      width: 100%;
      height: 100%;
      &:hover {
        box-shadow: 0px 0px 2px rgb(192, 53, 226);
      }
    }
  }
}
</style>
