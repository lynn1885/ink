<template>
  <ul id="quick-open-bar">
    <li
      :class="{
        'item': true,
        'active': noteDir === curFileDir,
        'fixed': fixedNoteDirs.includes(noteDir),
      }"
      v-show="noteDir"
      :key="noteDir"
      :title="noteDir.slice(0, noteDir.length - 1)"
      v-for="noteDir of allNoteDirs"
      @mousedown="closeNoteByMidBtn($event, noteDir)"
      @click="switchNote($event, noteDir)"
      @dblclick="fixThisNoteDir(noteDir)"
    >
      <note-icon class="note-icon" :icon-name="noteDir.split('/')[2]"></note-icon>
      {{noteDir.split('/')[2]}}
      <span class="whole-dir">{{calWholeDir(noteDir)}}</span>
      <div :class="closeButtonClass" @click="closeNote(noteDir)">×</div>
    </li>
    <li class="add el-icon-plus" @click.ctrl="createPage(true)" @click.exact="createPage(false)" ></li>
    <li class="bar-placeholder"></li>
  </ul>
</template>
<script>
import NoteIcon from '@/components/note-icon/note-icon.vue';

const isEnableConsole = false;

export default {
  name: 'quick-open-bar',
  components: {
    NoteIcon,
  },
  props: {
    editor: null,
    curFilePath: '',
  },
  data() {
    return {
      curFileDir: '',
      curFilePathArr: [],
      fixedNoteDirs: [],
      tempNoteDir: '',
      maxFixedNum: 7,
      closeButtonClass: 'close-button',
    };
  },

  watch: {
    editor: {
      handler(value) {
        if (value) {
          this.editor = value;
          // open api
          this.editor.quickOpenBar = {
            fixThisNoteDir: this.fixThisNoteDir.bind(this),
          };
        }
      },
    },

    curFilePath: {
      handler(value) {
        if (value) {
          if (isEnableConsole) {
            console.log('curFilePath changed:', value);
          }
          const curFilePathArr = this.curFilePath.split('/');
          this.curFilePathArr = curFilePathArr;
          this.curFileDir = `${curFilePathArr[0]}/${curFilePathArr[1]}/${curFilePathArr[2]}/`;
          if (!this.fixedNoteDirs.includes(this.curFileDir)) {
            this.tempNoteDir = this.curFileDir;
          }
        // when open nothing
        } else {
          this.curFileDir = '';
          if (this.tempNoteDir === this.curFileDir) {
            this.tempNoteDir = '';
          }
        }
      },
    },

    // eslint-disable-next-line func-names
    '$store.state.catalog': {
      immediate: true,
      deep: true,
      handler(value) {
        if (value) {
          if (isEnableConsole) {
            console.log('catalog changed:', value);
          }
          // clear fixedNoteDirs
          let { length } = this.fixedNoteDirs;
          for (let i = 0; i < length; i += 1) {
            const dir = this.fixedNoteDirs[i];
            const dirArr = dir.split('/').slice(0, 3);
            let isExist = false;
            if (
              typeof value[dirArr[0]] === 'object' &&
              typeof value[dirArr[0]][dirArr[1]] &&
              typeof value[dirArr[0]][dirArr[1]][dirArr[2]] === 'object'
            ) {
              isExist = true;
            }
            if (!isExist) {
              this.fixedNoteDirs.splice(i, 1);
              length -= 1;
              i -= 1;
              if (isEnableConsole) {
                console.log('remove tab from fixedNoteDirs: ', dir);
              }
            }
          }
          // clear tempNoteDir
          if (this.tempNoteDir) {
            const dirArr = this.tempNoteDir.split('/').slice(0, 3);
            let isExist = false;
            if (
              typeof value[dirArr[0]] === 'object' &&
              typeof value[dirArr[0]][dirArr[1]] &&
              typeof value[dirArr[0]][dirArr[1]][dirArr[2]] === 'object'
            ) {
              isExist = true;
            }
            if (!isExist) {
              if (isEnableConsole) {
                console.log('remove tab: tempNoteDir: ', this.tempNoteDir);
              }
              this.tempNoteDir = '';
            }
          }
        }
      },
    },
  },

  computed: {
    allNoteDirs() {
      const allNoteDirs = this.fixedNoteDirs.slice();
      if (!allNoteDirs.includes(this.tempNoteDir) && this.tempNoteDir) {
        allNoteDirs.push(this.tempNoteDir);
      }
      if (isEnableConsole) {
        console.log('trigger recalculate allNoteDirs: ', allNoteDirs);
      }
      return allNoteDirs;
    },
  },

  methods: {
    async switchNote(e, noteDir) {
      // ⚠️ Avoid being triggered by double click
      // click item, instead of close button
      if (
        noteDir !== this.curFileDir &&
        ![...e.target.classList].includes(this.closeButtonClass)
      ) {
        if (isEnableConsole) {
          console.log('click another tab: ', noteDir);
        }
        await this._changeNote(noteDir);
      }
    },

    closeNoteByMidBtn(e, noteDir) {
      if (e.which === 2 && noteDir) {
        this.closeNote(noteDir);
      }
    },

    async closeNote(noteDir) {
      // Can it still be closed
      if (this.allNoteDirs.length <= 1) {
        this.editor.messager.warning('只剩最后一个标签页, 不能再关闭了。如要退出分屏请点击左侧图标。');
        return;
      }
      // Calculate the dir to open next
      let gotoDir = '';
      if (noteDir !== this.curFileDir) {
        // do nothing
      } else {
        const id = this.allNoteDirs.indexOf(noteDir);
        let nextId;
        if (id === 0) {
          nextId = id + 1;
        } else if (id === this.allNoteDirs.length - 1) {
          nextId = this.allNoteDirs.length - 2;
        } else {
          nextId = id + 1;
        }
        gotoDir = this.allNoteDirs[nextId];
      }
      if (gotoDir) {
        await this._changeNote(gotoDir);
        if (isEnableConsole) {
          console.log('will goto this noteDir: ', gotoDir);
        }
      }

      // clear tab
      const id = this.fixedNoteDirs.indexOf(noteDir);
      if (id >= 0) {
        this.fixedNoteDirs.splice(id, 1);
        if (isEnableConsole) {
          console.log('close this noteDir: ', noteDir);
        }
      } else if (noteDir === this.tempNoteDir) {
        this.tempNoteDir = '';
      }
    },

    fixThisNoteDir(noteDir) {
      console.log(noteDir, this.curFileDir);
      if (this.fixedNoteDirs.includes(noteDir)) {
        return;
      }
      if (this.fixedNoteDirs.length < this.maxFixedNum) {
        if (noteDir === this.tempNoteDir) {
          this.tempNoteDir = '';
        }
        this.fixedNoteDirs.push(noteDir);
        if (isEnableConsole) {
          console.log('fix note dir: ', noteDir);
        }
      } else {
        this.editor.messager.warning('标签已满');
      }
    },

    calWholeDir(noteDir) {
      const lastDir = noteDir.split('/')[2];
      let num = 0;
      for (const dir of this.allNoteDirs) {
        if (dir.split('/')[2] === lastDir) {
          num += 1;
        }
      }
      return num >= 2 ? noteDir : '';
    },

    // change note
    async _changeNote(noteDir) {
      // save & record cursor position
      // As long as the notedir is switched, saving will be triggered
      // regardless of whether the current note has changed.
      // beacuse we need to save the cursor position
      // change note
      if (this.curFilePathArr && this.curFilePathArr.length) {
        await this.editor.runCommand('SAVE', {
          triggerType: 'SWITCH_TAB',
        });
      }

      this.$store.commit(
        'updateGotoThisCatalog',
        noteDir.split('/').slice(0, 3)
      );
    },

    // 创建页面
    createPage(isTemp) {
      if (isTemp) {
        // console.log(`临时${Number.parseInt(1 + (Math.random() * 10000), 10).toString(16)}`); // 后面是16进制字符串
        // 打开临时目录
        const tempPathArr = ['.ink', 'basic', 'temp'];
        if (this.curFileDir !== '.ink/basic/temp/temp.md') { // ⚠️硬编码
          this.fixThisNoteDir(this.curFileDir);
        }
        this.$store.commit('updateGotoThisCatalog', tempPathArr);
        this.$messager.warning('您进入了快速目录哦');
      } else {
        this.inkCommon.plugins.catalog.createCatalog();
      }
    },

    // 卸载网页时
    onbeforeunload() {
      // console.log(123, this.fixedNoteDirs, this.curFilePath, this.curFilePathArr);
      const quickOpendDir = this.fixedNoteDirs.concat();
      // quickOpendDir.push(`${this.curFilePathArr[0]}/${this.curFilePathArr[1]}/${this.curFilePathArr[2]}/`);

      localStorage.setItem('quickOpendDir', JSON.stringify(quickOpendDir));
      // console.log(123, JSON.stringify(quickOpendDir));
    },
  },
  mounted() {
    if (isEnableConsole) {
      console.log('mounted');
    }
    window.addEventListener('beforeunload', this.onbeforeunload);

    const lastQuickOpendDir = Array.from(new Set(JSON.parse(localStorage.getItem('quickOpendDir')))).filter(i => i);
    if (lastQuickOpendDir && lastQuickOpendDir.length) {
      setTimeout(() => {
        this.fixedNoteDirs = lastQuickOpendDir;
      }, 0);
    }
  },

  beforeDestroy() {
    window.removeEventListener('beforeunload', this.onbeforeunload);
  },

  destroyed() {
    if (isEnableConsole) {
      console.log('destroyed');
    }
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#quick-open-bar {
  display: flex;
  height: 30px;
  width: 100%;
  padding: 0px;
  margin: 0px;
  color: $tool-page-color;
  background: transparent;
  align-items: center;
  font-size: $font-size-sidebar;
  overflow-x: auto;
  .bar-placeholder {
    height: 100%;
    width: 100%;
    list-style: none;
    background: $tool-page-bg;
    // backdrop-filter: blur(10px);
    flex-grow: 0;
    flex-shrink: 999;
  }
  .item {
    position: relative;
    float: left;
    flex-basis: 160px;
    flex-grow: 0;
    height: 100%;
    line-height: 30px;
    padding: 0px 12px 0px 4px;
    text-align: center;
    box-sizing: border-box;
    background: darken($color: $tool-page-bg, $amount: 1.5);
    color: $comment-color;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-style: italic;
    cursor: pointer;
    &::selection {
      background: transparent !important;
    }
  }
  .add {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 30px;
    font-size: 15px;
    cursor: pointer;
  }
  .active {
    background: $editor-bg !important;
  }
  .fixed {
    font-style: normal;
    color: $tool-page-color;
  }
  .whole-dir {
    color: $comment-color !important;
    font-size: $font-size-sidebar - 1px;
    &::selection {
      background: transparent !important;
    }
  }
  .close-button {
    position: absolute;
    width: 20px;
    height: 100%;
    right: 1px;
    top: 0;
    font-size: $font-size-sidebar + 4px;
    &:hover {
      color: $active-color;
    }
    &::selection {
      background: transparent !important;
    }
  }
  .note-icon {
    height: 54%;
    padding-right: 2px;
    &::selection {
      background: transparent !important;
    }
  }
}
</style>
