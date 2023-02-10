<template>
  <div id="paper">
    <!-- 选择目录 -->

    <div class="title">选择目录</div>

    <!-- 高亮 -->
    <div id="highlight">
      <div class="title-container">
        <div class="title">高亮</div>
        <div
          class="ink-button text-center"
          @click="refreshHighlight"
        >
          刷新高亮
        </div>
      </div>

      <div
        :class="['ink-button', 'highlight-item', 'english-punctuation', highlightType.englishpunctuation.isActive ? highlightType.englishpunctuation.className:'']"
        @click="changeHighlight(highlightType.englishpunctuation)"
      >
        【蓝色】高亮英文标点,.:;'"()!
      </div>

      <div
        :class="['ink-button', 'highlight-item', 'chinese-punctuation', highlightType.chinesepunctuation.isActive ? highlightType.chinesepunctuation.className:'']"
        @click="changeHighlight(highlightType.chinesepunctuation)"
      >
        【黄色】高亮中文标点，。：；‘’“”（）！
      </div>
      <div
      :class="['ink-button', 'highlight-item', 'space', highlightType.space.isActive ? highlightType.space.className:'']"
        @click="changeHighlight(highlightType.space)"
      >
        【绿色】高亮空白字符
      </div>
    </div>

    <!-- 正文 -->
    <div id="full-text">
      <div class="title">正文</div>
      <div class="ink-button">提取理论</div>
      <div class="ink-button">提取模型</div>
      <div class="ink-button">提取书籍与政策</div>
    </div>

    <!-- 引文 -->
    <div id="reference">
      <div class="title">引文</div>
      <div class="ink-button">提取引文</div>
      <div class="ink-button">获取高被引</div>
    </div>

    <!-- 期刊 -->
    <div id="periodal">
      <div class="title">期刊</div>
      <div class="ink-button">分析期刊特点</div>
    </div>

    <!-- 助手 -->
    <div id="assistant">
      <div class="title">助手</div>
    </div>
  </div>
</template>
<script>

import tools from '@/tools/tools';
import classNames from '@/tools/class-names.js';

const isEnableConsole = false;

export default {
  name: 'search',
  components: {
  },

  data() {
    return {
      editor: null,
      maxHighlightNum: 2000,
      highlightType: { // 高亮
        englishpunctuation: {
          name: 'english-punctuation',
          reg: /[,.:;'"()!]/g,
          className: classNames.searchedTextClassBlue,
          isActive: false,
        },
        chinesepunctuation: {
          name: 'chinese-punctuation',
          reg: /[，。：；‘’“”（）！]/g,
          className: classNames.searchedTextClass,
          isActive: false,
        },
        space: {
          name: 'space',
          reg: /[\s\t]+/g,
          className: classNames.searchedTextClassGreen,
          isActive: false,
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
          if (this.editor) this.clear();
          this.editor = value;
        }
      },
    },

    // eslint-disable-next-line func-names
    '$store.state.curFilePath': {
      immediate: true,
      handler() {
        this.clear();
      },
    },
  },


  methods: {

    // 高亮
    changeHighlight(highlightObj) {
      if (!highlightObj.isActive) {
        highlightObj.isActive = true;
        tools.highlightText(this.editor.cm, highlightObj.reg, highlightObj.className, this.maxHighlightNum, this.$message);
      } else {
        highlightObj.isActive = false;
        tools.unhighlightText(this.editor.cm, highlightObj.className);
      }
    },

    // 取消高亮
    unhighlightAll() {
      Object.values(this.highlightType).map(item => item.className).forEach((cls) => {
        tools.unhighlightText(this.editor.cm, cls);
      });
    },

    refreshHighlight() {
      this.unhighlightAll();
      Object.values(this.highlightType).forEach((highlightObj) => {
        if (highlightObj.isActive) {
          tools.highlightText(this.editor.cm, highlightObj.reg, highlightObj.className, this.maxHighlightNum, this.$message);
        }
      });
    },

    // 清空,
    clear() {
      this.unhighlightAll();
    }
  },
  mounted() {
  },

  destroyed() {
    setTimeout(() => {
      this.clear();
      if (isEnableConsole) {
        console.log('destroyed');
      }
    }, 50);
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#paper {
  .title {
    text-align: center;
    font-weight: bold;
    margin: 2px 6px;
  }

  .title-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }

}

</style>
