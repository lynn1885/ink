<template>
  <div id="game">
    <div v-for="(gameLine, index) in gameLines" :class="['game-line', 'level-'+gameLine.level]" :key="index">
      <div class="item index">{{index + 1}}</div>
      <div class="item text">{{gameLine.text}}</div>
      <div class="item time">{{gameLine.time}}</div>
      <div class="item note">{{gameLine.note}}</div>
      <div class="item point">{{gameLine.point}}</div>
    </div>
  </div>
</template>
<script>

export default {
  name: 'game',
  data() {
    return {
      editor: null,
      updateTimer: null,
      updateDelay: 500,
      gameLines: []
    };
  },

  watch: {
    // eslint-disable-next-line func-names
    '$store.state.editor': {
      immediate: true,
      handler(value) {
        if (value) {
          this.editor = value;
          this.editor.on('changes', this.changesHandler);
        }
      },
    },
  },


  methods: {
    changesHandler() {
      clearTimeout(this.updateTimer);
      this.updateTimer = setTimeout(() => {
        this.isContentChanged = false;
        // ⭐获取全文，读取全文
        const noteStr = this.editor.cm.getValue();
        const noteLines = noteStr.split('\n');
        const gameLines = [];
        noteLines.forEach((line) => {
          const gameLineObj = {};
          line.split('; ').forEach((kv) => {
            const [k, v] = kv.split(':');
            switch (k) {
              case 'n':
                gameLineObj.text = v;
                break;
              case 't':
                gameLineObj.time = v;
                break;
              case 'l':
                gameLineObj.level = v;
                break;
              case 'p':
                gameLineObj.point = v;
                break;
              case 'note':
                gameLineObj.note = v;
                break;
              default:
                break;
            }
          });
          gameLines.push(gameLineObj);
        });
        this.gameLines = gameLines;
      }, this.updateDelay);
    },
  },

  destroyed() {
    this.editor.off('changes', this.changesHandler);
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#game {
  .game-line {
     display: flex;
     padding: 2px 4px;
     &.level-1 {
       background: rgb(223, 234, 241);
       color: rgb(96, 181, 235);
     }
      &.level-2 {
       background: rgb(255, 254, 210);
       color: rgb(189, 165, 32);
     }
    .item {
       margin-right: 4px;
     }
     .index {
       width: 20px;
       height: 20px;
       line-height: 20px;
       text-align: center;
       background: rgb(223, 219, 219);
       border-radius: 100px;
       font-size: 12px;
     }
     .text {

     }
  }

}

</style>
