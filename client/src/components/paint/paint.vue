<template>
  <div id="paint">
    <!-- 工具 -->
    <div class="tools-container">
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

      <!-- 画笔 -->
      <div
        :class="['tool', activeToolName === toolName ? 'active' : '']"
        v-for="(toolObj, toolName) of tools"
        :key="toolName"
        @click="setTool(toolName, toolObj)"
      >
        <div
          :class="['inner', toolObj.type]"
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
        height="1000px"
        ref="canvas"
      ></canvas>
    </div>

    <!-- 预览 -->
    <div class="img-preview">
      <img :src="imgPreviewData">
    </div>

  </div>
</template>
<script>
// fabric基础库
import { fabric } from 'fabric';

export default {
  name: 'paint',
  data() {
    return {
      editor: null,
      canvas: null, // 画板
      activeToolName: 'pen1', // 当前激活的工具,
      historyArr: [], // 历史状态
      isPreventRecordHistory: false, // 是否禁用历史记录, 有些操作需要禁用
      imgPreviewData: null, // 预览的图片
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
          color: 'rgba(0, 0, 0, 0.3)',
          width: 20,
          name: '透黑',
          type: 'pen'
        },
        penOpacityBigGray: {
          color: 'rgba(120, 120, 120, 0.3)',
          width: 20,
          name: '透灰',
          type: 'pen'
        },
        penOpacityGreen: {
          color: 'rgba(39, 169, 59, 0.3)',
          width: 20,
          name: '透绿',
          type: 'pen'
        },
        penOpacityCyan: {
          color: 'rgb(67, 254, 245, 0.3)',
          width: 20,
          name: '透青',
          type: 'pen'
        },
        penOpacityBlue: {
          color: 'rgba(73, 121, 255, 0.3)',
          width: 20,
          name: '透蓝',
          type: 'pen'
        },
        penOpacityYellow: {
          color: 'rgba(255, 212, 64, 0.3)',
          width: 20,
          name: '透黄',
          type: 'pen'
        },
        penOpacityOrange: {
          color: 'rgba(255, 178, 64, 0.3)',
          width: 20,
          name: '透橙',
          type: 'pen'
        },
        penOpacityRed: {
          color: 'rgba(255, 93, 82, 0.3)',
          width: 20,
          name: '透红',
          type: 'pen'
        },
        penOpacityPurple: {
          color: 'rgba(179, 64, 217, 0.3)',
          width: 20,
          name: '透紫',
          type: 'pen'
        }
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
        }
      },
    },
  },

  methods: {
    buildCanvas() {
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
        console.log(this.historyArr.length);
        if (this.historyArr.length > 50) this.historyArr.shift(); // 最多保留50步
      });

      // 添加白底
      const backgroundRect = new fabric.Rect({
        width: this.canvas.width,
        height: this.canvas.height,
        left: 0,
        top: 0,
        fill: '#fff',
      });
      // 绘制矩形
      this.canvas.add(backgroundRect);
    },

    // 设置工具
    setTool(toolName, toolObj) {
      this.activeToolName = toolName;
      // 设置笔
      if (toolObj.type === 'pen') {
        switch (toolObj.brush) {
          // 粉笔
          case 'crayon':

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

    // 保存图片
    previewImg() {
      setInterval(() => {
        this.isPreventRecordHistory = true;
        // 去除两个像素编创
        const imgData = this.canvas.toDataURL({
          width: this.canvas.width - 2,
          height: this.canvas.height - 2,
          left: 2,
          top: 2,
          format: 'jpeg',
        });
        this.imgPreviewData = imgData;
      }, 3000);
    }
  },

  mounted() {
    this.buildCanvas();
    this.previewImg();
  },

  destroyed() {
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#paint {
  display: flex;
  position: fixed;
  left: $icon-bar-width;
  right: $icon-bar-width;
  bottom: $icon-bar-width;
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
    /* 每个工具 */
    .tool {
      flex-shrink: 0;
      flex-grow: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      width: 40px;
      height: 40px;
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
          max-width: 15px;
          max-height: 15px;
        }
        &.eraser {
          max-width: 15px;
          max-height: 15px;
          background: rgb(236, 230, 230);
        }
      }
      .tool-name {
        color: #999;
        font-size: 10px;
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
