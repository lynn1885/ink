<template>
  <div id="note-map">
    <div class="note-container" v-if="noteHierarchy">
      <!-- lv1 -->
      <div
        :class="{lv1: true, item: true, alone: !lv1Obj.children || lv1Obj.children.length === 0}"
        :id="'note-map-line-'+lv1Obj.lineNum"
        v-for="lv1Obj in noteHierarchy"
        :key="lv1Obj.lineNum + lv1Obj.text"
        :style="calNodeStyle(lv1Obj.nextLine)"
      >
        <div class="cur-lv-content">
          {{lv1Obj.text.replace(/#+/, '')}}
        </div>
        <!-- lv2 -->
        <div v-if="lv1Obj.children" class="lv2-container item-container">
          <div
            :class="{lv2: true, item: true, 'no-child': !lv2Obj.children || lv2Obj.children.length === 0}"
            :id="'note-map-line-'+lv2Obj.lineNum"
            v-for="lv2Obj in lv1Obj.children"
            :key="lv2Obj.lineNum + lv2Obj.text"
            :style="calNodeStyle(lv2Obj.nextLine)"
            @click.stop="onClickMapNode(lv2Obj)"
          >
            <div class="cur-lv-content">
              {{lv2Obj.text.replace(/#+/, '')}}
            </div>
            <!-- lv3 -->
            <div v-if="lv2Obj.children" class="lv3-container item-container">
              <div
                :class="{lv3: true, item: true, 'no-child': !lv3Obj.children || lv3Obj.children.length === 0}"
                :id="'note-map-line-'+lv3Obj.lineNum"
                v-for="lv3Obj in lv2Obj.children"
                :key="lv3Obj.lineNum + lv3Obj.text"
                :style="calNodeStyle(lv3Obj.nextLine)"
                @click.stop="onClickMapNode(lv3Obj)"
              >
                <div class="cur-lv-content">
                  {{lv3Obj.text.replace(/#+/, '')}}
                </div>
                <!-- lv4 -->
                <div v-if="lv3Obj.children" class="lv4-container item-container">
                  <div
                    :class="{lv4: true, item: true, 'no-child': !lv4Obj.children || lv4Obj.children.length === 0}"
                    :id="'note-map-line-'+lv4Obj.lineNum"
                    v-for="lv4Obj in lv3Obj.children"
                    :key="lv4Obj.lineNum + lv4Obj.text"
                    :style="calNodeStyle(lv4Obj.nextLine)"
                    @click.stop="onClickMapNode(lv4Obj)"
                  >
                    <div class="cur-lv-content">
                      {{lv4Obj.text.replace(/#+/, '')}}
                    </div>
                    <!-- lv5 -->
                    <div v-if="lv4Obj.children" class="lv5-container item-container">
                      <div
                        :class="{lv5: true, item: true, 'no-child': !lv5Obj.children || lv5Obj.children.length === 0}"
                        :id="'note-map-line-'+lv5Obj.lineNum"
                        v-for="lv5Obj in lv4Obj.children"
                        :key="lv5Obj.lineNum + lv5Obj.text"
                        :style="calNodeStyle(lv5Obj.nextLine)"
                        @click.stop="onClickMapNode(lv5Obj)"
                      >
                        <div class="cur-lv-content">
                          {{lv5Obj.text.replace(/#+/, '')}}
                        </div>
                        <div v-if="lv5Obj.children" class="lv5-container item-container">
                          <!-- lv6 -->
                          <div
                            :class="{lv6: true, item: true, 'no-child': !lv6Obj.children || lv6Obj.children.length === 0}"
                            :id="'note-map-line-'+lv6Obj.lineNum"
                            v-for="lv6Obj in lv5Obj.children"
                            :key="lv6Obj.lineNum + lv6Obj.text"
                            :style="calNodeStyle(lv6Obj.nextLine)"
                            @click.stop="onClickMapNode(lv6Obj)"
                          >
                            <div class="cur-lv-content">
                              {{lv6Obj.text.replace(/#+/, '')}}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import $ from 'jquery';
import classNames from '@/tools/class-names';
import config from '@/config';

const isEnableConsole = false;

export default {
  name: 'note-map',
  data() {
    return {
      editor: null,
      noteHierarchy: null, // 笔记层级信息
      contentUpdateTimer: null,
      staticImagesUrl: config.server.staticImagesUrl, // 图片服务器url, 上传图片后, 从这个地址获取图片
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
          setTimeout(() => {
            this.build(this.editor);
          }, 0);
        }
      },
    },

    '$store.state.editor.curCursorLineNum': {
      immediate: true,
      handler(lineNum) {
        this.onCursorMove(lineNum);
      }
    }
  },

  methods: {
    // ⭐ 构建知识地图
    build() {
      this.noteHierarchy = this.editor.getHeadersHierarchy();
      console.log(123, this.noteHierarchy);
    },

    // 编辑时
    onChanges() {
      clearTimeout(this.contentUpdateTimer);
      this.contentUpdateTimer = setTimeout(() => {
        this.build(this.editor); // 重新构建mind map
      }, 1000);
    },

    // 光标移动时, 自动选中地图中的节点
    onCursorMove(lineNum) {
      const headerObj = this.editor.getHeaderByCursor({ line: lineNum, char: 0 });
      if (headerObj && typeof headerObj.headerLineNum === 'number') {
        try {
          const node = $(`#note-map-line-${headerObj.headerLineNum}`);
          node[0].scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          });
          node.addClass('active');
          setTimeout(() => {
            node.removeClass('active');
          }, 1000);
        } catch (error) {
          console.warn('无法滚动到指定node map节点: ', error);
        }
      }
    },

    // 点击地图节点时
    onClickMapNode(mapNode) {
      try {
        this.editor.scrollNoteToThisLine(mapNode.lineNum, classNames.highlightLineClass, 'unfoldAll', true);
      } catch (error) {
        console.warn('无法跳转到指定行: ', error);
      }
    },

    // 计算当前节点的样式
    calNodeStyle(nextLine) {
      if (!nextLine || !nextLine.startsWith('![]')) return;

      const styleObj = {};
      const attrs = nextLine.split('|');

      // 默认宽高

      // 背景图
      const bgImg = attrs[0].replace(/[!\[\]()]+/, '').replace(')', '');
      styleObj.background = `url("${this.staticImagesUrl + bgImg}") left top / 100px 100px`;
      styleObj.border = 'none';
      attrs.shift();

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
            const valueArr = value.split(',');
            styleObj['margin-left'] = `${valueArr[0]}px`;
            styleObj['margin-top'] = `${valueArr[1]}px`;
            styleObj.width = `${valueArr[2]}px`;
            styleObj.height = `${valueArr[3]}px`;
            break;
          }
          default:
            break;
        }
      }
      // eslint-disable-next-line consistent-return
      return styleObj;
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

  /* 地图容器 */
  .note-container {
    display: flex;
    /* background-image: url("/grass4.jpg"); */
    width: fit-content;
    height: fit-content;
    flex-direction: column;
    .item-container {
      display: flex;
      padding: 10px;
      box-sizing: border-box;
      width: fit-content;
      height: fit-content;
      &.lv2-container {
        flex-direction: column;
      }
      &.lv4-container {
        flex-direction: column;
      }
    }
    .item {
      flex-shrink: 0;
      flex-grow: 0;
      min-width: 30px;
      min-height: 30px;
      width: fit-content;
      height: fit-content;
      margin: 4px;
      box-sizing: border-box;
      font-size: 12px;
      border-radius: 4px;
      box-sizing: border-box;
      transition: all 0.2s;
      cursor: pointer;
      border: 2px solid #ccc;
      &.no-child {
        min-width: 40px;
        max-width: 120px;
      }
      .active {
        border: 2px solid red;
        transition: all 0.2s;
      }
    }
    .cur-lv-content {
      display: inline-block;
      min-height: 20px;
      color: rgb(187, 151, 35);
      background: rgba(255, 255, 255, 0.5);
      padding: 0 2px;
      border-radius: 2px;
      box-sizing: border-box;
      overflow: hidden;
      cursor: pointer;
    }
    .lv1 {
      /* background-image: url('/road.jpg'); */
      text-align: left;
      margin: 10px;
      margin-bottom: 20px;
    }
    .lv2 {
      /* background-image: url('/grass4.jpg');
      box-shadow: 1px 1px 1px #333; */
    }
    .lv3 {
      /* background-image: url('/rock.png');
      box-shadow: 1px 1px 1px #333; */
    }
    .lv4 {
      /* background-image: url('/plank.png');
      box-shadow: 10px 10px 10px #333; */
    }
    .lv5 {
      /* background-image: url('/plank2.png');
      box-shadow: 10px 10px 10px inset #333; */
    }
    .lv6 {
      /* background-image: url('/water.jpg');
      box-shadow: 1px 1px 1px inset #333; */
    }
  }
}
</style>
