<template>
  <div id="batch">
    <div class="operations">
      <div
        :class="['operation', opeartionName]"
        v-for="(opeartionName, opeartionId, index) in operations"
        :key="opeartionId"
        @click="runOperation(opeartionId)"
      >
       {{index + 1}}. {{opeartionName}}
      </div>
    </div>
  </div>
</template>
<script>
import tools from '@/tools/tools';

const opeartionKeys = {
  ADD_LIST_MARK: 'ADD_LIST_MARK',
  CHANGE_LIST_MARK_1: 'CHANGE_LIST_MARK_1',
  CHANGE_LIST_MARK_2: 'CHANGE_LIST_MARK_2',
  CHANGE_LIST_MARK_3: 'CHANGE_LIST_MARK_3',
  CHANGE_LIST_MARK_4: 'CHANGE_LIST_MARK_4',
  CHANGE_LIST_MARK_5: 'CHANGE_LIST_MARK_5',
  CHANGE_LIST_MARK_6: 'CHANGE_LIST_MARK_6',
  CHANGE_LIST_MARK_7: 'CHANGE_LIST_MARK_7',
  TRUNCATED_FROM_FIRST_COLON: 'TRUNCATED_FROM_FIRST_COLON',
  TRUNCATED_FROM_FRIST_SEMICOLON: 'TRUNCATED_FROM_FRIST_SEMICOLON',
  TRUNCATED_FROM_SEMICOLON: 'TRUNCATED_FROM_SEMICOLON',
  TRUNCATED_FROM_FIRST_PUNCTUATION: 'TRUNCATED_FROM_FIRST_PUNCTUATION',
  TRUNCATED_FROM_FIRST_PERIOD: 'TRUNCATED_FROM_FIRST_PERIOD',
  TRUNCATED_FROM_PERIOD: 'TRUNCATED_FROM_PERIOD',
  TRUNCATED_FROM_LIST_MARK_1: 'TRUNCATED_FROM_LIST_MARK_1',
  TRUNCATED_FROM_LIST_MARK_2: 'TRUNCATED_FROM_LIST_MARK_2',
  TRUNCATED_FROM_LIST_MARK_3: 'TRUNCATED_FROM_LIST_MARK_3',
  REMOVE_TRAILING_PUNCTUATION: 'REMOVE_TRAILING_PUNCTUATION',
  TRIM: 'TRIM',
  REMOVE_EMPTY_LINE: '清楚空行',
};

