<template>
  <textarea
    id="sticky-note"
    contenteditable="true"
    ref="sticky-note"
    :maxlength="maxlength"
    @keydown="setNoteContent"
    placeholder="Can only enter up to 1000 words"
    >
  </textarea>
</template>
<script>
const isEnableConsole = true;

export default {
  name: 'sticky-note',
  data() {
    return {
      maxlength: 1000, // max length
      setNoteTimer: null, // save sticky note timeout id
      setNoteInterval: 2000,
      localStorageKey: 'stickyNoteContent',
    };
  },
  methods: {
    // get note content from storage
    getNoteContent() {
      this.$refs['sticky-note'].value = localStorage.getItem(this.localStorageKey);
    },

    // set note content to localstorage
    setNoteContent(e) {
      if (e.ctrlKey && e.keyCode === 83) { // prevent ctrl-s
        e.preventDefault();
        return;
      }
      clearTimeout(this.setNoteTimer);
      this.setNoteTimer = setTimeout(() => {
        localStorage.setItem(this.localStorageKey, this.$refs['sticky-note'].value);
      }, this.setNoteInterval);
    },
  },
  mounted() {
    if (isEnableConsole) {
      console.log('sticky note mounted');
    }
    this.getNoteContent();
    this.$refs['sticky-note'].focus();
  },

  beforeDestroy() {
    clearTimeout(this.setNoteTimer);
    localStorage.setItem(this.localStorageKey, this.$refs['sticky-note'].value);
    if (isEnableConsole) {
      console.log('sticky note destroy');
    }
  },
};
</script>

<style lang="scss" scoped>
@import "@/themes/craft/var.scss";
#sticky-note {
  width: 240px;
  height: 240px;
  padding: 10px;
  border: none;
  outline-style: none;
  box-sizing: border-box;
  background: $sticky-note-bg;
  color: $sticky-note-color;
  font-size: $font-size-main - 1px;
  border-radius: 2px;
  box-shadow: $float-box-shadow;
  overflow: auto;
  resize: none;
}

</style>
