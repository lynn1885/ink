<template>
  <div id="app">
    <side-bar id="side-bar"></side-bar>
    <note-content id="note-content"></note-content>
  </div>
</template>

<script>
import SideBar from '@/views/sidebar/sidebar.vue';
import NoteContent from '@/views/content/content.vue';
import store from '@/store';

export default {
  name: 'note',
  store,
  components: {
    SideBar,
    NoteContent,
  },
  methods: {
  },

  async created() {
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
</style>