export default {
  name: 'batch',
  data() {
    return {
      editor: null,
      operations: {
        [opeartionKeys.ADD_LIST_MARK]: '给光标所在的标题下的内容添加序号①②③',
        separator3: 'separator',
        [opeartionKeys.CHANGE_LIST_MARK_1]: '把（1）替换为1. ',
        [opeartionKeys.CHANGE_LIST_MARK_7]: '把(1)替换为1. ',
        [opeartionKeys.CHANGE_LIST_MARK_2]: '把（一）替换为1. ',
        [opeartionKeys.CHANGE_LIST_MARK_5]: '把1）替换为1. ',
        [opeartionKeys.CHANGE_LIST_MARK_3]: '把a.替换为1. ',
        [opeartionKeys.CHANGE_LIST_MARK_4]: '把①替换为1. ',
        [opeartionKeys.CHANGE_LIST_MARK_6]: '把1.替换为1. ',
        separator1: 'separator',
        [opeartionKeys.TRUNCATED_FROM_FIRST_COLON]: '从第一个：处换行(不保留冒号)',
        [opeartionKeys.TRUNCATED_FROM_FRIST_SEMICOLON]: '从第一个；处换行(不保留分号)',
        [opeartionKeys.TRUNCATED_FROM_SEMICOLON]: '从所有；处换行(不保留分号)',
        [opeartionKeys.TRUNCATED_FROM_FIRST_PUNCTUATION]: '从第一个标点处处换行(不保留标点)',
        [opeartionKeys.TRUNCATED_FROM_FIRST_PERIOD]: '从第一个。处换行(不保留标点)',
        [opeartionKeys.TRUNCATED_FROM_PERIOD]: '从所有。处换行(不保留句号)',
        [opeartionKeys.TRUNCATED_FROM_LIST_MARK_1]: '从（1）处换行',
        [opeartionKeys.TRUNCATED_FROM_LIST_MARK_2]: '从(1)处换行',
        [opeartionKeys.TRUNCATED_FROM_LIST_MARK_3]: '从①处换行',
        separator2: 'separator',
        // [opeartionKeys.REMOVE_TRAILING_PUNCTUATION]: '去除句末标点',
        [opeartionKeys.TRIM]: '清理首尾空格',
        [opeartionKeys.REMOVE_EMPTY_LINE]: '清除空行'
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
    runOperation(key) {
      // 获取要修改的文本
      if (!this.editor) return;
      const doc = this.editor.cm.getDoc();
      const selection = doc.getSelection();
      if (!selection && key !== opeartionKeys.ADD_LIST_MARK) {
        this.editor.messager.warning('请先用鼠标框选要修改的文本');
        return;
      }
      let selectionLines = selection.split('\n');

      // 修改
      switch (key) {
        // 给当前标题内容添加需要
        case opeartionKeys.ADD_LIST_MARK: {
          const startLineNum = doc.getCursor().line;
          const endLineNum = this.editor.getHeaderEndAtLineNum(startLineNum);
          const endLineText = doc.getLine(endLineNum);
          doc.setSelection({ line: startLineNum, ch: 0 }, { line: endLineNum, ch: endLineText.length });
          selectionLines = doc.getSelection().split('\n');

          const newText = selectionLines
            .map((line, index) => {
              line += ' ';
              line += tools.indexMark[(index + 1)];
              return line;
            })
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 把（1）替换为1.
        case opeartionKeys.CHANGE_LIST_MARK_1: {
          const newText = selectionLines
            .map(line => line.replace(/（(\d)）\s*/, '$1. '))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 把(1)替换为1.
        case opeartionKeys.CHANGE_LIST_MARK_7: {
          const newText = selectionLines
            .map(line => line.replace(/\((\d)\)\s*/, '$1. '))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 把（一）替换为1.
        case opeartionKeys.CHANGE_LIST_MARK_2: {
          const newText = selectionLines
            .map(line => line.replace(/（[一二三四五六七八九十]+）\s*/, '1. '))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 把a.替换为1.
        case opeartionKeys.CHANGE_LIST_MARK_3: {
          const newText = selectionLines
            .map(line => line.replace(/[a-zA-Z]\.*\s*/, '1. '))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 把①替换为1.
        case opeartionKeys.CHANGE_LIST_MARK_4: {
          const newText = selectionLines
            .map(line => line.replace(/[①②③④⑤⑥⑦⑧⑨⑩]\.*\s*/, '1. '))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 把1）替换为1.
        case opeartionKeys.CHANGE_LIST_MARK_5: {
          const newText = selectionLines
            .map(line => line.replace(/(\d)）\s*/, '$1. '))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 把1.替换为1.
        case opeartionKeys.CHANGE_LIST_MARK_6: {
          const newText = selectionLines
            .map(line => line.replace(/(\d)./, '$1. '))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 从第一个：处截断(不保留冒号)
        case opeartionKeys.TRUNCATED_FROM_FIRST_COLON: {
          const newText = selectionLines
            .map(line => line.replace(/：|:|: /, '\n'))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 从第一个; 处截断(不保留分号)
        case opeartionKeys.TRUNCATED_FROM_FRIST_SEMICOLON: {
          const newText = selectionLines
            .map(line => line.replace(/；|;|; /, '\n'))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 从所有; 处截断(不保留分号)
        case opeartionKeys.TRUNCATED_FROM_SEMICOLON: {
          const newText = selectionLines
            .map(line => line.replace(/；|;|; /g, '\n'))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 从第一个。处换行(不保留标点)
        case opeartionKeys.TRUNCATED_FROM_FIRST_PERIOD: {
          const newText = selectionLines
            .map(line => line.replace(/。/, '\n'))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 从所有。处换行(不保留标点)
        case opeartionKeys.TRUNCATED_FROM_PERIOD: {
          const newText = selectionLines
            .map(line => line.replace(/。/g, '\n'))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 从第一个标点处处换行(不保留标点)
        case opeartionKeys.TRUNCATED_FROM_FIRST_PUNCTUATION: {
          const newText = selectionLines
            .map(line => line.replace(/；|;|; |，|,|, |。|：|:|: /, '\n'))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 从（1）处换行(不保留标点)
        case opeartionKeys.TRUNCATED_FROM_LIST_MARK_1: {
          const newText = selectionLines
            .map(line => line.replace(/(（\d）\s*)/g, '\n$1'))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }
        // 从(1)处换行(不保留标点)
        case opeartionKeys.TRUNCATED_FROM_LIST_MARK_2: {
          const newText = selectionLines
            .map(line => line.replace(/(\(\d\)\s*)/g, '\n$1'))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 从①处换行(不保留标点)
        case opeartionKeys.TRUNCATED_FROM_LIST_MARK_3: {
          const newText = selectionLines
            .map(line => line.replace(/[①②③④⑤⑥⑦⑧⑨⑩]/g, '\n1. '))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 清理首尾空格
        case opeartionKeys.TRIM: {
          const newText = selectionLines
            .map(line => line.trim())
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 清理首尾空格
        case opeartionKeys.REMOVE_EMPTY_LINE: {
          const newText = selectionLines
            .filter(line => line)
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // '去除句末标点'
        case opeartionKeys.REMOVE_TRAILING_PUNCTUATION:
          break;
        default:
          break;
      }
    }
  },

  created() {
  },

  destroyed() {
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#batch {
  .operations {
    /* 操作符 */
    .operation {
      width: fit-content;
      background: $sidebar-button-bg;
      padding: 4px;
      margin: 4px;
      border-radius: 4px;
      cursor: pointer;
      &:hover {
        background: $sidebar-item-hover-bg;
      }
      /* 分隔符 */
      &.separator {
        width: 100%;
        height: 0px;
        border-bottom: 2px dashed #ccc;
        margin: 0;
        padding: 0;
        background: transparent;
        color: transparent;
        border-radius: 0;
      }
    }

  }
}
</style>
