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
  data() {
    return {
      editor: null,
      curFilePath: '',
      curFileDir: '',
      fixedNoteDirs: [],
      tempNoteDir: '',
      maxFixedNum: 7,
      closeButtonClass: 'close-button',
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

    // eslint-disable-next-line func-names
    '$store.state.curFilePath': {
      immediate: true,
      handler(value) {
        if (value) {
          if (isEnableConsole) {
            console.log('curFilePath changed:', value);
          }
          this.curFilePath = value;
          const curFilePathArr = this.curFilePath.split('/');
          this.curFileDir = `${curFilePathArr[0]}/${curFilePathArr[1]}/${
            curFilePathArr[2]
          }/`;
          if (!this.fixedNoteDirs.includes(this.curFileDir)) {
            this.tempNoteDir = this.curFileDir;
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
              typeof value[dirArr[0]][dirArr[1]][
                dirArr[2]
              ] === 'object'
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
        this.editor.messager.warning('只剩最后一个标签页, 不能再关闭了');
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
      // As long as the notedir is switched, save will be triggered
      // regardless of whether the current note has changed.
      // Used to save the cursor position
      await this.$store.state.editor.runCommand('SAVE', {
        triggerType: 'SWITCH_TAB',
      });

      // change note
      this.$store.commit(
        'updateGotoThisCatalog',
        noteDir.split('/').slice(0, 3)
      );
    },
  },
  mounted() {
    if (isEnableConsole) {
      console.log('mounted');
    }
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
  .active {
    background: $editor-bg!important;
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
