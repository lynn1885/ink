<template>
  <div id="note-map">
    <img src="http://localhost:12340/images/624/629008161.png" alt="" style="left: 10px; top: 100px; width: 300px;">

  </div>
</template>
<script>
const isEnableConsole = false;

export default {
  name: 'note-map',
  data() {
    return {
      editor: null,

    };
  },

  watch: {
    // eslint-disable-next-line func-names
    '$store.state.editor': {
      immediate: true,
      handler(value) {
        if (value) {
          this.editor = value;
          if (isEnableConsole) {
            console.log('get editor', this.editor);
          }
        }
      },
    },
  },

  methods: {

  },

  created() {
    if (isEnableConsole) {
      console.log('created');
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
#note-map {
  background: rgb(223, 247, 215);
  width: 1000px;
  height: 1000px;
  overflow: auto;
  position: relative;
  img {
    position: absolute;
  }
}
</style>
