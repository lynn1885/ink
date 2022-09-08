<template>
  <div id="batch">
    <div class="operations">
      <div
        :class="['operation', opeartion.title]"
        v-for="(opeartion, opeartionId, index) in operations"
        :key="opeartionId"
        @click="runOperation(opeartionId)"
      >
       {{index + 1}}. {{opeartion.title}}
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
  TRUNCATED_FROM_COMMA: 'TRUNCATED_FROM_COMMA',
  TRUNCATED_FROM_FIRST_PUNCTUATION: 'TRUNCATED_FROM_FIRST_PUNCTUATION',
  TRUNCATED_FROM_FIRST_PERIOD: 'TRUNCATED_FROM_FIRST_PERIOD',
  TRUNCATED_FROM_PERIOD: 'TRUNCATED_FROM_PERIOD',
  TRUNCATED_FROM_LIST_MARK_1: 'TRUNCATED_FROM_LIST_MARK_1',
  TRUNCATED_FROM_LIST_MARK_2: 'TRUNCATED_FROM_LIST_MARK_2',
  TRUNCATED_FROM_LIST_MARK_3: 'TRUNCATED_FROM_LIST_MARK_3',
  REMOVE_TRAILING_PUNCTUATION: 'REMOVE_TRAILING_PUNCTUATION',
  TRIM: 'TRIM',
  REMOVE_EMPTY_LINE: 'REMOVE_EMPTY_LINE',
  MULTI_EMPTY_LINE_2_ONE_EMPTY_LINE: 'MULTI_EMPTY_LINE_2_ONE_EMPTY_LINE',
  REMOVE_LINE_BREAK: 'REMOVE_LINE_BREAK',
  REMOVE_CURLEVEL_END_PUNCTUATION: 'REMOVE_CURLEVEL_END_PUNCTUATION',
  REMOVE_CHINESE_EMPTY: 'REMOVE_CHINESE_EMPTY',
  ADD_LINE_AFTER_IMG: 'ADD_LINE_AFTER_IMG',
  COPY_SUBLEVEL_HEADER_1: 'COPY_SUBLEVEL_HEADER_1',
  COPY_HEADERS_3_FLAT: 'COPY_HEADERS_3_FLAT',
  ADD_TODO: 'ADD_TODO',
  ADD_IMPORTANT: 'ADD_IMPORTANT',
};

