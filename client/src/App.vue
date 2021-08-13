<template>
  <div id="app" :class="{'zen-mode-app': isZenMode }">
    <!-- main body -->
    <div id="main">
      <side-bar id="side-bar" :class="{'hide': !isShowSideBar}"></side-bar>
      <note-content id="note-content"></note-content>
      <img src="/imgs/fluorescent-pen.png" class="zen-mode-item fluorescent-pen">
      <img src="/imgs/ruler.png" class="zen-mode-item ruler">
    </div>

    <!-- status-bar-->
    <status-bar id="status-bar" :class="{'hide': !isShowStatusBar}"></status-bar>

    <!-- background image -->
    <div id="bgimg-container" v-show="isShowBgImg">
      <!-- 用于测试背景图片是否存在 -->
      <img class="test-bg" :src="curBgImgSrc" @error="imgLoadError" />
      <!-- 用于真正显示背景 -->
      <img v-show="realBgImgSrc" class="real-bg" :src="realBgImgSrc"/>
    </div>

    <!-- modal -->
    <!--tabindex="1" is a trick, enables div to bind keydown event-->
    <div id="modal" v-show="$store.state.isProhibitOperation" ref="modal" tabindex="1"></div>

    <!-- 音频播放器 -->
    <audio src="" id="ink-audio-player"></audio>


  </div>
</template>

<script>
import $ from 'jquery';
import SideBar from '@/views/sidebar/sidebar.vue';
import NoteContent from '@/views/content/content.vue';
import StatusBar from '@/views/status-bar/status-bar.vue';
import store from '@/store';
import config from '@/config';
import UserConfig from '@/models/user-config';
import Files from '@/models/files';

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
      staticIconsUrl: config.server.staticIconsUrl, // 背景图服务器地址
      isShowBgImg: false, // 是否显示背景图
      bgImgName: config.bgImgName, // 背景图名字
      possibleBgImgSrc: [], // 可能可以使用的背景图地图
      curBgImgIndex: 0, // 当前选用的背景图index
      curBgImgSrc: '', // 当前选用的背景图地址, 可能该地址并不指向一张可显示的图片
      realBgImgSrc: '', // 当前真正使用的背景图片
      changeBgImgTimer: null, // 更换真正使用背景的倒计时器
      isZenMode: false, // is zen mode
      isShowSideBar: true,
      isShowStatusBar: true,
      defaultTheme: null,
      defaultThemeStyleEl: $('<link rel="stylesheet"></link>'),
      noteThemeStyleEl: $('<link rel="stylesheet"></link>'),
    };
  },
  watch: {
    // change note theme
    '$store.state.curNoteTheme': {
      immediate: true,
      handler(value) {
        if (value) {
          this.noteThemeStyleEl.attr(
            'href',
            `${config.server.staticPluginsUrl}themes/${value}/index.css`
          );
          $('head').append(this.noteThemeStyleEl);
          setTimeout(() => {
            this.defaultThemeStyleEl.remove();
          }, 0);
        } else {
          $('head').append(this.defaultThemeStyleEl);
          setTimeout(() => {
            this.noteThemeStyleEl.remove();
          }, 0);
        }
      },
    },

    // change night mode
    '$store.state.isNightModeOn': {
      handler(value) {
        if (value === true) {
          this.defaultThemeStyleEl.attr(
            'href',
            `${config.server.staticPluginsUrl}themes/night/index.css`
          );
        } else if (value === false) {
          this.defaultThemeStyleEl.attr(
            'href',
            `${config.server.staticPluginsUrl}themes/${this.defaultTheme}/index.css`
          );
        }
      },
    },

    // 监听当前路径
    '$store.state.curCatalogArr': {
      handler(value) {
        this.calculateCurBgImg(value);
      }
    }
  },
  methods: {
    // 计算当前笔记背景图数组
    calculateCurBgImg(curCatalogArr) {
      let bgNamesArr = curCatalogArr.concat(); // 复制一份
      bgNamesArr = bgNamesArr
        .filter(item => item)
        .map((item, index, arr) => `__${arr.slice(0, index + 1).join('-')}__`)
        .reverse();
      bgNamesArr.push(this.bgImgName); // 可能使用的背景图的名字

      const bgFormats = ['jpg', 'png', 'gif']; // 可能使用的背景图格式

      const possibleBgImgSrc = []; // 可是使用的背景地址

      bgNamesArr.forEach((bgName) => {
        bgFormats.forEach((bgFormat) => {
          possibleBgImgSrc.push(`${this.staticIconsUrl}${bgName}.${bgFormat}`);
        });
      });

      this.possibleBgImgSrc = possibleBgImgSrc;
      this.curBgImgIndex = 0;
      this.curBgImgSrc = './';
    },

    // 测试背景图: 一张加载失败时, 尝试加载另一张
    imgLoadError() {
      if (this.curBgImgIndex < this.possibleBgImgSrc.length + 1) {
        clearTimeout(this.changeBgImgTimer);
        this.curBgImgSrc = this.possibleBgImgSrc[this.curBgImgIndex];
        this.curBgImgIndex += 1;
        this.changeBgImgTimer = setTimeout(() => {
          if (this.curBgImg) this.realBgImgSrc = this.curBgImgSrc;
        }, 200);
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
      } else {
        this.isShowSideBar = false;
        this.isShowStatusBar = false;
      }
      this.isZenMode = !this.isZenMode;
    },

    // get default theme
    async getDefaultTheme() {
      $('head').append(this.defaultThemeStyleEl);
      await UserConfig.get(['theme', 'default'])
        .then((data) => {
          this.defaultTheme = data;
          this.defaultThemeStyleEl.attr(
            'href',
            `${config.server.staticPluginsUrl}themes/${data}/index.css`
          );
        })
        .catch(() => {
          console.warn('cannot find default theme');
        });
    },
  },
  async mounted() {
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
    await this.getDefaultTheme();

    // After opening the software for 3 seconds, get all files for caching these notes in memory
    setTimeout(async () => {
      const startTime = Date.now();
      await Files.getAllFilesInfo();
      console.log(`It tooks ${((Date.now() - startTime) / 1000).toFixed(2)}s to cache all notes into memory`);
    }, 3000);
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
  .zen-mode-item {
    display: none;
  }
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

}
// side-bar
#side-bar {
  &.hide {
    width: 0px!important;
    height: 0px!important;
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
  &.hide {
    width: 0px;
    height: 0px;
    flex-basis: 0px;
  }
}

