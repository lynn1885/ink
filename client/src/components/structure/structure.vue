<template>
  <div id="structure">
    <!-- 展开 -->
    <div id="expand" class="ink-button" @click="expandLineAll">展开/折叠</div>
    <input
        id="search-bar"
        class="ink-input-bar"
        type="text"
        v-model="searchText"
        :placeholder="'搜索 '+ allTagNum +' 条标签'"
      />

    <!-- 内容 -->
    <div id="content-container">
      <div class="items lv1 cm-header cm-header-1" v-for="(lv1Obj, lv1Name, index) in tags" :key="lv1Name">
        <div v-if="calIsShow([lv1Name], lv1Obj)" :class="{'active': searchText && lv1Name.includes(searchText)}">
            <span class="tag-name" @click="addTag([lv1Name])">{{index+1}}. {{lv1Name}}</span>
            <span class="tag-num button ink-button" @click="expandLine(lv1Name)">{{lv1Obj._lines._allNum}}条</span>
            <span class="rename button ink-button" @click="rename([lv1Name])">重命名</span>
          <div v-if="isShowLines[lv1Name]" class="lines">
            <div class="line-text" @click="gotoThisLine(lineText)" v-for="lineText of lv1Obj._lines" :key="lineText">{{lineText}}</div>
          </div>
        </div>
        <div class="items lv2 cm-header cm-header-2" v-if="lv1Obj._lines" v-for="(lv2Obj, lv2Name, index) in lv1Obj" :key="lv2Name">
          <div v-if="calIsShow([lv1Name, lv2Name], lv2Obj)" :class="{'active': searchText && lv2Name.includes(searchText)}">
              <span class="tag-name" @click="addTag([lv1Name, lv2Name])">{{index}}. {{lv2Name}}</span>
              <span class="tag-num button ink-button" @click="expandLine(lv1Name+lv2Name)">{{lv2Obj._lines._allNum}}条</span>
              <span class="rename button ink-button" @click="rename([lv1Name, lv2Name])">重命名</span>
            <div v-if="isShowLines[lv1Name+lv2Name]" class="lines">
              <div class="line-text" @click="gotoThisLine(lineText)" v-for="lineText of lv2Obj._lines" :key="lineText">{{lineText}}</div>
            </div>
          </div>
          <div class="items lv3 cm-header cm-header-3" v-if="lv2Obj._lines"  v-for="(lv3Obj, lv3Name, index) in lv2Obj" :key="lv3Name">
            <div v-if="calIsShow([lv1Name, lv2Name, lv3Name], lv3Obj)" :class="{'active': searchText && lv3Name.includes(searchText)}">
                <span class="tag-name" @click="addTag([lv1Name, lv2Name, lv3Name])">{{index}}. {{lv3Name}}</span>
                <span class="tag-num button ink-button" @click="expandLine(lv1Name+lv2Name+lv3Name)">{{lv3Obj._lines._allNum}}条</span>
                <span class="rename button ink-button" @click="rename([lv1Name, lv2Name, lv3Name])">重命名</span>
              <div v-if="isShowLines[lv1Name+lv2Name+lv3Name]" class="lines">
                <div class="line-text" @click="gotoThisLine(lineText)" v-for="lineText of lv3Obj._lines" :key="lineText">{{lineText}}</div>
              </div>
            </div>
            <div class="items lv4 cm-header cm-header-4" v-if="lv3Obj._lines"  v-for="(lv4Obj, lv4Name, index) in lv3Obj" :key="lv4Name">
              <div v-if="calIsShow([lv1Name, lv2Name, lv3Name, lv4Name], lv4Obj)" :class="{'active': searchText && lv4Name.includes(searchText)}">
                  <span class="tag-name" @click="addTag([lv1Name, lv2Name, lv3Name, lv4Name])">{{index}}. {{lv4Name}}</span>
                  <span class="tag-num button ink-button" @click="expandLine(lv1Name+lv2Name+lv3Name+lv4Name)">{{lv4Obj._lines._allNum}}条</span>
                  <span class="rename button ink-button" @click="rename([lv1Name, lv2Name,lv3Name, lv4Name])">重命名</span>
                <div v-if="isShowLines[lv1Name+lv2Name+lv3Name+lv4Name]" class="lines">
                  <div class="line-text" @click="gotoThisLine(lineText)" v-for="lineText of lv4Obj._lines" :key="lineText">{{lineText}}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 重命名弹窗 -->
    <el-dialog title="标签重命名" :visible.sync="isShowRename" :append-to-body="true" width="500px" :close-on-click-modal="false">
      <el-form>
        <el-form-item label="旧名字">
          <el-input v-model="oldTagName" autocomplete="off" :disabled="true"></el-input>
        </el-form-item>
        <el-form-item label="新名字">
          <el-input v-model="newTagName" autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelRename">取 消</el-button>
        <el-button type="primary" @click="confirmRename">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import classNames from '@/tools/class-names';
