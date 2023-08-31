<template>
  <div
    id="sticky-note"
    ref="sticky-note"
  >
    <div
      id="title"
      draggable="true"
      @dragstart="dragNoteStart"
      @drag="dragNote"
      @dragend="dragNoteEnd"
    > </div>
    <textarea
      contenteditable="true"
      :maxlength="maxlength"
      @keydown="saveNoteContent"
      placeholder="Can only enter up to 1000 words"
      ref="textarea"
    ></textarea>
  </div>
</template>
<script>
import $ from 'jquery';
import tools from '@/tools/tools';

const isEnableConsole = true;

export default {
  name: 'sticky-note',
  data() {
    return {
      maxlength: 1000, // max length
      setNoteTimer: null, // save sticky note timeout id
      oriClientX: null,
      oriClientY: null,
      oriOffsetRight: null,
      oriOffsetTop: null,
      filePath: '.ink/basic/sticky note/sticky note.md'
    };
  },
  methods: {
    // get note content from storage
    async loadNoteContent() {
      const fileContent = await tools.loadFile(this.filePath, this.$message);
      localStorage.setItem('stickyNoteContent', fileContent);
      this.$refs.textarea.value = fileContent;
    },

    // set note content to localstorage
    // 第二个参数是节流秒数
    saveNoteContent(e, interval = 2000) {
      if (e && e.ctrlKey && e.keyCode === 83) {
        // prevent ctrl-s
        e.preventDefault();
        return;
      }

      if (interval) { // 节流保存
        clearTimeout(this.setNoteTimer);
        this.setNoteTimer = setTimeout(() => {
          tools.saveFile({
            path: this.filePath,
            data: this.$refs.textarea.value
          }, this.$message);
          localStorage.setItem('stickyNoteContent', this.$refs.textarea.value);
        }, interval);
      } else { // 立即保存
        clearTimeout(this.setNoteTimer);
        tools.saveFile({
          path: this.filePath,
          data: this.$refs.textarea.value
        }, this.$message);
        localStorage.setItem('stickyNoteContent', this.$refs.textarea.value);
      }
    },

    // drag
    dragNoteStart(e) {
      this.oriClientX = e.clientX;
      this.oriClientY = e.clientY;
      const stickyNote = $(this.$refs['sticky-note']);
      this.oriOffsetRight = Number.parseInt(stickyNote.css('right'), 10);
      this.oriOffsetTop = Number.parseInt(stickyNote.css('top'), 10);
    },
    dragNote(e) {
      if (e.clientX && e.clientY) {
        const movDistanceX = e.clientX - this.oriClientX;
        const movDistanceY = e.clientY - this.oriClientY;
        const stickyNote = $(this.$refs['sticky-note']);
        stickyNote.css('right', `${this.oriOffsetRight - movDistanceX}px`);
        stickyNote.css('top', `${this.oriOffsetTop + movDistanceY}px`);
      }
    },
    dragNoteEnd(e) {
      const movDistanceX = e.clientX - this.oriClientX;
      const movDistanceY = e.clientY - this.oriClientY;
      const stickyNote = $(this.$refs['sticky-note']);
      stickyNote.css('right', `${this.oriOffsetRight - movDistanceX}px`);
      stickyNote.css('top', `${this.oriOffsetTop + movDistanceY}px`);
      localStorage.setItem('offsetRight', this.oriOffsetRight - movDistanceX);
      localStorage.setItem('offsetTop', this.oriOffsetTop + movDistanceY);
    },
  },
  mounted() {
    if (isEnableConsole) {
      console.log('sticky note mounted');
    }
    const stickyNote = $(this.$refs['sticky-note']);
    // stickyNote.css('right', `${localStorage.getItem('offsetRight') || 10}px`);
    // stickyNote.css('top', `${localStorage.getItem('offsetTop') || 10}px`);
    stickyNote.css('right', '10px');
    stickyNote.css('top', '10px');
    this.loadNoteContent();
    this.$refs.textarea.focus();
  },

  beforeDestroy() {
    this.saveNoteContent(null, 0); // 立即保存
    if (isEnableConsole) {
      console.log('sticky note destroy');
    }
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#sticky-note {
  position: fixed;
  right: 10px;
  top: 10px;
  z-index: $above-float-window-index;
  width: 240px;
  height: 240px;
  box-shadow: $float-box-shadow;
  border-radius: 2px;
  background: $sticky-note-bg;
  backdrop-filter: blur(8px) saturate(200%);
  #title {
    height: 10px;
    cursor: move;
  }
  textarea {
    width: 100%;
    height: 220px;
    padding: 0px 10px 10px 10px;
    border: none;
    outline-style: none;
    box-sizing: border-box;
    background: transparent;
    color: $sticky-note-color;
    font-size: $font-size-main - 1px;
    overflow: auto;
    resize: none;
  }
}
</style>