// background image
#bgimg-container {
  position: fixed;
  left: 0px;
  top: 0px;
  right: 0px;
  bottom: 0px;
  z-index: 0;
  .test-bg {
    width: 0px;
    height: 0px;
    visibility: hidden;
  }
  .real-bg {
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

// zen-mode
.zen-mode-app {
  #main {
    background-image: url('/imgs/wood.jpg');
    overflow: hidden;
  }
  .CodeMirror {
    background-color: rgb(254, 253, 252)!important;
    padding: 0px!important;
  }
  /* .CodeMirror-sizer {
    background-image: url('/imgs/paper.jpg')!important;
  } */
   #note-content {
    max-width: 1040px;
    margin: 0 auto;
    margin-top: 100px;
    box-shadow: 0px -2px 4px 0px rgb(221, 211, 193);
    z-index: 10;
  }

  #quick-open-bar {
    backdrop-filter: blur(4px);
  }

  .zen-mode-item {
    display: block!important;
    position: fixed;
    z-index: 1000;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      filter: brightness(1.05);
      transition: all 0.2s;
    }
    &.fluorescent-pen {
      width: 50px;
      right: 100px;
      top: 340px;
      transform: rotateZ(-50deg);
    }
    &.ruler {
      width: 300px;
      left: 0px;
      top: 0px;
      z-index: 9;
    }
  }
}
</style>

