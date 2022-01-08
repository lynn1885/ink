<template>
  <div id="paint">
    <!-- 工具 -->
    <div class="tools-container">
      <!-- 撤回 -->
      <div
        class="tool replace"
        @click="replaceThisLine"
      >
        <div class="tool-name">
          <i class="el-icon-refresh"></i>
          替换这一行: {{curLineNum}}. {{curLineText}}
        </div>
      </div>
      <!-- 撤回 -->
      <div
       class="tool"
        @click="undo()"
      >
        <i class="el-icon-back"></i>
        <div class="tool-name">
          撤回
        </div>
      </div>

      <!-- 清空 -->
      <div
        class="tool"
        title="双击按钮, 清空画布"
        @dblclick="empty()"
      >
        <i class="el-icon-delete"></i>
        <div class="tool-name">
          清空
        </div>
      </div>

      <!-- 画笔 -->
      <div
        :class="['tool', activeToolName === toolName ? 'active' : '']"
        v-for="(toolObj, toolName) of tools"
        :key="toolName"
        @click="setTool(toolName, toolObj)"
      >
        <div
          :class="['inner', toolObj.type, toolObj.brush]"
          :style="{
            width: toolObj.width * 3 + 'px',
            height: toolObj.width * 3 + 'px',
            background: toolObj.color
          }"
        ></div>
        <div class="tool-name">
          {{toolObj.name}}
        </div>
      </div>
    </div>

    <!-- 画板 -->
    <div class="canvas-container">
      <canvas
        id="canvas"
        width="700px"
        height="700px"
        ref="canvas"
      ></canvas>
    </div>

    <!-- 预览 -->
    <div class="img-preview">
      <img :src="imgPreviewData" ref="img-preview">
    </div>

  </div>
</template>
<script>
// fabric基础库
import { fabric } from 'fabric';
import config from '@/config';

