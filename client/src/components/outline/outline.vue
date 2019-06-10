<template>
  <div id="outline">
    <div id="outline-headers">
      <div
        v-for="(h, k) of headers"
        v-if="h[0] > 0 && h[0] <= showLvTo"
        :key="k"
        :class="`header header-${h.slice(0, 1)} line-${k}`"
      >
        {{ h.slice(2) }}
      </div>
    </div>
  </div>
</template>
<script>
import Vue from 'vue';
import _ from 'lodash';
import $ from 'jquery';

const lines = {};

export default {
  name: 'outline',
  data() {
    return {
      headers: {},
      selectedHeader: null,
      showLvTo: 3,
      lastFocusedLine: undefined,
    };
  },
  mounted() {
    setInterval(() => {
      if (window.lineHeaders) {
        // console.log(window.lineHeaders);
        Object.assign(lines, _.cloneDeep(window.lineHeaders));
        window.lineHeaders = {};
        const t1 = new Date().valueOf();
        Object.entries(lines).forEach((line) => {
          if (line[1][0] !== '0') {
            Vue.set(this.headers, line[0], line[1]);
          }
        });
        // console.info('refresh outline: ', new Date().valueOf() - t1);
      }
      if (window.focusedLine !== this.lastFocusedLine) {
        let findLine = window.focusedLine;
        $('#outline-headers .header').removeClass('active');
        const outlineHeaders = document.querySelector('#outline-headers');
        let prev = outlineHeaders.querySelector(`.line-${findLine}`);
        while (!prev && findLine >= 0) {
          findLine -= 1;
          prev = outlineHeaders.querySelector(`.line-${findLine}`);
        }
        if (prev) {
          prev.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
          prev.classList.add('active');
        }
        this.lastFocusedLine = window.focusedLine;
      }
    }, 1000);
  },
};
</script>

<style lang="scss" scoped>
@import '../../assets/css/colors.scss';
#outline {
  width: 100%;
  height: 100%;
}
#outline-headers {
  font-size: 13px;
}
.header {
  cursor: pointer;
  padding: 4px 0px 4px 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 1px dashed #eee;
  transition: background 0.2s;
  &:hover {
    background: #f0f0f0;
  }
  &.active {
    background: #eee;
  }
}
.header-1 {
  color: $header-1;
}
.header-1:not(:first-of-type) {
  margin-top: 20px !important;
}
.header-2 {
  color: $header-2;
}
.header-3 {
  padding-left: 30px;
  color: $header-3;
}
.header-4 {
  padding-left: 60px;
  color: $header-4;
}
.header-5 {
  padding-left: 90px;
  color: $header-5;
}
</style>

