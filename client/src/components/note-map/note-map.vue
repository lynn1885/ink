<template>
  <div id="note-map">
    <!-- 地图 -->
    <div class="note-container" v-if="noteHierarchy">
      <!-- lv1 -->
      <div
        :class="{lv1: true, item: true, alone: !lv1Obj.children || lv1Obj.children.length === 0}"
        :id="'note-map-line-'+lv1Obj.lineNum"
        v-for="lv1Obj in noteHierarchy"
        :key="lv1Obj.lineNum + lv1Obj.text"
        :style="calNodeStyle(lv1Obj.nextLine2, 1, lv1Obj)"
        v-show="!lv1Obj.text.includes('图示')"
      >
        <div class="cur-lv-content">
          {{lv1Obj.text.replace(/#+/, '')}}
        </div>
        <img class="map-img" v-if="lv1Obj.imgSrc" :src="lv1Obj.imgSrc" alt="">
        <!-- lv2 -->
        <div v-if="lv1Obj.children" class="lv2-container item-container">
          <div
            :class="{lv2: true, item: true, 'no-child': !lv2Obj.children || lv2Obj.children.length === 0}"
            :id="'note-map-line-'+lv2Obj.lineNum"
            v-for="lv2Obj in lv1Obj.children"
            :key="lv2Obj.lineNum + lv2Obj.text"
            :style="calNodeStyle(lv2Obj.nextLine2, 2, lv2Obj)"
            v-show="!lv2Obj.text.includes('图示')"
            @click.stop="onClickMapNode(lv2Obj)"
          >
            <div class="cur-lv-content">
              {{lv2Obj.text.replace(/#+/, '')}}
            </div>
            <img class="map-img" v-if="lv2Obj.imgSrc" :src="lv2Obj.imgSrc" alt="">
            <!-- lv3 -->
            <div v-if="lv2Obj.children" class="lv3-container item-container">
              <div
                :class="{lv3: true, item: true, 'no-child': !lv3Obj.children || lv3Obj.children.length === 0}"
                :id="'note-map-line-'+lv3Obj.lineNum"
                v-for="lv3Obj in lv2Obj.children"
                :key="lv3Obj.lineNum + lv3Obj.text"
                :style="calNodeStyle(lv3Obj.nextLine2, 3, lv3Obj)"
                v-show="!lv3Obj.text.includes('图示')"
                @click.stop="onClickMapNode(lv3Obj)"
              >
                <div class="cur-lv-content">
                  {{lv3Obj.text.replace(/#+/, '')}}
                </div>
                <img class="map-img" v-if="lv3Obj.imgSrc" :src="lv3Obj.imgSrc" alt="">
                <!-- lv4 -->
                <div v-if="lv3Obj.children" class="lv4-container item-container">
                  <div
                    :class="{lv4: true, item: true, 'no-child': !lv4Obj.children || lv4Obj.children.length === 0}"
                    :id="'note-map-line-'+lv4Obj.lineNum"
                    v-for="lv4Obj in lv3Obj.children"
                    :key="lv4Obj.lineNum + lv4Obj.text"
                    :style="calNodeStyle(lv4Obj.nextLine2, 4, lv4Obj)"
                    v-show="!lv4Obj.text.includes('图示')"
                    @click.stop="onClickMapNode(lv4Obj)"
                  >
                    <div class="cur-lv-content">
                      {{lv4Obj.text.replace(/#+/, '')}}
                    </div>
                    <img class="map-img" v-if="lv4Obj.imgSrc" :src="lv4Obj.imgSrc" alt="">
                    <!-- lv5 -->
                    <div v-if="lv4Obj.children" class="lv5-container item-container">
                      <div
                        :class="{lv5: true, item: true, 'no-child': !lv5Obj.children || lv5Obj.children.length === 0}"
                        :id="'note-map-line-'+lv5Obj.lineNum"
                        v-for="lv5Obj in lv4Obj.children"
                        :key="lv5Obj.lineNum + lv5Obj.text"
                        :style="calNodeStyle(lv5Obj.nextLine2, 5, lv5Obj)"
                        v-show="!lv5Obj.text.includes('图示')"
                        @click.stop="onClickMapNode(lv5Obj)"
                      >
                        <div class="cur-lv-content">
                          {{lv5Obj.text.replace(/#+/, '')}}
                        </div>
                        <img class="map-img" v-if="lv5Obj.imgSrc" :src="lv5Obj.imgSrc" alt="">
                        <div v-if="lv5Obj.children" class="lv5-container item-container">
                          <!-- lv6 -->
                          <div
                            :class="{lv6: true, item: true, 'no-child': !lv6Obj.children || lv6Obj.children.length === 0}"
                            :id="'note-map-line-'+lv6Obj.lineNum"
                            v-for="lv6Obj in lv5Obj.children"
                            :key="lv6Obj.lineNum + lv6Obj.text"
                            :style="calNodeStyle(lv6Obj.nextLine, 6, lv6Obj)"
                            v-show="!lv6Obj.text.includes('图示')"
                            @click.stop="onClickMapNode(lv6Obj)"
                          >
                            <div class="cur-lv-content">
                              {{lv6Obj.text.replace(/#+/, '')}}
                            </div>
                            <img class="map-img" v-if="lv6Obj.imgSrc" :src="lv6Obj.imgSrc" alt="">
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

    <!-- 图片 -->
    <div class="img-searcher">
      <iframe :src="'https://www.bing.com/images/search?q=' + imgSearcherStr + '&form=HDRSC2&first=1&tsc=ImageBasicHover'" frameborder="0" seamless></iframe>
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
      staticImagesUrl: config.server.staticImagesUrl,
      staticMapImgUrl: config.server.staticMapImgUrl,
      imgSearcherTimer: null, // 搜索图片的节流器
      imgSearcherStr: '你好' // 搜索图片的关键字
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
        this.selectCurCursorLine(lineNum);
      }
    }
  },

  methods: {
    // ⭐ 构建知识地图
    build() {
      this.noteHierarchy = this.editor.getHeadersHierarchy();
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
        this.imgSearcherStr = e.doc.getSelection() || '你好';
      }, 800);
    },

    // 光标移动时, 自动选中地图中的节点
    selectCurCursorLine(lineNum) {
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
    // 样式行: 1-5级标题的样式行, 是标题行之后的第二行. 6级标题的样式行, 是标题行之后的第一行
    calNodeStyleOld(styleLine, lv, lvObj) {
    // 样式行需要以'==='结尾
      if (!styleLine || !styleLine.startsWith('===') || !styleLine.endsWith('===')) return;

      // 移除'==='
      styleLine = styleLine.replace(/===/g, '').replace(/\s+/g, '');

      // 解析出来用户设置的属性
      const styleObj = {};
      const attrsArr = styleLine.split('|'); // 用户自定义的属性数组
      const attrs = {}; // 用户自定义的属性对象
      attrsArr.forEach((item) => {
        const [k, v] = item.split(':');
        if (k.startsWith('![](')) {
          attrs.bg2 = k;
        } else {
          attrs[k] = v;
        }
      });

      // 解析出来个属性的值
      // 背景图, 瓷砖
      const bgImgStr = attrs.bg2 || `![](map/${attrs.bg}.png)`; // 背景图片地址: ![](625/2531038569.png) 或直接给名字 '山'
      let bgWidthHeightStr = attrs.bs; // 背景图片大小: 10,10%
      const bgTileStr = attrs.bt; // 背景瓷砖: dirt1, 3, inset
      const smartBgHeight = attrs.sh; // 智能背景高度: 100 (表示背景图高度100px, 并腾出100px的padding-top)
      const smartBgWidth = attrs.sw; // 智能背景宽度: 100 (表示背景图宽度100px, 并腾出100px的padding-left)

      // 容器宽高
      const heightStr = attrs.h; // 高度: 100
      const widthStr = attrs.w; // 宽度: 100
      const paddingLeftStr = attrs.pl; // 左内边距: 100
      const paddingTopStr = attrs.pt; // 上内边距: 100
      const marginLeftStr = attrs.ml; // 左外边距: 100
      const marginTopStr = attrs.mt; // 上外边距: 100

      const sizeStr = attrs.s; // 宽高: 100, 100
      const posStr = attrs.p; // 容器位置: 0,0,100,100

      // 圆角
      const radiusStr = attrs.r; // 圆角: 20

      // transform
      const scaleStr = attrs.ts; // 放缩 0.3


      // 先解除宽高限制
      styleObj['max-width'] = '9999px';
      styleObj['max-height'] = '9999px';

      // 解析: 背景图地址, 背景图大小
      if (bgImgStr) {
        let isRepeat = false;
        if (bgWidthHeightStr && bgWidthHeightStr.endsWith('r')) { // 背景图size以'r'结尾时, 表示要重复背景图
          isRepeat = true;
          bgWidthHeightStr = bgWidthHeightStr.replace(/r$/, '');
        }
        const bgImg = bgImgStr.replace(/[!\[\]()]+/, '').replace(')', '');
        styleObj.background = `url("${this.staticImagesUrl + bgImg}") ${isRepeat ? '' : 'no-repeat'}  center 10px / `;
        // 解析背景图大小
        if (bgWidthHeightStr) {
          const bgWidthHeightArr = bgWidthHeightStr.split(',');
          if (bgWidthHeightArr[0]) styleObj.background += `${bgWidthHeightArr[0]}${bgWidthHeightArr[0].endsWith('%') ? '' : 'px'}`;
          if (bgWidthHeightArr[1]) styleObj.background += ` ${bgWidthHeightArr[1]}${bgWidthHeightArr[1].endsWith('%') ? '' : 'px'}`;
        } else if (smartBgHeight) {
          styleObj.background += `auto ${smartBgHeight}px`;
          styleObj['padding-top'] = `${smartBgHeight}px`;
        } else if (smartBgWidth) {
          styleObj.background += `${smartBgWidth}px auto`;
          styleObj['padding-left'] = `${smartBgWidth}px`;
        } else {
          styleObj.background += '101% 101%';
        }
      }

      // 解析: 背景瓷砖
      if (bgTileStr) {
        const bgTileArr = bgTileStr.split(',');
        // 解析瓷砖背景
        if (styleObj.background) {
          styleObj.background += ', ';
        } else {
          styleObj.background = '';
        }
        styleObj.background += `url("${this.staticMapImgUrl + bgTileArr[0]}.png")`;
        // 解析box-shadow
        if (bgTileArr[1]) {
          styleObj['box-shadow'] = `${bgTileArr[1]}px ${bgTileArr[1]}px ${bgTileArr[1]}px ${bgTileArr[2] || ''} #333`;
        }
      }


      // 解析: 容器位置pos
      if (posStr) {
        const [left, top, width, height] = posStr.split(',');
        styleObj['margin-left'] = `${left}px`;
        styleObj['margin-top'] = `${top}px`;
        styleObj.width = `${width}px`;
        styleObj.height = `${height}px`;
      }

      // 解析: 容器宽高
      if (sizeStr) {
        const sizeArr = sizeStr.split(',');
        styleObj.width = `${sizeArr[0]}px`;
        styleObj.height = `${sizeArr[1] || sizeArr[0]}px`;
      }
      if (widthStr) styleObj.width = `${widthStr}px`;
      if (heightStr) styleObj.height = `${heightStr}px`;

      // 解析: 容器边距
      if (paddingLeftStr) styleObj['padding-left'] = `${paddingLeftStr}px`;
      if (paddingTopStr) styleObj['padding-top'] = `${paddingTopStr}px`;
      if (marginLeftStr) styleObj['margin-left'] = `${marginLeftStr}px`;
      if (marginTopStr) styleObj['margin-top'] = `${marginTopStr}px`;

      // 解析: 圆角
      if (radiusStr) styleObj['border-radius'] = `${radiusStr}px`;

      // 解析: 放缩
      if (scaleStr) styleObj.transform = `scale(${scaleStr})`;


      // console.log(999, styleObj);
      // eslint-disable-next-line consistent-return
      return styleObj;
    },

    // 计算节点样式
    calNodeStyle(styleLine, lv, lvObj) {
      if (!styleLine) return;

      if (styleLine.startsWith('![](')) {
        const imgName = styleLine.replace('![](', '').replace(')', '');
        const imgSrc = this.staticImagesUrl + imgName;
        lvObj.imgSrc = imgSrc;
      }
    },
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
    this.editor.off('changes', this.onChanges);
    this.editor.off('cursorActivity', this.onCursorActivity);
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#note-map {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;

  /* 地图容器 */
  .note-container {
    display: flex;
    /* background-image: url("/grass4.jpg"); */
    width: 100%;
    height: 100%;
    overflow: auto;


    flex-direction: column;
    .item-container {
      display: flex;
      position: relative;
      box-sizing: border-box;
      /* width: fit-content; */
      /* height: fit-content; */
      flex-direction: column;
      /* &.lv2-container {
        flex-direction: column;
      }
      &.lv4-container {
        flex-direction: column;
      } */
    }
    .item {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      flex-grow: 0;
      min-width: 80px;
      /* width: fit-content; */
      /* height: fit-content; */
      margin: 3px;
      box-sizing: border-box;
      font-size: 12px;
      border-radius: 2px;
      box-sizing: border-box;
      transition: all 0.2s;
      cursor: pointer;
      border: 1px dashed #888;
      vertical-align: middle;
      .active {
        border: 1px dashed red;
        transition: all 0.2s;
      }
    }
    /* 内容: 文本 */
    .cur-lv-content {
      display: inline-block;
      padding: 0 2px;
      margin: 0 auto 0 0;
      border-radius: 2px;
      box-sizing: border-box;
      overflow: hidden;
      cursor: pointer;
      /* color: rgb(100, 89, 72); */
      background: rgba(255, 255, 255, 0.6);
      font-weight: bold;
    }

    /* 内容: 图像 */
    .map-img {
      width: 120px;
      margin-left: 10px;
      border-radius: 3px;
    }

    .lv1 {
      color: $header-1;
    }
    .lv2 {
      color: $header-2;
    }
    .lv3 {
      color: $header-3;
    }
    .lv4 {
      color: $header-4;
    }
    .lv5 {
      color: $header-5;
    }
    .lv6 {
      color: $header-6;
    }
     /* .lv1 {
      background-image: url('/road.jpg');
    }
    .lv2 {
      background-image: url('/grass4.jpg');
      box-shadow: 1px 1px 1px #333;
    }
    .lv3 {
      background-image: url('/rock.png');
      box-shadow: 1px 1px 1px #333;
    }
    .lv4 {
      background-image: url('/plank.png');
      box-shadow: 10px 10px 10px #333;
    }
    .lv5 {
      background-image: url('/plank2.png');
      box-shadow: 10px 10px 10px inset #333;
    }
    .lv6 {
      background-image: url('/water.jpg');
      box-shadow: 1px 1px 1px inset #333;
    } */
  }

  /* 图片搜索 */
  .img-searcher {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 200px;
    overflow: hidden;
    iframe {
      width: 100%;
      height: 400px;
      transform: translateY(-120px);
    }
  }
}
</style>
