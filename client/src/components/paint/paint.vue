<template>
  <div id="paint">
    <!-- 工具 -->
    <div class="tools-container">
      <!-- 导出 -->
      <div
        class="tool tool-button replace"
        @click="replaceThisLine"
      >
        <div class="tool-name">
          <i class="el-icon-refresh"></i>
          {{isThisAImgLine ? '替换这一行: ' : '在这一行后插入: '}}{{curLineNum}}. {{curLineText}}
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

      <!-- 清空 -->
      <div
        class="tool delete"
        title="双击按钮, 清空画布"
        @click="empty()"
      >
        <i class="el-icon-delete"></i>
        <div class="tool-name">
          清空
        </div>
      </div>
    </div>

    <!-- 画板 -->
    <div class="canvas-container" @dblclick.self="gotoNextMark">
      <div class="numbers">
        <div
          :class="['number', lastMark === mark ? 'active' : '']"
          v-for="(mark, index) of indexMark"
          :key="index"
          @click="changeMark(mark)"
        >
          {{mark}}
        </div>
      </div>
      <canvas
        id="canvas"
        width="1100px"
        height="800px"
        ref="canvas"

      ></canvas>
    </div>

    <!-- 预览 -->
    <!-- <div class="img-preview">
      <img :src="imgPreviewData" ref="img-preview">
    </div> -->

  </div>
</template>
<script>
// fabric基础库
import { fabric } from 'fabric';
import config from '@/config';
import tools from '@/tools/tools';

