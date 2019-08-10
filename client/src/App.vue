<template>
  <div id="app">
    <!-- main body -->
    <div id="main">
      <side-bar class="side-bar"></side-bar>
      <note-content class="note-content"></note-content>
    </div>

    <!-- status-bar-->
    <status-bar id="status-bar"></status-bar>

    <!-- sticky note -->
    <sticky-note v-if="isShowStickyNote"></sticky-note>

    <!-- background image -->
    <div id="bgimg-container" v-show="isShowBgImg">
      <img
        :src="`${staticIconUrl}${bgImgName}.${bgImgFormat}`"
        @error="imgLoadError"
        >
    </div>
  </div>
</template>

<script>
import SideBar from '@/views/sidebar/sidebar.vue';
import NoteContent from '@/views/content/content.vue';
import StatusBar from '@/views/status-bar/status-bar.vue';
import StickyNote from '@/views/sticky-note/sticky-note.vue';
import store from '@/store';
import config from '@/config';

export default {
  name: 'note',
  store,
  components: {
    SideBar,
    NoteContent,
    StatusBar,
    StickyNote,
  },
  data() {
    return {
      staticIconUrl: config.server.staticIconUrl, // 背景图服务器地址
      isShowBgImg: false, // 是否显示背景图
      bgImgName: '_background', // 背景图名字
      bgImgFormat: 'jpg', // 背景图格式
    };
  },
  computed: {
    // is show sticky note
    isShowStickyNote() {
      return this.$store.state.isShowStickyNote;
    },
  },
  methods: {
    // 背景图: jpg格式加载失败时, 尝试加载png, gif格式
    imgLoadError(e) {
      if (this.bgImgFormat === 'jpg') {
        this.bgImgFormat = 'png';
        e.target.src = `${this.staticIconUrl}${this.bgImgName}.${this.bgImgFormat}`;
      } else if (this.bgImgFormat === 'png') {
        this.bgImgFormat = 'gif';
        e.target.src = `${this.staticIconUrl}${this.bgImgName}.${this.bgImgFormat}`;
      } else {
        e.target.style.visibility = 'hidden';
      }
    },
  },
  mounted() {
    setTimeout(() => {
      this.isShowBgImg = true;
    }, 300);
  },
};
</script>

<style lang="scss">
@import "@/themes/craft/var.scss";
#app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

// main body
#main {
  width: 100%;
  height: 100%;
  flex-grow: 1;
  .side-bar {
    float: left;
    height: 100%;
    overflow: auto;
  }
  .note-content {
    display: block;
    height: 100%;
  }
}

// status-bar
#status-bar {
  width: 100%;
  flex-grow: 0;
  line-height: 24px;
  flex-basis: 24px;
}

// sticky-note
#sticky-note {
  position: fixed;
  right: 16px;
  top: 16px;
  z-index: 100;
}

// background image
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