export default {
  name: 'paint',
  data() {
    return {
      editor: null,
      canvas: null, // 画板
      emptyCanvas: null, // 空画板
      activeToolName: 'pen1', // 当前激活的工具,
      historyArr: [], // 历史状态
      isPreventRecordHistory: false, // 是否禁用历史记录, 有些操作需要禁用
      imgPreviewData: null, // 预览的图片
      curLineNum: null, // 当前鼠标所在行
      curLineText: '', // 当前鼠标所在行的文字
      previewImgTimer: null, // 预览图片的timer
      tools: {
        eraser: {
          width: 20,
          type: 'eraser',
          name: '橡皮'
        },
        penBlack: {
          color: 'black',
          width: 2,
          name: '黑',
          type: 'pen'
        },
        penGray: {
          color: '#aaa',
          width: 2,
          name: '灰',
          type: 'pen'
        },
        penGreen: {
          color: 'rgb(39, 169, 59)',
          width: 2,
          name: '绿',
          type: 'pen'
        },
        penCyan: {
          color: 'rgb(67, 254, 245)',
          width: 2,
          name: '青',
          type: 'pen'
        },
        penBlue: {
          color: 'rgb(73, 121, 255)',
          width: 2,
          name: '蓝',
          type: 'pen'
        },
        penYellow: {
          color: 'rgb(255, 212, 64)',
          width: 2,
          name: '黄',
          type: 'pen'
        },
        penOrange: {
          color: 'rgb(255, 178, 64)',
          width: 2,
          name: '橙',
          type: 'pen'
        },
        penRed: {
          color: 'rgb(255, 93, 82)',
          width: 2,
          name: '红',
          type: 'pen'
        },
        penPurple: {
          color: 'rgb(179, 64, 217)',
          width: 2,
          name: '紫',
          type: 'pen'
        },
        penOpacityBlack: {
          color: 'rgba(0, 0, 0, 0.6)',
          width: 20,
          name: '透黑',
          type: 'pen'
        },
        penOpacityBigGray: {
          color: 'rgba(120, 120, 120, 0.6)',
          width: 20,
          name: '透灰',
          type: 'pen'
        },
        penOpacityGreen: {
          color: 'rgba(39, 169, 59, 0.6)',
          width: 20,
          name: '透绿',
          type: 'pen'
        },
        penOpacityCyan: {
          color: 'rgb(67, 254, 245, 0.6)',
          width: 20,
          name: '透青',
          type: 'pen'
        },
        penOpacityBlue: {
          color: 'rgba(73, 121, 255, 0.6)',
          width: 20,
          name: '透蓝',
          type: 'pen'
        },
        penOpacityYellow: {
          color: 'rgba(255, 212, 64, 0.6)',
          width: 20,
          name: '透黄',
          type: 'pen'
        },
        penOpacityOrange: {
          color: 'rgba(255, 178, 64, 0.6)',
          width: 20,
          name: '透橙',
          type: 'pen'
        },
        penOpacityPink: {
          color: 'rgba(255, 182, 182, 0.6)',
          width: 20,
          name: '透粉',
          type: 'pen'
        },
        penOpacityRed: {
          color: 'rgba(255, 93, 82, 0.6)',
          width: 20,
          name: '透红',
          type: 'pen'
        },
        penOpacityPurple: {
          color: 'rgba(179, 64, 217, 0.6)',
          width: 20,
          name: '透紫',
          type: 'pen'
        },
        penFillBlack: {
          color: 'black',
          width: 2,
          name: '填充黑',
          type: 'pen',
          brush: 'fill'
        },
        penFillWhite: {
          color: '#fcfcfc',
          width: 2,
          name: '填充白',
          type: 'pen',
          brush: 'fill'
        },
        penFillGray: {
          color: '#aaa',
          width: 2,
          name: '填充灰',
          type: 'pen',
          brush: 'fill'
        },
        penFillGreen: {
          color: 'rgb(101, 204, 103)',
          width: 2,
          name: '填充绿',
          type: 'pen',
          brush: 'fill'
        },
        penFillCyan: {
          color: 'rgb(154, 255, 255)',
          width: 2,
          name: '填充青',
          type: 'pen',
          brush: 'fill'
        },
        penFillBlue: {
          color: 'rgb(153, 204, 253)',
          width: 2,
          name: '填充蓝',
          type: 'pen',
          brush: 'fill'
        },
        penFillLightYellow: {
          color: 'rgb(243, 219, 194)',
          width: 2,
          name: '填充土',
          type: 'pen',
          brush: 'fill'
        },
        penFillYellow: {
          color: 'rgb(255, 212, 64)',
          width: 2,
          name: '填充黄',
          type: 'pen',
          brush: 'fill'
        },
        penFillOrange: {
          color: 'rgb(255, 178, 64)',
          width: 2,
          name: '填充橙',
          type: 'pen',
          brush: 'fill'
        },
        penFillRed: {
          color: 'rgb(255, 153, 153)',
          width: 2,
          name: '填充红',
          type: 'pen',
          brush: 'fill'
        },
        penFillPurple: {
          color: 'rgb(203, 152, 255)',
          width: 2,
          name: '填充紫',
          type: 'pen',
          brush: 'fill'
        },
      }
    };
  },

  watch: {
    // eslint-disable-next-line func-names
    '$store.state.editor': {
      immediate: true,
      handler(value) {
        if (value) {
          this.editor = value;
          setTimeout(() => {
            this.getOldImg();
          }, 0);
        }
      },
    },
    // eslint-disable-next-line func-names
    '$store.state.editor.curCursorLineNum': {
      immediate: true,
      handler(value) {
        this.onEditorLineChange(value);
      },
    },
  },

  methods: {
    // 创建画布
    buildCanvas() {
      // 创建画布
      this.canvas = new fabric.Canvas('canvas'); // 可以通过鼠标方法缩小,旋转
      this.canvas.isDrawingMode = true;
      this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);

      // 画布上添加图形或使用橡皮擦会触发 after:render 事件，我们在此时保存当前画布状态
      this.canvas.on('after:render', () => {
        if (this.isPreventRecordHistory) {
          this.isPreventRecordHistory = false;
          return;
        }
        this.historyArr.push(JSON.stringify(this.canvas));
        console.log('历史步骤:', this.historyArr.length);
        if (this.historyArr.length > 50) this.historyArr.shift(); // 最多保留50步
      });

      // fill画笔, 起笔自动填充
      this.canvas.on('mouse:up', () => {
        const curTool = this.tools[this.activeToolName];
        if (curTool && curTool.type === 'pen' && curTool.brush === 'fill') {
          const objects = this.canvas.getObjects();
          objects[objects.length - 1].fill = curTool.color;
        }
      });

      // 添加白底
      const backgroundRect = new fabric.Rect({
        width: this.canvas.width,
        height: this.canvas.height,
        left: 0,
        top: 0,
        fill: '#fff',
      });
      this.canvas.add(backgroundRect);

      // 记录初始状态
      this.emptyCanvas = JSON.stringify(this.canvas);

      // 恢复旧画布
      const previousPaint = localStorage.getItem('previousPaint');
      if (previousPaint) {
        this.canvas.loadFromJSON(previousPaint);
      }
    },

    // 当光标所在行变化时
    onEditorLineChange(lineNum) {
      const doc = this.editor.cm.getDoc();
      const lineText = doc.getLine(lineNum);
      this.curLineNum = lineNum;
      this.curLineText = lineText;
    },

    // 获取旧的图片
    getOldImg() {
      const doc = this.editor.cm.getDoc();
      const cursor = doc.getCursor();
      const lineText = doc.getLine(cursor.line);
      if (lineText.startsWith('![')) {
        const matchRes = lineText.match(/!\[.*?\]\((.+?)\)/);
        console.log(matchRes);
        if (matchRes && matchRes.length) {
          const imgSrc = config.server.staticImagesUrl + matchRes[1];

          const imgEl = new Image(); // 创建新的图片对象
          imgEl.onload = (e) => { // 图片加载完，再draw 和 toDataURL
            if (e && e.path && e.path[0] && e.path[0].width && e.path[0].height) {
              this.canvas.setDimensions({ width: e.path[0].width, height: e.path[0].height });
            }
            this.canvas.add(new fabric.Image(imgEl));
          };
          imgEl.crossOrigin = 'anonymous'; // 设置跨域
          imgEl.src = imgSrc;
        }
      }
    },

    // 设置工具
    setTool(toolName, toolObj) {
      this.activeToolName = toolName;
      // 设置笔
      if (toolObj.type === 'pen') {
        switch (toolObj.brush) {
          // 粉笔
          case 'fill':
            this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
            this.canvas.freeDrawingBrush.color = 'black';
            this.canvas.freeDrawingBrush.width = 2;
            break;
          // 默认笔
          default:
            this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
            this.canvas.freeDrawingBrush.color = toolObj.color;
            this.canvas.freeDrawingBrush.width = toolObj.width;
            break;
        }
      } else if (toolObj.type === 'eraser') {
        // 这里的橡皮用白线代替
        this.canvas.freeDrawingBrush.width = toolObj.width;
        this.canvas.freeDrawingBrush.color = 'white';

        this.canvas.isDrawingMode = true;
      }
    },

    // 撤销
    undo() {
      this.isPreventRecordHistory = true;
      if (this.historyArr.length > 1) {
        this.canvas.loadFromJSON(this.historyArr[this.historyArr.length - 2]);
        this.historyArr.pop();
      }
    },

    // 清空
    empty() {
      this.canvas.loadFromJSON(this.emptyCanvas);
    },

    // 保存图片
    previewImg() {
      this.previewImgTimer = setInterval(() => {
        this.imgPreviewData = this.getImgBase64();
      }, 3000);
    },

    // 获取画布图片base64
    getImgBase64() {
      this.isPreventRecordHistory = true;
      // 去除两个像素边框
      return this.canvas.toDataURL({
        width: this.canvas.width - 2,
        height: this.canvas.height - 2,
        left: 2,
        top: 2,
        format: 'jpeg',
      });
    },

    // 替换这一行
    replaceThisLine() {
      if (this.editor && this.editor.uploadImg) {
        // 清空当前行
        const doc = this.editor.cm.getDoc();
        doc.replaceRange(
          '',
          { line: this.curLineNum, ch: 0 },
          { line: this.curLineNum, ch: this.curLineText.length },
        );

        const imgData = this.getImgBase64();
        this.imgPreviewData = imgData;
        this.editor.uploadImg(imgData);

        this.$emit('close');
      }
    }
  },

  mounted() {
    this.buildCanvas();
    this.previewImg();
  },

  beforeDestroy() {
    clearInterval(this.previewImgTimer);
    if (this.historyArr.length) {
      localStorage.setItem('previousPaint', this.historyArr[this.historyArr.length - 1]);
    }
  }

};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#paint {
  display: flex;
  position: fixed;
  left: $icon-bar-width;
  right: $icon-bar-width;
  bottom: 30px;
  height: 450px;
  border-radius: 4px;
  overflow: hidden;
  z-index: 1000;
  box-shadow: 0px 0px 10px 0px #ddd;
  /* 工具栏 */
  .tools-container {
    display: flex;
    background: rgba(255, 255, 255, 0.3);
    justify-content: space-between;
    align-content: flex-start;
    flex-wrap: wrap;
    width: 200px;
    backdrop-filter: blur(10px);
    padding: 4px;
    box-sizing: border-box;
    /* 替换 */
    .replace {
      flex-shrink: 0;
      flex-basis: 100%;
      flex-grow: 1;
      margin: 4px 0px!important;
      border-radius: 2px!important;
    }
    /* 每个工具 */
    .tool {
      flex-shrink: 0;
      flex-grow: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      width: 30px;
      height: 30px;
      border-radius: 100%;
      margin: 4px;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.8);
      transition: all 0.2s;
      &.active {
        box-shadow: 0px 0px 10px 0px #ccc;
        transition: all 0.2s;
      }
      /* 内部元素 */
      .inner {
        flex-shrink: 0;
        margin-bottom: 4px;
        &.pen {
          border-radius: 100%;
          max-width: 12px;
          max-height: 12px;
          // 填充笔刷
          &.fill {
            border-radius: 0px;
          }
        }
        &.eraser {
          max-width: 12px;
          max-height: 12px;
          background: rgb(236, 230, 230);
        }
      }
      .tool-name {
        color: #999;
        font-size: 8px;
      }
    }
  }
  /* 画板容器 */
  .canvas-container {
    flex-grow: 1;
    height: 400px;
    overflow: auto;
    background: #f6f6f6;
    padding: 30px;
    #canvas {
      background: #fff;
    }
  }
  /* 预览图片 */
  .img-preview {
    width: 140px;
    height: 140px;
    overflow: hidden;
    background: #fff;
    position: absolute;
    right: 10px;
    top: 10px;
    z-index: 10;
    border-radius: 8px;
    box-shadow: 0px 0px 10px 0px #ddd;
    img {
      width: 100%;
      height: 100%;
    }
  }

}
</style>