import _ from 'lodash';

export default {
  name: 'structure',
  data() {
    return {
      editor: null,
      tags: {},
      isShowLines: {},
      isShowRename: false,
      oldTagName: '',
      newTagName: '',
      waitThisLine: null,
      searchText: '',
      allTagNum: 0, // 一共多少tag
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
      this.tags = {};
      this.editor.off('changes', this.changesHandler);
    },

    build() {
      this.getTags();
      this.changesHandler = _.debounce(this.getTags, 1000);
      this.editor.on('changes', this.changesHandler);
    },


    // 获取标签
    getTags() {
      const doc = this.editor.cm.getDoc();

      const tags = this.editor.getTags('TAG2LINENUM');

      this.allTagNum = Object.values(tags).length;

      const newTags = {};
      // 过滤标签
      for (let tagName in tags) {
        const tagLine = tags[tagName].lineNum;
        const lineText = doc.getLine(tagLine).replace(/`.+`/g, '');

        if (!tagName) return;
        ([tagName] = tagName.split('__'));
        if (!tagName) return;

        const components = tagName.split('-');
        let [a, b, c, d, e] = components;
        if (components.length > 4) { // 超过4级
          d = components.slice(3).join('-');
        }

        // 创建标题
        if (a && !newTags[a]) newTags[a] = { _lines: [] };
        if (a && !b) newTags[a]._lines.push(`${tagLine} ${lineText}`);
        // eslint-disable-next-line no-unused-expressions
        if (a) newTags[a]._lines._allNum >= 1 ? newTags[a]._lines._allNum += 1 : newTags[a]._lines._allNum = 1;

        if (b && !newTags[a][b]) newTags[a][b] = { _lines: [] };
        if (b && !c) newTags[a][b]._lines.push(`${tagLine} ${lineText}`);
        // eslint-disable-next-line no-unused-expressions
        if (b) newTags[a][b]._lines._allNum >= 1 ? newTags[a][b]._lines._allNum += 1 : newTags[a][b]._lines._allNum = 1;

        if (c && !newTags[a][b][c]) newTags[a][b][c] = { _lines: [] };
        if (c && !d) newTags[a][b][c]._lines.push(`${tagLine} ${lineText}`);
        // eslint-disable-next-line no-unused-expressions
        if (c) newTags[a][b][c]._lines._allNum >= 1 ? newTags[a][b][c]._lines._allNum += 1 : newTags[a][b][c]._lines._allNum = 1;

        if (d && !newTags[a][b][c][d]) newTags[a][b][c][d] = { _lines: [] };
        if (d && !e) newTags[a][b][c][d]._lines.push(`${tagLine} ${lineText}`);
        // eslint-disable-next-line no-unused-expressions
        if (d) newTags[a][b][c][d]._lines._allNum >= 1 ? newTags[a][b][c][d]._lines._allNum += 1 : newTags[a][b][c][d]._lines._allNum = 1;
      }
      // console.log(newTags);
      this.tags = newTags; // 其实是每次清空重建
    },

    // 跳转
    gotoThisLine(lineText) {
      const lineNum = Number(lineText.split(' ')[0]);
      this.editor.scrollNoteToThisLine(lineNum, classNames.highlightLineClass, 'unfoldAll', true);
    },

    gotoThisLineNum(lineNum) {
      this.editor.scrollNoteToThisLine(lineNum, classNames.highlightLineClass, 'unfoldAll', true);
    },

    // 添加标签
    addTag(lvs) {
      const tag = lvs.filter(item => item).join('-');
      // console.log(tag);
      if (tag) {
        this.editor.addTag(null, tag);
        this.$message.success('添加标签成功');
      }
    },

    // 搜索时：计算是否展示标签
    calIsShow(nameArr, lv1Obj) {
      // 这种不展示
      if (nameArr[nameArr.length - 1] === '_lines') return false;

      // 没有搜索时，都展示
      if (!this.searchText) {
        return true;
      }

      // 上级标题出现关键词时，下级标题直接展示
      if (nameArr.join('-').includes(this.searchText)) {
        return true;
      }

      // 上级标题没有出现关键词时，下级标题要进行计算
      let tags = [];
      this._getObjKeysDeep(lv1Obj, tags);
      tags = tags.join('-');
      if (tags.includes(this.searchText)) {
        return true;
      }
      return false;
    },

    // 递归获取obj的key，写入数组
    _getObjKeysDeep(obj, container) {
      for (const key in obj) {
        container.push(key);
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          this._getObjKeysDeep(obj[key], container);
        }
      }
    },

    // 展开、收缩行
    expandLine(objName) {
      this.$set(this.isShowLines, objName, !this.isShowLines[objName]);
    },

    // 展开、收缩所有行
    expandLineAll() {
      let values = Object.values(this.isShowLines);
      if (!values.length) values = 0;
      else values = values.reduce((a, b) => a + b);

      const keys = [];
      for (const lv1 in this.tags) {
        if (lv1 !== '_lines') keys.push(lv1);
        for (const lv2 in this.tags[lv1]) {
          if (lv2 !== '_lines') keys.push(lv1 + lv2);
          for (const lv3 in this.tags[lv1][lv2]) {
            if (lv3 !== '_lines') keys.push(lv1 + lv2 + lv3);
            for (const lv4 in this.tags[lv1][lv2][lv3]) {
              if (lv4 !== '_lines') keys.push(lv1 + lv2 + lv3 + lv4);
            }
          }
        }
      }
      // 有展开，则折叠
      if (values) {
        keys.forEach(key => this.$set(this.isShowLines, key, false));
      } else {
        keys.forEach(key => this.$set(this.isShowLines, key, true));
      }
    },

    // 重命名
    rename(lvs) {
      this.isShowRename = true;
      this.oldTagName = lvs.filter(lv => lv).join('-');
      this.newTagName = this.oldTagName;
      // console.log(this.oldTagName);
    },

    cancelRename() {
      this.isShowRename = false;
      this.oldTagName = '';
      this.newTagName = '';
    },

    confirmRename() {
      if (!this.newTagName || !this.oldTagName) {
        this.$message({
          type: 'warning',
          message: '新旧名字均不能为空',
        });
      } else if (this.newTagName === this.oldTagName) {
        this.$message({
          type: 'warning',
          message: '新旧名字不能相等',
        });
      } else {
        this.isShowRename = false;
        let txt = this.editor.cm.getValue();
        const reg = new RegExp(`\`${this.oldTagName}`, 'g');
        this.waitThisLine = this.editor.getCursorLine();
        // console.log(reg, `\`${this.newTagName}`);
        txt = txt.replace(reg, `\`${this.newTagName}`);
        this.editor.cm.setValue(txt);
        this.oldTagName = '';
        this.newTagName = '';
        this.$message.success('修改标签名成功');
        setTimeout(() => {
          if (this.waitThisLine >= 0) {
            this.gotoThisLineNum(this.waitThisLine);
            this.waitThisLine = null;
          }
        }, 500);
      }
    },

    // // 检索标签
    // searchBarKeyDownHandler(e) {
    //   if (e.keyCode === 13) {
    //     if (isEnableConsole) {
    //       console.log('search: press enter');
    //     }
    //     this.search();
    //   }
    // }
  },

  beforeDestroy() {
    this.clear();
  },

};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#structure {
  height: 100%;
  padding: 4px;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 8px;
  #expand {
    text-align: center;
  }
  #search-bar {
    margin-top: 10px;
  }
  #content-container{
    margin-top: 10px;
    overflow: auto;
  }

  .ink-input-bar {
    flex-grow: 0;
  }
  .items {
    margin-top: 4px;
    .active {
      background: $cm-searched-text-bg;
    }
  }
  // .tag-name {
  //   cursor: pointer;
  // }

  .button {
    padding: 0px 4px;
    padding-top: 0px!important;
    border-radius: 2px;
    margin-left: 4px;
    font-size: 13px;
  }

  .cm-header-2 {
    padding-left: 15px;
  }
  .cm-header-3 {
    padding-left: 15px;
  }

  .cm-header-4 {
    padding-left: 15px;
    color: rgb(135, 42, 135)!important
  }

  .line-text {
    margin-left: 15px;
    border-bottom: 2px dashed $sidebar-item-border-color;
  }

  .fullname {
    font-size: 12px;
    color: #999;
    font-weight: normal;
  }


  .lines {
    color: #333;
    font-size: 13px;
    font-weight: normal!important;
    // display: inline-block;
    cursor: pointer;
  }
}
</style>