export default {
  name: 'paint',
  data() {
    return {
      editor: null,
      canvas: null, // 画板
      paintImgName: 'PAINT', // 此画板导出图片的名字
      isThisImgAPaintImg: false, // 标记这是否是一个paint生成的图片
      emptyCanvas: null, // 空画板
      activeToolName: 'penBlack', // 当前激活的工具,
      historyArr: [], // 历史状态
      isPreventRecordHistory: false, // 是否禁用历史记录, 有些操作需要禁用
      imgPreviewData: null, // 预览的图片
      curLineNum: null, // 当前鼠标所在行
      curLineText: '', // 当前鼠标所在行的文字
      startPreviewImgTimer: null, // 预览图片的timer
      isThisAImgLine: false, // 这一行是图片行吗
      indexMark: tools.indexMark,
      markIndex: tools.markIndex,
      lastMark: null, // 上次点击的mark
      curMark: null, // 当前mark
      markTextPair: JSON.parse(JSON.stringify(tools.markEmpty)),
      lastPaintMouseDownTime: 0, // 上次落笔时间戳
      lastPaintMouseDownPos: { x: 0, y: 0 }, // 上次落笔位置
      addMarkTime: [], // 添加mark的耗时
      tools: {
        eraser: {
          width: 20,
          type: 'eraser',
          name: '橡皮'
        },
        penWhite: {
          color: '#fff',
          width: 2,
          name: '白',
          type: 'pen'
        },
        penGray: {
          color: '#aaa',
          width: 2,
          name: '灰',
          type: 'pen'
        },
        penBlack: {
          color: 'black',
          width: 2,
          name: '黑',
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
        penBrown: {
          color: 'rgb(117, 70, 47)',
          width: 2,
          name: '棕',
          type: 'pen'
        },
        penRed: {
          color: 'rgb(255, 93, 82)',
          width: 2,
          name: '红',
          type: 'pen'
        },
        penPink: {
          color: 'rgb(255, 211, 211)',
          width: 2,
          name: '粉',
          type: 'pen'
        },
        penPurple: {
          color: 'rgb(179, 64, 217)',
          width: 2,
          name: '紫',
          type: 'pen'
        },
        penNone: {
          color: '#fff',
          width: 0,
          name: '空',
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
          color: 'rgba(73, 121, 205, 0.6)',
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
        penOpacityBrown: {
          color: 'rgba(117, 70, 47, 0.6)',
          width: 20,
          name: '透棕',
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
          name: '填黑',
          type: 'pen',
          brush: 'fill'
        },
        penFillWhite: {
          color: '#fcfcfc',
          width: 2,
          name: '填白',
          type: 'pen',
          brush: 'fill'
        },
        penFillGray: {
          color: '#aaa',
          width: 2,
          name: '填灰',
          type: 'pen',
          brush: 'fill'
        },
        penFillGreen: {
          color: 'rgb(101, 204, 103)',
          width: 2,
          name: '填绿',
          type: 'pen',
          brush: 'fill'
        },
        penFillCyan: {
          color: 'rgb(154, 255, 255)',
          width: 2,
          name: '填青',
          type: 'pen',
          brush: 'fill'
        },
        penFillBlue: {
          color: 'rgb(153, 204, 253)',
          width: 2,
          name: '填蓝',
          type: 'pen',
          brush: 'fill'
        },
        penFillLightYellow: {
          color: 'rgb(243, 219, 194)',
          width: 2,
          name: '填土',
          type: 'pen',
          brush: 'fill'
        },
        penFillYellow: {
          color: 'rgb(255, 212, 64)',
          width: 2,
          name: '填黄',
          type: 'pen',
          brush: 'fill'
        },
        penFillOrange: {
          color: 'rgb(255, 178, 64)',
          width: 2,
          name: '填橙',
          type: 'pen',
          brush: 'fill'
        },
        penFillBrown: {
          color: 'rgb(117, 70, 47)',
          width: 2,
          name: '填棕',
          type: 'pen',
          brush: 'fill'
        },
        penFillRed: {
          color: 'rgb(255, 153, 153)',
          width: 2,
          name: '填红',
          type: 'pen',
          brush: 'fill'
        },
        penFillPink: {
          color: 'rgb(255, 211, 211)',
          width: 2,
          name: '填粉',
          type: 'pen',
          brush: 'fill'
        },
        penFillPurple: {
          color: 'rgb(203, 152, 255)',
          width: 2,
          name: '填紫',
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
          if (!this.editor) {
            this.editor = value;
            setTimeout(() => {
              this.getOldImg();
            }, 0);
          } else {
            this.$message.warning('暂不支持切换编辑器, 请重新打开画图组件');
          }
        }
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
      this.canvas.freeDrawingBrush.width = 2;
      this.canvas.freeDrawingBrush.color = 'black';


      // 画布上添加图形或使用橡皮擦时, 会触发 after:render 事件，我们在此时保存当前画布状态
      this.canvas.on('after:render', () => {
        if (this.isPreventRecordHistory) {
          this.isPreventRecordHistory = false;
          return;
        }
        this.historyArr.push(JSON.stringify(this.canvas));
        console.log('历史步骤:', this.historyArr.length);
        if (this.historyArr.length > 50) this.historyArr.shift(); // 最多保留50步
      });


      this.canvas.on('mouse:up', (e) => {
        // fill画笔, 起笔自动填充
        const curTool = this.tools[this.activeToolName];
        if (curTool && curTool.type === 'pen' && curTool.brush === 'fill') {
          const objects = this.canvas.getObjects();
          objects[objects.length - 1].fill = curTool.color;
        }
      });

      // 添加mark
      this.canvas.on('mouse:down', (e) => {
        // 双击自动添加
        this.lastPaintMouseDownTime = Date.now();
        this.lastPaintMouseDownPos = e.pointer;

        // 添加mark
        if (this.curMark) {
          this.addMark(e);
        }
      });


      // 添加白底
      const backgroundRect = new fabric.Rect({
        width: this.canvas.width,
        height: this.canvas.height,
        left: 0,
        top: 0,
        fill: '#fff',
        strokeWidth: 0,
        strokeColor: '#fff'
      });
      this.canvas.add(backgroundRect);

      // 记录初始状态
      this.emptyCanvas = JSON.stringify(this.canvas);

      // 恢复旧画布
      const previousPaint = localStorage.getItem('previousPaint');
      if (previousPaint) {
        console.log('恢复');
        this.canvas.loadFromJSON(previousPaint);
      }
    },

    // 添加mark
    addMark(e) {
      try {
        // 统计时间
        const curAddMarkTime = this.inkCommon.plugins['status-bar'].getCurTime();
        this.addMarkTime.push(curAddMarkTime);
        this.editor.messager.success(`本次耗时: ${this.inkCommon.plugins['status-bar'].getCurTime()}s, 平均耗时: ${(this.addMarkTime.reduce((a, b) => a + b) / this.addMarkTime.length).toFixed(1)}s`);
        this.inkCommon.plugins['status-bar'].restartTime();
      } catch (error) {
        console.warn('重设状态栏时间失败', error);
      }

      // 添加①②③...
      const markTextObj = new fabric.Textbox(this.curMark, {
        left: e.pointer.x - 10,
        top: e.pointer.y - 10,
        fontSize: 14,
        fill: 'red',
        paintFirst: 'stroke',
        stroke: '#fff',
        strokeWidth: 1.5
      });
      this.canvas.add(markTextObj);

      // 添加内容
      const lineTextObj = new fabric.Textbox(this.markTextPair[this.curMark] || '', {
        left: e.pointer.x + 10,
        top: e.pointer.y - 10,
        width: 70,
        fontSize: 10,
        fill: '#333',
        paintFirst: 'stroke',
        stroke: '#fff',
        strokeWidth: 1.5
      });
      this.canvas.add(lineTextObj);

      // 恢复画笔
      this.curMark = '';
      setTimeout(() => {
        this.resetTool();
      }, 300);
    },

    // 前往下一个mark
    gotoNextMark() {
      if (!this.lastMark) {
        this.changeMark(this.indexMark[1]);
      } else if (this.lastMark) {
        const key = this.markIndex[this.lastMark];
        if (key) {
          this.changeMark(this.indexMark[key + 1]);
        }
      }
    },

    // 获取光标所在行
    getCursorLine() {
      // 获取光标所在行
      const doc = this.editor.cm.getDoc();
      const cursor = doc.getCursor();
      this.curLineNum = cursor.line;
      this.curLineText = doc.getLine(this.curLineNum);
      doc.setCursor({ line: this.curLineNum, ch: this.curLineText.length });

      // 获取当前标题内容
      const headerContent = this.editor.getHeaderContent(this.curLineNum);
      const headerContentArr = headerContent.split('\n');
      headerContentArr.forEach((line) => {
        const mark = line[line.length - 1];
        this.markTextPair[mark] = line.slice(0, -1).replace(/^#+ /, '').replace(/^[\d]+\. /, '');
      });
    },

    // 获取旧的图片
    getOldImg() {
      const doc = this.editor.cm.getDoc();
      const cursor = doc.getCursor();
      const lineText = doc.getLine(cursor.line);
      if (lineText.startsWith('![')) {
        this.isThisAImgLine = true;
        const matchRes = lineText.match(/!\[(.*?)\]\((.+?)\)/);
        if (matchRes && matchRes.length) {
          const imgName = matchRes[1];
          const imgPath = matchRes[2];
          this.canvas.loadFromJSON(this.emptyCanvas);
          const imgSrc = config.server.staticImagesUrl + imgPath;
          const imgEl = new Image(); // 创建新的图片对象
          imgEl.onload = (e) => { // 图片加载完，再draw 和 toDataURL
            if (e && e.path && e.path[0] && e.path[0].width && e.path[0].height) {
              let { width, height } = e.path[0];
              const imgObj = new fabric.Image(imgEl, {
                left: 0,
                top: 0,
              });
              if (imgName === this.paintImgName) { // 对于此画板生成的图片, 导入时尺寸/2, 因为导出时尺寸会*2
                width /= 2;
                height /= 2;
                imgObj.set({
                  scaleX: 0.5,
                  scaleY: 0.5
                });
                this.isThisImgAPaintImg = true;
              }
              this.canvas.setDimensions({ width, height });
              this.canvas.add(imgObj);
            }
          };
          imgEl.crossOrigin = 'anonymous'; // 设置跨域
          imgEl.src = imgSrc;
        }
      } else {
        this.isThisImgAPaintImg = true;
      }
    },

    // 设置工具
    setTool(toolName, toolObj) {
      this.curMark = null;
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

    // 重设为黑色笔
    resetTool() {
      this.setTool('penBlack', this.tools.penBlack);
    },

    // 设置背景颜色
    setBackgroundColor(toolObj) {
      if (toolObj.color) {
        const objects = this.canvas.getObjects();
        if (objects && objects[0]) {
          this.canvas.getObjects()[0].set('fill', toolObj.color);
          this.canvas.renderAll();
        }
      }
    },

    // 撤销
    undo() {
      this.isPreventRecordHistory = true;
      if (this.historyArr.length > 1) {
        if (this.historyArr[this.historyArr.length - 2]) {
          this.canvas.loadFromJSON(this.historyArr[this.historyArr.length - 2]);
          this.historyArr.pop();
        }
      }
    },

    // 清空
    empty() {
      this.canvas.loadFromJSON(this.emptyCanvas);
    },

    // 保存图片
    startPreviewImg() {
      try {
        this.startPreviewImgTimer = setInterval(() => {
          this.imgPreviewData = this.getImgBase64();
          localStorage.setItem('previousPaint', this.historyArr[this.historyArr.length - 1]);
        }, 3000);
      } catch (error) {
        console.error('预览图像失败', error);
      }
    },

    // 获取画布图片base64
    getImgBase64() {
      this.isPreventRecordHistory = true;
      return this.canvas.toDataURL({
        width: this.canvas.width,
        height: this.canvas.height,
        left: 0,
        top: 0,
        multiplier: this.isThisImgAPaintImg ? 2 : 1, // 本画板生成的图片, 导出时分辨率 * 2
        format: 'jpeg',
      });
    },

    // 替换这一行
    replaceThisLine() {
      if (this.editor && this.editor.uploadImg) {
        const doc = this.editor.cm.getDoc();
        // 如果这一行是图片行, 则清空当前行
        if (this.isThisAImgLine) {
          doc.replaceRange(
            '',
            { line: this.curLineNum, ch: 0 },
            { line: this.curLineNum, ch: this.curLineText.length },
          );
        }

        const imgData = this.getImgBase64();
        this.imgPreviewData = imgData;
        this.editor.uploadImg(imgData, this.isThisImgAPaintImg ? this.paintImgName : '');

        this.$emit('close');
      }
    },

    // 点击mark
    changeMark(mark) {
      this.curMark = mark;
      this.lastMark = mark;
      this.canvas.freeDrawingBrush.width = 0;
      this.canvas.freeDrawingBrush.color = 'white';
    },

  },

  mounted() {
    this.buildCanvas(); // 创建画布
    // this.startPreviewImg(); // 定期显示预览
    this.getCursorLine(); // 获取光标所在行
    this.inkCommon.plugins['status-bar'].restartTime();
  },

  beforeDestroy() {
    clearInterval(this.startPreviewImgTimer);
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
  right: 0;
  bottom: 0;
  height: 440px;
  border-radius: 4px;
  overflow: hidden;
  z-index: 1000;
  box-shadow: 0px 0px 10px 0px #ddd;
  /* 工具栏 */
  .tools-container {
    display: flex;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    justify-content: space-between;
    align-content: flex-start;
    flex-wrap: wrap;
    width: 180px;
    padding: 4px;
    box-sizing: border-box;
    /* 替换 */
    .tool-button {
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
      &.delete {
        background: rgb(246, 159, 159);
        i, div{
         color: #fff
        }
      }
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
    padding: 40px 60px;
    position: relative;
    /* 数字 */
    .numbers {
      display: flex;
      position: fixed;
      align-items: center;
      background: #fff;
      box-shadow: 0px 0px 4px 0px #eee;
      height: 30px;
      border-radius: 6px;
      overflow: hidden;
      margin-top: -35px;
      width: fit-content;
      z-index: 10;
      .number  {
        padding: 4px;
        border-right: 1px solid #eee;
        cursor: pointer;
        transition: all 0.2s;
        border-radius: 2px;
        &.active {
          background: $sidebar-item-active-bg;
          transition: all 0.2s;
        }
      }
    }
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
    top: 30px;
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
