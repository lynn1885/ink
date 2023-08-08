<template>
  <div id="ink-table">
    <div class="table-container" v-for="(tableData, tableName) in tables" :key="tableName">
      <div class="table-name">
        {{ tableName }}
        <span class="create-row ink-button" @click="createNewRow(tableData)">创建新行</span>
      </div>
      <el-table
        :data="tableData"
        style="width: 100%"
        size="medium"
        stripe
        border
        max-height="500"
        @cell-click="gotoThisLine"
      >
        <el-table-column
          v-for="colName in tableData._tableColName"
          :prop="colName"
          :label="colName"
          :key="colName"
          :fixed="colName === '序号' || colName === '标题'"
          :min-width="tableData._tableColStyle[colName] && tableData._tableColStyle[colName].width"
          :sortable="true"
        />
        <!-- <el-table-column
          v-for="header in tableData"
          :prop="header.lineText"
          :label="header.lineText"
          :key="header.lineNum"
          :min-width="width"
        /> -->
      </el-table>
    </div>
  </div>
</template>
<script>
import _ from 'lodash';
import classNames from '@/tools/class-names';

export default {
  name: 'ink-table',
  data() {
    return {
      editor: null,
      changesHandler: null,
      tables: {},
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

    // '$store.state.editor.curCursorLineNum': {
    //   immediate: true,
    //   handler(value) {
    //     if (value) {
    //       this.getHeader(value);
    //     }
    //   },
    // },

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
      this.buildTable();
      this.changesHandler = _.debounce(this.buildTable, 1000);
      this.editor.on('changes', this.changesHandler);
    },

    // 获取标题
    // getHeader(lineNum) {
    //   const headers = this.editor.getHeaderAncestors({
    //     line: lineNum, ch: 0
    //   });

    //   const cursorHeader = headers[0];

    //   if (!cursorHeader) return;

    //   cursorHeader.cursorLineNum = lineNum;

    //   if (this.headers.length === 0) {
    //     this.headers.push(cursorHeader);
    //     cursorHeader.text = this._concatHeader(headers);
    //   } else {
    //     const lastHeader = this.headers[this.headers.length - 1];
    //     if (lastHeader.headerLineNum !== cursorHeader.headerLineNum) {
    //       cursorHeader.text = this._concatHeader(headers);
    //       this.headers.push(cursorHeader);
    //     } else {
    //       lastHeader.cursorLineNum = lineNum;
    //       lastHeader.text = this._concatHeader(headers);
    //     }
    //   }

    //   if (this.headers.length > 10) {
    //     this.headers.shift();
    //   }
    // },

    // 获取标签
    buildTable() {
      // 获取tag
      const tags = this.editor.getTags('TAG2LINENUM');

      // 清空表格
      this.tables = {};

      // 过滤出table tag
      for (const tagName in tags) {
        const tagInfo = tags[tagName];

        if (tagName.startsWith('表格')) {
          const tableStr = this.editor.getHeaderContent(tagInfo.lineNum);
          const tableHier = this.editor.getHeadersHierarchy(tableStr, undefined, true);
          // const rows = this.editor.getHeaderContent(tagInfo.lineNum, 2, false, 'arr');
          // const tableAttributes = ['标题'];

          // 创建新表
          const tableName = tableHier[0].textWithoutHeader.split('`')[0].trim();
          if (!this.tables[tableName]) this.$set(this.tables, tableName, []);

          const tableData = this.tables[tableName];
          const tableColName = ['序号', '标题'];
          const tableColStyle = {};
          let i = 0;

          tableData._lineNum = tagInfo.lineNum;

          // 填充表内容
          for (const row of tableHier[0].children) {
            // 处理标题
            const rowContent = {
              序号: i,
              标题: row.textWithoutHeader,
              _lineNums: {
                标题: tagInfo.lineNum + row.lineNum
              }
            };

            // 处理表属性
            if (row.textWithoutHeader === '表属性') {
              for (const cell of row.children) {
                tableColStyle[cell.textWithoutHeader] = {};
                cell.content.split('\n').forEach((line) => {
                  const [k, v] = line.split(':');
                  if (k && v) {
                    tableColStyle[cell.textWithoutHeader][k.trim()] = v.trim();
                  }
                });
              }

            // 处理表内容
            } else {
              i += 1;
              for (const cell of row.children) {
                tableColName.push(cell.textWithoutHeader.trim());
                rowContent['序号'] = i;
                rowContent[cell.textWithoutHeader] = cell.content;
                // console.log(cell);
                // eslint-disable-next-line prefer-destructuring
                rowContent[cell.textWithoutHeader] = rowContent[cell.textWithoutHeader].split('~')[0]; // 分隔符
                rowContent._lineNums[cell.textWithoutHeader] = tagInfo.lineNum + cell.lineNum;
              }
              tableData.push(rowContent);
            }
          }

          // 添加列名
          this.$set(tableData, '_tableColName', Array.from(new Set(tableColName)));
          this.$set(tableData, '_tableColStyle', tableColStyle);


          // 填充表内容
          // for (const headerObj of rows) {
          //   if (headerObj.isFirstHeader) { // 表标题


          //   } else if (headerObj.lineText.includes('## 表属性')) { // 表属性

          //   } else { // 表内容
          //     const contents = this.editor.getHeaderContent(headerObj.lineNum, 2, false, 'arr');
          //     const newContents = {
          //       标题: '标题'
          //     };
          //     for (const lineKey in contents) {
          //       const lineObj = contents[lineKey];
          //       if (lineObj.isFirstHeader) {
          //         newContents['标题'] = lineObj.textContent;
          //       } else {
          //         newContents[lineObj.lineTextWithoutHeader] = lineObj.textContent;
          //         tableAttributes.push(lineObj.lineTextWithoutHeader);
          //       }
          //     }
          //     tableData.push(newContents);
          //   }
          // }

          // this.$set(tableData, '_tableAttributes', Array.from(new Set(tableAttributes)));
          // console.log(123, tableData);

          // 填充表内容
          // const curLine = {
          //   序号: this.tables[tableName].length + 1,
          //   标题: tagInfo.lineTextWithoutTag.replace(/^# /, '')
          // };

          // // 记录行号
          // curLine._lineNums = {
          //   序号: tagInfo.lineNum,
          //   标题: tagInfo.lineNum,
          // };

          // // 计算表头
          // const _tableHeaders = this.tables[tableName]._tableHeaders || {
          //   序号: '50px',
          //   标题: '150px'
          // };

          // // 继续填充内容
          // let tableText = this.editor.getHeaderContent(tagInfo.lineNum);
          // // 添加行号
          // tableText = tableText
          //   .split('\n')
          //   .map((line, index) => {
          //     if (line.startsWith('## ')) {
          //       return `${line}||||||${tagInfo.lineNum + index}`;
          //     }
          //     return line;
          //   })
          //   .join('\n');


          // const tableSeg = tableText.split(/\n## /g).slice(1);
          // const tablePair = tableSeg.map(item => item.split('\n'));
          // // eslint-disable-next-line no-loop-func
          // tablePair.forEach((segs) => {
          //   const [seg0, headerLineNum] = segs[0].split('||||||');
          //   // eslint-disable-next-line prefer-const
          //   let [header, width] = seg0.split('~');
          //   header = header.trim();

          //   curLine[header] = segs.slice(1).join('\n');
          //   // eslint-disable-next-line prefer-destructuring
          //   curLine[header] = curLine[header].split('\n~\n')[0];
          //   curLine._lineNums[header] = Number(headerLineNum);

          //   if (width) _tableHeaders[header] = width;
          //   if (!_tableHeaders[header]) _tableHeaders[header] = '120px'; // ⭐ 各列默认宽度
          // });

          // // 写入该行
          // this.tables[tableName].push(curLine);
          // this.$set(this.tables[tableName], '_tableHeaders', _tableHeaders);
        }
      }
    },

    // 跳转
    gotoThisLine(row, column) {
      this.editor.scrollNoteToThisLine(row._lineNums[column.property], classNames.highlightLineClass, 'unfoldAll', true);
    },

    createNewRow(tableData) {
      let endLineNum = this.editor.getHeaderEndAtLineNum(tableData._lineNum);

      if (endLineNum) {
        endLineNum += 1;
        let str = '## 标题\n';
        tableData._tableColName.forEach((colName) => {
          str += `### ${colName}\n`;
        });

        this.editor.cm.getDoc().replaceRange(
          str,
          { line: endLineNum, ch: 0 },
          { line: endLineNum, ch: 0 },
        );
        setTimeout(() => {
          this.editor.cm.setCursor({ line: endLineNum, ch: 0 });
        }, 0);
      }
    }


  },

  beforeDestroy() {
    this.clear();
  },

};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';

#ink-table {
  position: relative;
  width: 100%;
  height: 100%;
  .table-container {
    padding-bottom: 50px;
    padding-right: 20px;
    .table-name {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-bottom: 5px;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
    }
  }

  .create-row {
    margin-left: 10px;
  }

}
</style>

<style>
#ink-table .el-table__row .cell {
  white-space: pre-wrap!important;
  /* text-overflow:  */
  /* overflow: scroll; */
  /* word-wrap: break-word!important; */
}
</style>
