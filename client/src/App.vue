<template>
  <div id="app">
    <!-- main body -->
    <div id="main">
      <side-bar id="side-bar" v-show="isShowSideBar"></side-bar>
      <note-content id="note-content" :class="{'zen-mode': isZenMode }"></note-content>
    </div>

    <!-- status-bar-->
    <status-bar id="status-bar" v-show="isShowStatusBar"></status-bar>

    <!-- background image -->
    <div id="bgimg-container" v-show="isShowBgImg">
      <img :src="`${staticIconUrl}${bgImgName}.${bgImgFormat}`" @error="imgLoadError" />
    </div>

    <!-- modal -->
    <!--tabindex="1" is a trick, enables div to bind keydown event-->
    <div
      id="modal"
      v-show="$store.state.isProhibitOperation"
      ref="modal"
      tabindex="1"
    ></div>
  </div>
</template>

<script>
import SideBar from '@/views/sidebar/sidebar.vue';
import NoteContent from '@/views/content/content.vue';
import StatusBar from '@/views/status-bar/status-bar.vue';
import store from '@/store';
import config from '@/config';

export default {
  name: 'note',
  store,
  components: {
    SideBar,
    NoteContent,
    StatusBar,
  },
  data() {
    return {
      staticIconUrl: config.server.staticIconUrl, // 背景图服务器地址
      isShowBgImg: false, // 是否显示背景图
      bgImgName: config.bgImgName, // 背景图名字
      bgImgFormat: 'jpg', // 背景图格式
      isZenMode: false, // is zen mode
      isShowSideBar: true,
      isShowStatusBar: true,
    };
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

    // bind hot key
    bindHotKey() {
      document.addEventListener('keydown', (e) => {
        // ctrl + /: toggle zen mode
        if (e.ctrlKey && e.keyCode === 191) {
          e.preventDefault();
          this.toggleZenMode();
        }
      });
    },

    // zen mode
    toggleZenMode() {
      if (this.isZenMode) {
        this.isShowSideBar = true;
        this.isShowStatusBar = true;
        localStorage.setItem('isZenMode', 'OFF');
      } else {
        this.isShowSideBar = false;
        this.isShowStatusBar = false;
        localStorage.setItem('isZenMode', 'ON');
      }
      this.isZenMode = !this.isZenMode;
    },
  },
  created() {
    const isZenMode = localStorage.getItem('isZenMode');
    if (isZenMode) {
      this.isZenMode = !(isZenMode === 'ON');
      this.toggleZenMode();
    }
  },
  mounted() {
    // this is the first keydown event
    // we can set window.IS_PORHIBIT_KEY_DOWN to true to block all keydown events
    // eslint-disable-next-line consistent-return
    // ⚠️ Unable to block keydown event for pop-up window
    // eslint-disable-next-line consistent-return
    this.$refs.modal.addEventListener('keydown', (e) => {
      if (window.IS_PORHIBIT_KEY_DOWN) {
        e.stopPropagation();
        e.preventDefault();
        return false;
      }
    });
    this.bindHotKey();
    setTimeout(() => {
      this.isShowBgImg = true;
    }, 300);
  },
};
</script>

<style lang="scss">
@import '@/themes/craft/var.scss';
// common
* {
  font-family: $font-family-main;
}
::selection {
  background: $selection !important;
}
::-webkit-scrollbar {
  width: $scrollbar-width;
  height: $scrollbar-height;
}

::-webkit-scrollbar-thumb {
  background: $scrollbar-bg !important;
  border-radius: $scrollbar-radius !important;
  &:hover {
    background: $scrollbar-bg-hover !important;
  }
}

input,
textarea {
  font-size: $font-size-main;
}

// app
#app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: $app-bg;
}

// main body
#main {
  width: 100%;
  // 使用height而非flex-basis, 是为了防止子元素撑破父元素高度(参见flex-basis章节)
  // 而设置为10%(而非100%), 是因为ios上, 100%高度无法被shrink压缩, 会而导致高度溢出
  height: 10%;
  flex-grow: 1;
  z-index: 10;
  #side-bar {
    float: left;
    height: 100%;
    overflow: auto;
  }
  #note-content {
    display: block;
    height: 100%;
  }
  #note-content.zen-mode {
    max-width: 1040px;
    margin: 0 auto;
  }
}

// status-bar
#status-bar {
  width: 100%;
  flex-grow: 0;
  flex-shrink: 0;
  line-height: 24px;
  flex-basis: 24px;
  z-index: 10;
}

// background image
#bgimg-container {
  position: fixed;
  left: 0px;
  top: 0px;
  right: 0px;
  bottom: 0px;
  z-index: 0;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

// modal
#modal {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: $catalog-modal-bg;
  cursor: wait;
  z-index: 500; // Do not cover the pop-up window used to create the file
}
</style>

