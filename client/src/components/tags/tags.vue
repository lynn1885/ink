<template>
  <div id="tags">
    <!-- 重点标签 -->
    <div class="important-tags">
      <div
        class="tag-item"
        v-for="(info, tagName) in importantTags"
        :key="info.lineNum + tagName"
        @click="gotoThisLine(info.lineNum)"
      >
        <div class="tag-item-text">
          <div class="tag-name">
            {{tagName}}
          </div>
          <div class="line-text">
            {{info.lineTextWithoutTag}}
          </div>
          <div class="delete">
            <i class="el-icon-delete" @click="deleteTag(info)"></i>
          </div>
        </div>

        <div class="tag-line-img" v-if="info.img">
          <img :src="info.img">
        </div>
      </div>
    </div>

    <!-- 临时标签 -->
    <div class="temp-tags">
      <div
        class="tag-item"
        v-for="(info, tagName) in tempTags"
        :key="info.lineNum + tagName"
        @click="gotoThisLine(info.lineNum)"
      >
        <div class="tag-item-text">
          <div class="tag-name">
            {{tagName}}
          </div>
          <div class="line-text">
            {{info.lineTextWithoutTag}}
          </div>
          <div class="delete">
            <i class="el-icon-delete" @click="deleteTag(info)"></i>
          </div>
        </div>
        <div class="tag-line-img" v-if="info.img">
          <img :src="info.img">
        </div>
      </div>
    </div>

    <!-- 工具 -->
    <div class="tools">
      <div class="tool" @click="addTag('临时')">临时</div>
      <div class="tool" @click="addTag('⭐')">⭐</div>
      <div class="tool" @click="addTag('公式定理⭐')">公式定理</div>
      <div class="tool" @click="addTag('概念⭐')">概念</div>
    </div>
  </div>
</template>
<script>
import classNames from '@/tools/class-names';
import _ from 'lodash';

export default {
  name: 'tags',
  data() {
    return {
      editor: null,
      importantTags: {},
      tempTags: {},
      changesHandler: null,
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
    },

  },

  methods: {
    refresh() {
      this.clear();
      this.build();
    },

    clear() {
      this.importantTags = {};
      this.tempTags = {};
      this.editor.off('changes', this.changesHandler);
    },

    build() {
      this.getTags();
      this.changesHandler = _.debounce(this.getTags, 1000);
      this.editor.on('changes', this.changesHandler);
    },

    // 获取标签
    getTags() {
      console.log(123);
      const tags = this.editor.getTags('TAG2LINENUM');

      const importantTags = {};
      const tempTags = {};

      // 过滤标签
      for (const tagName in tags) {
        if (tagName.includes('⭐')) {
          importantTags[tagName] = tags[tagName];
        }

        if (tagName.startsWith('临时')) {
          tempTags[tagName] = tags[tagName];
        }

        const matchRes = tags[tagName].lineText.match(/^!\[(.*?)\]\((.*?)\)/);
        if (matchRes && matchRes.length) {
          tags[tagName].img = this.editor.fileServer.staticImagesUrl + matchRes[2];
        }
      }
      this.importantTags = importantTags;
      this.tempTags = tempTags;
    },

    // 跳转
    gotoThisLine(lineNum) {
      this.editor.scrollNoteToThisLine(lineNum, classNames.highlightLineClass, 'unfoldAll', true);
    },

    // 添加标签
    addTag(tagContent) {
      const cursor = this.editor.cm.getCursor();
      if (!cursor) {
        this.$message.warning('没有找到光标');
        return;
      }
      this.editor.addTag(cursor.line, tagContent);
      this.$message.success('添加标签成功: ', tagContent);
    },

    // 删除tag
    deleteTag(info) {
      this.editor.removeTag(info.lineNum, info.tagName);
      this.$message.success(`删除标签: ${info.tagName}`);
    }
  },

  beforeDestroy() {
    this.clear();
  },

};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#tags {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  /* 重要标签 */
  .important-tags {
    height: 70%;
    overflow: auto;
    border-bottom: 2px dashed $sidebar-item-border-color;
  }

  /* 临时标签 */
  .temp-tags {
    border-bottom: 2px dashed $sidebar-item-border-color;
    flex-grow: 1;
    flex-shrink: 0;
  }

  /* 工具 */
  .tools {
    height: 30px;
    flex-grow: 0;
    display: flex;
    align-items: center;
    .tool {
      background: $sidebar-item-hover-bg;
      padding: 4px;
      margin-left: 4px;
      border-radius: 2px;
      cursor: pointer;
    }
  }

  /* 每个条目 */
  .tag-item {
    padding: 4px;
    cursor: pointer;
    border-bottom: 1px solid $sidebar-item-border-color;
    &:hover {
      background: $sidebar-item-hover-bg;
    }

    /* 文本 */
    .tag-item-text {
      display: flex;
      align-items: center;
      .line-num {
        color: #aaa;
        padding-left: 4px;
      }
      .tag-name {
        flex-shrink: 0;
        padding: 4px;
        margin-right: 4px;
        border-radius: 2px;
        background: $code-bg;
        color: $code-color;
      }
      .line-text {
        flex: 1;
      }
      .delete:hover {
        color: red
      }
    }

    /* 图像 */
    .tag-line-img {
      width: 100%;
      img {
        width: 100%;
      }
    }
  }
}
</style>
