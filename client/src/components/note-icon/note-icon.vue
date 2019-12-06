<template>
  <img
    :src="`${staticIconUrl}${iconName}.png`"
    @error="imgLoadError"
    :class="{ 'note-icon': true, 'no-default-icon': isDefaultIconNotFound }"
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
      isDefaultIconTried: false,
      isDefaultIconNotFound: false,
    };
  },
  props: {
    iconName: String,
  },
  methods: {
    // When icon loading fails
    imgLoadError(e) {
      if (!this.isDefaultIconTried) {
        e.target.src = this.defaultIconUrl;
        this.isDefaultIconTried = true;
      } else {
        this.isDefaultIconNotFound = true;
        console.warn('没有找到默认图标');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.note-icon {
  vertical-align: middle;
}
.no-default-icon {
  visibility: hidden;
}
</style>
