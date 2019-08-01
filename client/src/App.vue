<template>
  <div id="app">
    <side-bar id="side-bar"></side-bar>
    <note-content id="note-content"></note-content>
    <div id="bgimg-container" v-show="isShowBgImg">
      <img :src="staticIconUrl + '_background.jpg'">
    </div>
  </div>
</template>

<script>
import SideBar from '@/views/sidebar/sidebar.vue';
import NoteContent from '@/views/content/content.vue';
import store from '@/store';
import config from '@/config';

export default {
  name: 'note',
  store,
  components: {
    SideBar,
    NoteContent,
  },
  data() {
    return {
      staticIconUrl: config.server.staticIconUrl,
      isShowBgImg: false,
    };
  },
  methods: {
  },
  mounted() {
    setTimeout(() => {
      this.isShowBgImg = true;
    }, 300);
  },
};
</script>

<style lang="scss">
#app {
  width: 100%;
  height: 100%;
}
#side-bar {
  float: left;
  height: 100%;
  overflow: auto;
}
#note-content {
  display: block;
  height: 100%;
}
#bgimg-container {
  position: fixed;
  left: 0px;
  top: 0px;
  right: 0px;
  bottom: 0px;
  z-index: -1;
  img {
    width: 100%;
    height: 100%;
  }
}
</style>

