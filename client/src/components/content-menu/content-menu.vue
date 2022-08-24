<template>
  <ul id="content-menu">
    <slot name="menu-list"></slot>
  </ul>
</template>
<script>
export default {
  name: 'outline',
  data() {
    return {};
  },
  mounted() {

  },
};
</script>

<style lang="scss" scoped>
@import "@/themes/craft/var.scss";
#content-menu {
  position: fixed;
  left: 200px;
  top: 200px;
  width: 140px;
  background: $content-menu-bg;
  color: $content-menu-color;
  border-radius: 3px;
  box-shadow: $content-menu-shadow;
  list-style: none;
  margin: 10px 0;
  padding: 0;
  z-index: 200;
  li {
    padding: 6px 10px;
    border-bottom: $content-menu-border-bottom;
    &:hover {
      background: $content-menu-active-bg;
      color: $content-menu-active-color;
      cursor: pointer;
    }
    &:last-child {
      border-bottom: none;
    }
  }
}

</style>

