<template>
  <img
    :src="`${staticIconUrl}${noteName}.png`"
    @error="imgLoadError"
    class="note-icon"
  />
</template>
<script>
import config from '@/config';

export default {
  name: 'note-icon',
  data() {
    return {
      staticIconUrl: config.server.staticIconUrl, // icon server url
      defaultIconUrl: `${config.server.staticIconUrl}${config.defaultIconName}`, // default icon file url
    };
  },
  props: {
    noteName: String,
  },
  methods: {
    // When icon loading fails
    imgLoadError(e) {
      e.target.src = this.defaultIconUrl;
    },
  },
};
</script>

<style lang="scss" scoped>
.note-icon {
  vertical-align: middle;
}
</style>
