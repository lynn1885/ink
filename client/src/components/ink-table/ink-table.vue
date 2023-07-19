<template>
  <div id="ink-table">
    <div class="table-container" v-for="(tableData, tableName) in tables" :key="tableName">
      <div class="table-name">{{ tableName }}</div>
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
          v-for="(width, header) in tableData._tableHeaders"
          :prop="header"
          :label="header"
          :key="header"
          :min-width="width"
          :fixed="header == '序号' || header == '标题'"
        />
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
        if (tagInfo.headerLv === 1 && /^表\d+/.exec(tagName)) {
          const tableName = tagName.split('__')[0];
          // 创建新表
          if (!this.tables[tableName]) this.$set(this.tables, tableName, []);

          // 填充表内容
          const curLine = {
            序号: this.tables[tableName].length + 1,
            标题: tagInfo.lineTextWithoutTag.replace(/^# /, '')
          };

          // 记录行号
          curLine._lineNums = {
            序号: tagInfo.lineNum,
            标题: tagInfo.lineNum,
          };

          // 计算表头
          const _tableHeaders = this.tables[tableName]._tableHeaders || {
            序号: '50px',
            标题: '150px'
          };

          // 继续填充内容
          let tableText = this.editor.getHeaderContent(tagInfo.lineNum);
          // 添加行号
          tableText = tableText
            .split('\n')
            .map((line, index) => {
              if (line.startsWith('## ')) {
                return `${line}||||||${tagInfo.lineNum + index}`;
              }
              return line;
            })
            .join('\n');


          const tableSeg = tableText.split(/\n## /g).slice(1);
          const tablePair = tableSeg.map(item => item.split('\n'));
          // eslint-disable-next-line no-loop-func
          tablePair.forEach((segs) => {
            const [seg0, headerLineNum] = segs[0].split('||||||');
            // eslint-disable-next-line prefer-const
            let [header, width] = seg0.split('~');
            header = header.trim();

            curLine[header] = segs.slice(1).join('\n');
            // eslint-disable-next-line prefer-destructuring
            curLine[header] = curLine[header].split('\n~\n')[0];
            curLine._lineNums[header] = Number(headerLineNum);

            if (width) _tableHeaders[header] = width;
            if (!_tableHeaders[header]) _tableHeaders[header] = '120px'; // ⭐ 各列默认宽度
          });

          // 写入该行
          this.tables[tableName].push(curLine);
          this.$set(this.tables[tableName], '_tableHeaders', _tableHeaders);
        }
      }
    },

    // 跳转
    gotoThisLine(row, column) {
      const lineNum = row._lineNums[column.property];
      this.editor.scrollNoteToThisLine(lineNum, classNames.highlightLineClass, 'unfoldAll', true);
    },


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
      padding-bottom: 5px;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
    }
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