export default {
  name: 'batch',
  data() {
    return {
      editor: null,
      operations: {
        [opeartionKeys.ADD_LIST_MARK]: {
          title: '给光标所在的标题下的内容添加序号①②③',
          isNeedSelection: false,
          isNeedCursorInAHeaderLine: true
        },
        separator1: { title: 'separator' },
        [opeartionKeys.CHANGE_LIST_MARK_1]: { title: '把（1）替换为1. ', isNeedSelection: true },
        [opeartionKeys.CHANGE_LIST_MARK_7]: { title: '把(1)替换为1. ', isNeedSelection: true },
        [opeartionKeys.CHANGE_LIST_MARK_2]: { title: '把（一）替换为1. ', isNeedSelection: true },
        [opeartionKeys.CHANGE_LIST_MARK_5]: { title: '把1）替换为1. ', isNeedSelection: true },
        [opeartionKeys.CHANGE_LIST_MARK_3]: { title: '把a.替换为1. ', isNeedSelection: true },
        [opeartionKeys.CHANGE_LIST_MARK_4]: { title: '把①替换为1. ', isNeedSelection: true },
        [opeartionKeys.CHANGE_LIST_MARK_6]: { title: '把1.替换为1. ', isNeedSelection: true },
        separator2: { title: 'separator' },
        [opeartionKeys.TRUNCATED_FROM_FIRST_COLON]: { title: '从第一个：处换行(不保留冒号)', isNeedSelection: true },
        [opeartionKeys.TRUNCATED_FROM_FRIST_SEMICOLON]: { title: '从第一个；处换行(不保留分号)', isNeedSelection: true },
        [opeartionKeys.TRUNCATED_FROM_FIRST_PERIOD]: { title: '从第一个。处换行(不保留标点)', isNeedSelection: true },
        [opeartionKeys.TRUNCATED_FROM_FIRST_PUNCTUATION]: { title: '从第一个标点处处换行(不保留标点)', isNeedSelection: true },
        [opeartionKeys.TRUNCATED_FROM_COMMA]: { title: '从所有，处换行(不保留逗号)', isNeedSelection: true },
        [opeartionKeys.TRUNCATED_FROM_SEMICOLON]: { title: '从所有；处换行(不保留分号)', isNeedSelection: true },
        [opeartionKeys.TRUNCATED_FROM_PERIOD]: { title: '从所有。处换行(不保留句号)', isNeedSelection: true },
        [opeartionKeys.TRUNCATED_FROM_LIST_MARK_1]: { title: '从（1）处换行', isNeedSelection: true },
        [opeartionKeys.TRUNCATED_FROM_LIST_MARK_2]: { title: '从(1)处换行', isNeedSelection: true },
        [opeartionKeys.TRUNCATED_FROM_LIST_MARK_3]: { title: '从①处换行', isNeedSelection: true },
        separator3: { title: 'separator' },
        [opeartionKeys.TRIM]: { title: '清理首尾空格', isNeedSelection: true },
        [opeartionKeys.REMOVE_EMPTY_LINE]: { title: '清除空行', isNeedSelection: true },
        [opeartionKeys.REMOVE_LINE_BREAK]: { title: '清除换行, 变为一行', isNeedSelection: true },
        [opeartionKeys.MULTI_EMPTY_LINE_2_ONE_EMPTY_LINE]: { title: '多行空行变一行空行', isNeedSelection: true },
        [opeartionKeys.REMOVE_CHINESE_EMPTY]: { title: '移除中文之间的空格', isNeedSelection: true },
        [opeartionKeys.ADD_LINE_AFTER_IMG]: { title: '🖼️在图片后添加空行', isNeedSelection: true },
        separator4: { title: 'separator' },
        [opeartionKeys.ADD_TODO]: { title: '添加待办TODO', isNeedSelection: true },
        [opeartionKeys.ADD_IMPORTANT]: { title: '添加重点⭐', isNeedSelection: true },
        separator5: { title: 'separator' },
        [opeartionKeys.COPY_SUBLEVEL_HEADER_1]: {
          title: '提取当前等级标题 + 下一级标题',
          isNeedSelection: false,
          isNeedCursorInAHeaderLine: true
        },
        [opeartionKeys.REMOVE_CURLEVEL_END_PUNCTUATION]: {
          title: '移除当前等级标题末尾的标点',
          isNeedSelection: false,
          isNeedCursorInAHeaderLine: true
        },
        [opeartionKeys.COPY_HEADERS_3_FLAT]: {
          title: '提取前 3 级标题, 并压平层级',
          isNeedSelection: false,
          isNeedCursorInAHeaderLine: false
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
        }
      },
    },
  },

  methods: {
    runOperation(key) {
      // 获取要修改的文本
      if (!this.editor) return;
      const doc = this.editor.cm.getDoc();
      const cursor = doc.getCursor();
      const selection = doc.getSelection();
      let selectionLines;
      if (selection) {
        selectionLines = selection.split('\n');
      }
      // 检查是否框选了文本
      if (this.operations[key].isNeedSelection && !selectionLines) {
        this.editor.messager.warning('请先用鼠标框选要修改的文本');
        return;
      }

      // 检查光标是否位于标题行
      if (this.operations[key].isNeedCursorInAHeaderLine && (!cursor.line || !this.editor.isThisLineAHeader(cursor.line))) {
        this.editor.messager.warning('请将光标放在要处理的标题行');
        return;
      }

      // 修改
      switch (key) {
        // 给当前标题内容添加需要
        case opeartionKeys.ADD_LIST_MARK: {
          const startLineNum = doc.getCursor().line;
          const endLineNum = this.editor.getHeaderEndAtLineNum(startLineNum);
          const endLineText = doc.getLine(endLineNum);
          doc.setSelection(
            { line: startLineNum, ch: 0 },
            { line: endLineNum, ch: endLineText.length }
          );
          selectionLines = doc.getSelection().split('\n');

          const marks = Object.keys(tools.markIndex);
          const markReg = new RegExp(`\\s+[${marks.join('')}]$`);
          let i = 0;
          const newText = selectionLines
            .map((line) => {
              if (line && !line.startsWith('>') && !line.startsWith('![')) {
                line = line.trim();
                i += 1;
                line = line.replace(markReg, '');
                line += ' ';
                line += tools.indexMark[(i)];
              }
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

        // 从所有，处换行(不保留标点)
        case opeartionKeys.TRUNCATED_FROM_COMMA: {
          const newText = selectionLines
            .map(line => line.replace(/，/g, '\n'))
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

        // 清理空格
        case opeartionKeys.REMOVE_EMPTY_LINE: {
          const newText = selectionLines
            .filter(line => line)
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 清理换行, 变成一行
        case opeartionKeys.REMOVE_LINE_BREAK: {
          const newText = selectionLines
            .filter(line => line)
            .join('');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 多行空行变一行空行
        case opeartionKeys.MULTI_EMPTY_LINE_2_ONE_EMPTY_LINE: {
          doc.replaceSelection(selectionLines.join('\n').replace(/\n{3,}/g, '\n\n'), 'around');
          break;
        }

        // 移除中文空格
        case opeartionKeys.REMOVE_CHINESE_EMPTY: {
          const newText = selectionLines
            .map(line => line.replace(/(?<=[\u4e00-\u9fa5])(\s+)(?=[\u4e00-\u9fa5])/g, ''))
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        // 在img后添加空行
        case opeartionKeys.ADD_LINE_AFTER_IMG: {
          let newText = '';
          let i = 0;
          selectionLines.forEach((line, index) => {
            if (this.editor.getLineImgInfo(line) && this.editor.getHeaderLvByStr(selectionLines[index + 1])) {
              // console.log(line, 123, selectionLines[index + 1]);
              newText += line;
              newText += '\n\n';
              i += 1;
            } else {
              newText += line;
              newText += '\n';
            }
          });

          doc.replaceSelection(newText, 'around');
          this.$message.success(`已添加 ${i} 行`);
          break;
        }

        // 添加todo
        case opeartionKeys.ADD_TODO: {
          const newText = selectionLines
            .map(line => `TODO ${line}`)
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }


        // 添加重点
        case opeartionKeys.ADD_IMPORTANT: {
          const newText = selectionLines
            .map(line => `⭐ ${line}`)
            .join('\n');
          doc.replaceSelection(newText, 'around');
          break;
        }

        case opeartionKeys.COPY_SUBLEVEL_HEADER_1: {
          const content = this.editor.getHeaderContent(cursor.line, 2);
          tools.copyText(content);
          this.editor.messager.warning('拷贝完成, 请自行粘贴');
          break;
        }

        // 提取所有标题, 并压平
        case opeartionKeys.COPY_HEADERS_3_FLAT: {
          const res = [];
          this.editor.getHeadersArray().forEach((header) => {
            res.push(header.parentHeadersText
              .slice(0, 3)
              .map(text => text.replace(/^#+\s/g, ''))
              .join(' > '));
          });
          tools.copyText(Array.from(new Set(res)).join('\n'));
          this.editor.messager.warning('拷贝完成, 请自行粘贴');
          break;
        }
        default:
          this.editor.messager.warning('尚不支持该操作');
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
      background: rgba($sidebar-button-bg, 0.6);
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
        border-bottom: 2px dashed rgba(200, 200, 200, 0.6);
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
