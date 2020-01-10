<template>
  <img
    :src="`${staticIconsUrl}${iconName}.png`"
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
      staticIconsUrl: config.server.staticIconsUrl, // icon server url
      defaultIconUrl: `${config.server.staticIconsUrl}${config.defaultIconName}`, // default icon file url
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
